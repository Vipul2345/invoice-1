import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { Invoice, Quotation } from '../types';

export interface GeneratePdfOptions {
  invoice?: Invoice;
  quotation?: Quotation;
  elementId?: string;
  shareTitle?: string;
  shareText?: string;
  onProgress?: (status: string) => void;
}

/**
 * Detects whether the current environment supports native file sharing (attaching actual PDF files to apps like WhatsApp/Gmail).
 */
export function canShareFilesDirectly(): boolean {
  if (Capacitor.isNativePlatform()) return true;
  if (typeof navigator === 'undefined' || typeof navigator.canShare !== 'function') return false;
  try {
    const testFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    return navigator.canShare({ files: [testFile] });
  } catch {
    return false;
  }
}

export interface RenderedPdfResult {
  pdf: jsPDF;
  pdfBlob: Blob;
  safeFilename: string;
  docNumber: string;
  docTypeLabel: string;
  customerName: string;
  summaryText: string;
}

/**
 * Core renderer that rasterizes an invoice/quotation DOM element into an A4 jsPDF instance.
 */
export async function renderDocumentPdf({
  invoice,
  quotation,
  elementId = invoice ? 'invoice-document' : 'quotation-document',
  onProgress,
}: GeneratePdfOptions): Promise<RenderedPdfResult> {
  onProgress?.('Preparing document...');

  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Document element #${elementId} not found`);
  }

  onProgress?.('Rendering high-resolution document...');

  // Ensure all images within the document are loaded prior to rasterization
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

  // Lock width to 800px so mobile screens render the full A4 layout cleanly
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
    // Multi-page handling if document is long
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

  const docNumber = invoice?.invoiceNumber || quotation?.quotationNumber || 'Document';
  const docTypeLabel = quotation ? 'Quotation' : 'Invoice';
  const safeFilename = `${docNumber}.pdf`.replace(/[^a-zA-Z0-9._-]/g, '_');
  const customerName = invoice?.customerSnapshot?.name || quotation?.customerSnapshot?.name || 'Customer';
  const summaryText = `${docTypeLabel} ${docNumber} for ${customerName}`;
  const pdfBlob = pdf.output('blob');

  return {
    pdf,
    pdfBlob,
    safeFilename,
    docNumber,
    docTypeLabel,
    customerName,
    summaryText,
  };
}

/**
 * Generates an A4 PDF from a DOM element and downloads it directly to disk/device.
 */
