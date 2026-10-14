import React from 'react';
import { Cloud, HardDrive, ShieldCheck, Lock, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { mockConnectDrive } from '../lib/storage';
import { showToast } from './ToastNotification';

interface DrivePermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPermissionGranted?: () => void;
}

export const DrivePermissionModal: React.FC<DrivePermissionModalProps> = ({
  isOpen,
  onClose,
  onPermissionGranted,
}) => {
  const { currentUser, grantDrivePermission } = useAuth();

  if (!isOpen) return null;

  const handleGrant = async () => {
    try {
      await grantDrivePermission();
      mockConnectDrive(currentUser?.email || 'user@gmail.com');
      showToast('✓ Google Drive permission granted! Backups enabled.', 'success');
      onPermissionGranted?.();
      onClose();
    } catch (err: any) {
      showToast('Failed to grant Drive permission: ' + (err.message || 'Unknown error'), 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-neutral-200 relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-neutral-400 hover:text-neutral-700 p-1.5 rounded-full hover:bg-neutral-100 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 shadow-2xs">
            <HardDrive className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
              Drive Plan Authorization
            </span>
            <h2 className="text-xl font-extrabold text-neutral-900 tracking-tight mt-0.5">
              Google Drive Permission
            </h2>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed mb-5">
          You are on the <strong>Drive Plan</strong>. To automatically archive and synchronize your invoices, quotations, and customer records, InvoiceFlow requires your permission to connect to your personal Google Drive account.
        </p>

        {/* Permissions Scope Breakdown */}
        <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200/90 space-y-3 mb-5 text-xs text-neutral-700">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-neutral-900 block">Create & Save Backup Files</strong>
              <span>Saves encrypted JSON archives of your invoices and quotations directly into your personal Google Drive storage.</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-neutral-900 block">Edit & Modify Previous Backups</strong>
              <span>Updates existing backup files whenever you create, edit, or delete invoices to ensure your data stays fresh.</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-neutral-900 block">Strict Privacy & App Isolation</strong>
              <span>InvoiceFlow only accesses files created by this application (<code className="font-mono bg-neutral-200/60 px-1 py-0.5 rounded text-[11px]">drive.file</code> scope). It cannot view, read, or alter your personal Google Docs, photos, or other drive files.</span>
            </div>
          </div>
        </div>

        {/* Watermark & Ads Notice for Drive Plan */}
        <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 mb-6 flex items-start gap-2">
          <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
          <span>
            <strong>Note:</strong> The Drive Plan includes Google Drive backup and multi-device restore. Watermarks and sponsored ads remain active on this plan. To enjoy 100% unbranded, ad-free exports, upgrade to the <strong>Pro Gold Program</strong>.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handleGrant}
            className="w-full sm:flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Cloud className="w-4 h-4" />
            <span>Grant Permission & Enable Drive Backup</span>
          </button>
          <button
            onClick={onClose}
            className="w-full sm:w-auto py-3 px-4 bg-white hover:bg-neutral-50 text-neutral-700 font-semibold text-xs sm:text-sm rounded-xl border border-neutral-300 transition-colors cursor-pointer text-center"
          >
            Decide Later
          </button>
        </div>
      </div>
    </div>
  );
};
