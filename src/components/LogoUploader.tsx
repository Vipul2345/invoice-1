import React, { useRef, useState } from 'react';
import { Upload, Trash2, RefreshCw, AlertCircle, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { processLogoFile } from '../lib/imageUtils';

interface LogoUploaderProps {
  logoUrl?: string;
  onLogoChange: (newLogoUrl: string | undefined) => void;
  disabled?: boolean;
  compact?: boolean;
}

export const LogoUploader: React.FC<LogoUploaderProps> = ({
  logoUrl,
  onLogoChange,
  disabled = false,
  compact = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be selected again if needed
    e.target.value = '';

    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await processLogoFile(file);
      onLogoChange(result.dataUrl);
      setSuccessMessage('Logo uploaded and saved successfully.');
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      console.error('Logo upload error:', err);
      setErrorMessage(err.message || 'Failed to process logo. Please try another image.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Are you sure you want to remove your company logo?')) {
      onLogoChange(undefined);
      setErrorMessage(null);
      setSuccessMessage('Company logo removed.');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const triggerUpload = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setErrorMessage(null);
    fileInputRef.current?.click();
  };

  if (compact) {
    return (
      <div className="space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || isProcessing}
        />

        <div className="flex items-center gap-3">
          {logoUrl ? (
            <div className="relative w-16 h-12 bg-neutral-100 rounded-lg border border-neutral-200 flex items-center justify-center p-1 overflow-hidden shrink-0">
              <img
                src={logoUrl}
                alt="Company Logo Preview"
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ) : (
            <div className="w-16 h-12 bg-neutral-100 rounded-lg border border-dashed border-neutral-300 flex items-center justify-center text-neutral-400 shrink-0">
              <ImageIcon className="w-5 h-5" />
            </div>
          )}

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={triggerUpload}
              disabled={disabled || isProcessing}
              className="px-2.5 py-1 text-xs font-semibold text-neutral-800 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              {logoUrl ? (
                <>
                  <RefreshCw className={`w-3 h-3 ${isProcessing ? 'animate-spin' : ''}`} />
                  Replace
                </>
              ) : (
                <>
                  <Upload className={`w-3 h-3 ${isProcessing ? 'animate-spin' : ''}`} />
                  Upload
                </>
              )}
            </button>

            {logoUrl && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={disabled || isProcessing}
                className="px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-md transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                title="Remove Logo"
              >
                <Trash2 className="w-3 h-3" />
                Remove
              </button>
            )}
          </div>
        </div>

        {errorMessage && (
          <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
            <AlertCircle className="w-3 h-3 shrink-0" /> {errorMessage}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isProcessing}
      />

      {/* Main Logo Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
        <div className="flex items-center gap-4">
          {/* Logo Preview Container */}
          <div className="w-24 h-20 bg-white rounded-lg border border-neutral-300 shadow-2xs flex items-center justify-center p-2 overflow-hidden shrink-0 relative group">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Company Logo Preview"
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-neutral-400">
                <ImageIcon className="w-7 h-7 stroke-1" />
                <span className="text-[10px] mt-1 font-medium">No Logo</span>
              </div>
            )}
          </div>

          <div>
            <h4 className="text-sm font-bold text-neutral-900">
              {logoUrl ? 'Company Logo' : 'Upload Company Logo'}
            </h4>
            <p className="text-xs text-neutral-500 mt-0.5">
              Formats: PNG, JPG, WebP (up to 5 MB). Stored locally & offline.
            </p>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Automatically appears on all invoices and PDF downloads.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          {logoUrl ? (
            <>
              <button
                type="button"
                onClick={triggerUpload}
                disabled={disabled || isProcessing}
                className="px-3 py-2 text-xs font-semibold text-neutral-800 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                {isProcessing ? 'Processing...' : 'Replace Logo'}
              </button>

              <button
                type="button"
                onClick={handleRemove}
                disabled={disabled || isProcessing}
                className="px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={triggerUpload}
              disabled={disabled || isProcessing}
              className="px-4 py-2 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Upload className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
              {isProcessing ? 'Processing...' : 'Upload Logo'}
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
    </div>
  );
};
