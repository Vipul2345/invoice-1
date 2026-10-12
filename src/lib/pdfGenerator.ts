import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Invoice } from '../types';

export interface GeneratePdfOptions {
  invoice: Invoice;
  elementId?: string;
  onProgress?: (status: string) => void;
}

/**
 * Generates an A4 PDF from the invoice DOM element and downloads/shares it.
 * Works seamlessly across Android (Capacitor), mobile web, and desktop.
 */
export async function downloadInvoicePdf({
  invoice,
  elementId = 'invoice-document',
  onProgress,
}: GeneratePdfOptions): Promise<{ success: boolean; method: string; error?: string }> {
  try {
    onProgress?.('Preparing document...');

    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Invoice element #${elementId} not found`);
    }

    onProgress?.('Rendering high-resolution invoice...');

    // Ensure all images within the invoice are loaded prior to rasterization
    const images = element.getElementsByTagName('img');
    await Promise.all(
      Array.from(images).map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      })
    );

    // A4 width in pixels at standard 96 DPI is ~794px, height is ~1123px.
    // We clone the document and lock the width to 800px so mobile screens render the full A4 layout.
    const canvas = await html2canvas(element, {
      scale: 2, // 2x retina sharpness for crystal-clear text & lines
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1024,
      onclone: (clonedDoc) => {
        const clonedEl = clonedDoc.getElementById(elementId);
        if (clonedEl) {
          clonedEl.style.width = '800px';
          clonedEl.style.minWidth = '800px';
          clonedEl.style.maxWidth = '800px';
          clonedEl.style.transform = 'none';
          clonedEl.style.boxShadow = 'none';
          clonedEl.style.margin = '0';
          clonedEl.style.borderRadius = '0';
          // Ensure all text and elements inside are visible
          clonedEl.classList.remove('shadow-md', 'shadow-xl', 'rounded-lg');
        }
      },
    });

    onProgress?.('Building PDF...');

    // A4 dimensions in mm: 210 x 297
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

    // Calculate height of image maintaining aspect ratio
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    if (imgHeight <= pdfHeight) {
      // Single page - fit on page
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
    } else {
      // Multi-page handling if invoice is long
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }
    }

    const safeFilename = `${invoice.invoiceNumber || 'Invoice'}.pdf`.replace(/[^a-zA-Z0-9._-]/g, '_');

    onProgress?.('Saving file...');

    // 1. Android / iOS native Capacitor runtime
    if (Capacitor.isNativePlatform()) {
      try {
        const base64Data = pdf.output('datauristring').split(',')[1];
        
        // Write to Cache directory first for reliable sharing
        const writeResult = await Filesystem.writeFile({
          path: safeFilename,
          data: base64Data,
          directory: Directory.Cache,
          recursive: true,
        });

        // Trigger native Android system sheet (supports Save to Device, Print, Drive, WhatsApp, etc.)
        await Share.share({
          title: safeFilename,
          text: `Invoice ${invoice.invoiceNumber} for ${invoice.customerSnapshot?.name || 'Customer'}`,
          url: writeResult.uri,
          dialogTitle: 'Save or Share Invoice PDF',
        });

        return { success: true, method: 'capacitor-share' };
      } catch (nativeErr) {
        console.warn('Native write/share failed, falling back to Web API', nativeErr);
      }
    }

    // 2. Mobile Web / Browser supporting Web Share API with files (Android Chrome, etc.)
    const pdfBlob = pdf.output('blob');
    const pdfFile = new File([pdfBlob], safeFilename, { type: 'application/pdf' });

    if (
      typeof navigator !== 'undefined' &&
      navigator.canShare &&
      navigator.canShare({ files: [pdfFile] }) &&
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    ) {
      try {
        await navigator.share({
          files: [pdfFile],
          title: safeFilename,
          text: `Invoice ${invoice.invoiceNumber}`,
        });
        return { success: true, method: 'web-share' };
      } catch (shareErr) {
        if ((shareErr as Error).name !== 'AbortError') {
          console.warn('Web Share failed, proceeding with direct download', shareErr);
        }
      }
    }

    // 3. Direct browser download (Blob URL anchor tag)
    const blobUrl = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = safeFilename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    }, 2000);

    return { success: true, method: 'browser-download' };
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    return {
      success: false,
      method: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error generating PDF',
    };
  }
}