export async function downloadDocumentPdf(
  options: GeneratePdfOptions
): Promise<{ success: boolean; method: string; error?: string }> {
  try {
    const { pdf, pdfBlob, safeFilename, docTypeLabel, docNumber, customerName } = await renderDocumentPdf(options);

    options.onProgress?.('Saving file...');

    // 1. Android / iOS native Capacitor runtime
    if (Capacitor.isNativePlatform()) {
      try {
        const base64Data = pdf.output('datauristring').split(',')[1];
        
        const writeResult = await Filesystem.writeFile({
          path: safeFilename,
          data: base64Data,
          directory: Directory.Cache,
          recursive: true,
        });

        // Trigger native system share/save dialog
        await Share.share({
          title: safeFilename,
          text: `${docTypeLabel} ${docNumber} for ${customerName}`,
          url: writeResult.uri,
          files: [writeResult.uri],
          dialogTitle: `Save or Share ${docTypeLabel} PDF`,
        });

        return { success: true, method: 'capacitor-share' };
      } catch (nativeErr) {
        console.warn('Native write/share failed, falling back to Web API', nativeErr);
      }
    }

    // 2. Direct browser download (Blob URL anchor tag)
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

/**
 * Generates an A4 PDF and triggers the native OS Share Sheet (WhatsApp, Gmail, Messages, Drive, etc.).
 * Fully free, zero third-party messaging APIs required.
 */
export async function shareDocumentPdf(
  options: GeneratePdfOptions
): Promise<{ success: boolean; method: string; fallbackToDownload?: boolean; error?: string }> {
  try {
    const { pdf, pdfBlob, safeFilename, docNumber, docTypeLabel, customerName, summaryText } =
      await renderDocumentPdf(options);

    const finalShareTitle = options.shareTitle || `${docTypeLabel} ${docNumber}`;
    const finalShareText = options.shareText || summaryText;

    options.onProgress?.('Opening share sheet with PDF attached...');

    // 1. Android / iOS Capacitor Native Share
    if (Capacitor.isNativePlatform()) {
      try {
        const base64Data = pdf.output('datauristring').split(',')[1];
        const writeResult = await Filesystem.writeFile({
          path: safeFilename,
          data: base64Data,
          directory: Directory.Cache,
          recursive: true,
        });

        await Share.share({
          title: finalShareTitle,
          text: finalShareText,
          url: writeResult.uri,
          files: [writeResult.uri],
          dialogTitle: `Share ${docTypeLabel} (${docNumber}) with PDF Attached`,
        });

        return { success: true, method: 'capacitor-share' };
      } catch (err: any) {
        if (err?.name === 'AbortError' || err?.message?.includes('canceled') || err?.message?.includes('cancelled')) {
          return { success: true, method: 'user-canceled' };
        }
        console.warn('Capacitor share failed:', err);
      }
    }

    // 2. Web Share API with File object (Chrome, Edge, Safari on Android, iOS, Windows, macOS)
    const pdfFile = new File([pdfBlob], safeFilename, { type: 'application/pdf' });

    if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      try {
        await navigator.share({
          files: [pdfFile],
          title: finalShareTitle,
          text: finalShareText,
        });
        return { success: true, method: 'web-share-file' };
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          return { success: true, method: 'user-canceled' };
        }
        console.warn('navigator.share with files failed:', err);
      }
    }

    // 3. Web Share API with text/title only (if browser supports share but not files)
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        // Also download the PDF so the user has the physical file ready to attach
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

        await navigator.share({
          title: finalShareTitle,
          text: finalShareText,
        });
        return { success: true, method: 'web-share-text' };
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          return { success: true, method: 'user-canceled' };
        }
      }
    }

    // 4. Fallback for desktop browsers without native Web Share API
    // Automatically download the file so the user has it, and signal the UI to display direct web links
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

    return {
      success: true,
      method: 'download-fallback',
      fallbackToDownload: true,
    };
  } catch (error) {
    console.error('Failed to share PDF:', error);
    return {
      success: false,
      method: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error during sharing',
    };
  }
}

/**
 * Backwards compatible helper for invoices
 */
export async function downloadInvoicePdf(
  options: { invoice: Invoice; elementId?: string; onProgress?: (status: string) => void }
) {
  return downloadDocumentPdf({
    invoice: options.invoice,
    elementId: options.elementId || 'invoice-document',
    onProgress: options.onProgress,
  });
}

/**
 * Dedicated share helper for invoices with PDF attachment and message support
 */
export async function shareInvoicePdf(
  options: {
    invoice: Invoice;
    elementId?: string;
    shareTitle?: string;
    shareText?: string;
    onProgress?: (status: string) => void;
  }
) {
  return shareDocumentPdf({
    invoice: options.invoice,
    elementId: options.elementId || 'invoice-document',
    shareTitle: options.shareTitle,
    shareText: options.shareText,
    onProgress: options.onProgress,
  });
}

/**
 * Dedicated download helper for quotations
 */
export async function downloadQuotationPdf(
  options: { quotation: Quotation; elementId?: string; onProgress?: (status: string) => void }
) {
  return downloadDocumentPdf({
    quotation: options.quotation,
    elementId: options.elementId || 'quotation-document',
    onProgress: options.onProgress,
  });
}

/**
 * Dedicated share helper for quotations with PDF attachment and message support
 */
export async function shareQuotationPdf(
  options: {
    quotation: Quotation;
    elementId?: string;
    shareTitle?: string;
    shareText?: string;
    onProgress?: (status: string) => void;
  }
) {
  return shareDocumentPdf({
    quotation: options.quotation,
    elementId: options.elementId || 'quotation-document',
    shareTitle: options.shareTitle,
    shareText: options.shareText,
    onProgress: options.onProgress,
  });
}
