/**
 * Image processing and validation utilities for InvoiceFlow offline logo support.
 */

export const MAX_LOGO_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const SUPPORTED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
export const SUPPORTED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'];

export interface ProcessedLogoResult {
  dataUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
  fileName: string;
}

/**
 * Validates file format and file size.
 * Returns an error message string if invalid, or null if valid.
 */
export function validateLogoFile(file: File): string | null {
  if (!file) {
    return 'No file selected.';
  }

  // Validate size
  if (file.size > MAX_LOGO_FILE_SIZE_BYTES) {
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    return `File size is too large (${sizeInMb} MB). Maximum allowed size is 5 MB.`;
  }

  // Validate MIME type
  const isMimeSupported = SUPPORTED_LOGO_TYPES.includes(file.type.toLowerCase());
  const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
  const isExtSupported = SUPPORTED_EXTENSIONS.includes(ext);

  if (!isMimeSupported && !isExtSupported) {
    return 'Unsupported file format. Please upload a PNG, JPG, or WebP image.';
  }

  return null;
}

/**
 * Reads and optimizes the uploaded logo file.
 * Resizes images exceeding 1000px dimension proportionally to preserve high DPI
 * while maintaining a compact local storage footprint (typically 50KB - 200KB).
 */
export async function processLogoFile(file: File): Promise<ProcessedLogoResult> {
  const validationError = validateLogoFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('Failed to read image file from disk.'));
    };

    reader.onload = (e) => {
      const rawDataUrl = e.target?.result as string;
      if (!rawDataUrl) {
        reject(new Error('Failed to parse image data.'));
        return;
      }

      const img = new Image();
      img.onerror = () => {
        reject(new Error('The image file appears to be corrupted or invalid.'));
      };

      img.onload = () => {
        try {
          const maxDimension = 1000;
          let targetWidth = img.width;
          let targetHeight = img.height;

          // Scale down if dimensions exceed 1000px
          if (targetWidth > maxDimension || targetHeight > maxDimension) {
            if (targetWidth > targetHeight) {
              targetHeight = Math.round((targetHeight * maxDimension) / targetWidth);
              targetWidth = maxDimension;
            } else {
              targetWidth = Math.round((targetWidth * maxDimension) / targetHeight);
              targetHeight = maxDimension;
            }
          }

          // Render to canvas to create clean, optimized base64
          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            // Fallback to raw dataUrl if canvas context is unavailable
            resolve({
              dataUrl: rawDataUrl,
              width: img.width,
              height: img.height,
              sizeBytes: file.size,
              fileName: file.name,
            });
            return;
          }

          // Use high quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

          // If original was PNG, preserve transparency by saving as PNG, otherwise JPEG at 0.92
          const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
          const outputMime = isPng ? 'image/png' : 'image/jpeg';
          const optimizedDataUrl = canvas.toDataURL(outputMime, 0.92);

          resolve({
            dataUrl: optimizedDataUrl,
            width: targetWidth,
            height: targetHeight,
            sizeBytes: Math.round((optimizedDataUrl.length * 3) / 4),
            fileName: file.name,
          });
        } catch (canvasErr) {
          // If canvas fails, fallback safely to raw dataUrl
          resolve({
            dataUrl: rawDataUrl,
            width: img.width,
            height: img.height,
            sizeBytes: file.size,
            fileName: file.name,
          });
        }
      };

      img.src = rawDataUrl;
    };

    reader.readAsDataURL(file);
  });
}
