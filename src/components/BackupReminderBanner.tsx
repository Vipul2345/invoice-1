import React, { useState } from 'react';
import { PlanTier } from '../types';
import { exportBackupFile } from '../lib/storage';
import { HardDrive, Download, HelpCircle, X, ShieldAlert } from 'lucide-react';

interface BackupReminderBannerProps {
  plan: PlanTier;
  onLearnMore?: () => void;
}

export const BackupReminderBanner: React.FC<BackupReminderBannerProps> = ({
  plan,
  onLearnMore,
}) => {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('invoiceflow_dismiss_backup_banner') === 'true';
    } catch {
      return false;
    }
  });

  // Only show for Free users who haven't dismissed it in the current session
  if (plan !== 'free' || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem('invoiceflow_dismiss_backup_banner', 'true');
    } catch {
      // ignore
    }
  };

  const handleExport = () => {
    exportBackupFile();
  };

  return (
    <div className="no-print bg-neutral-900 text-white rounded-xl p-4 sm:p-4.5 border border-neutral-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-neutral-800 rounded-lg text-neutral-300 shrink-0 mt-0.5">
          <HardDrive className="w-4 h-4" />
        </div>
        <div className="space-y-0.5 pr-6 sm:pr-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-tight text-white">
              Your data is stored locally
            </span>
            <span className="text-[10px] font-mono text-neutral-400 bg-neutral-800 px-1.5 py-0.5 rounded">
              Free Plan
            </span>
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed max-w-2xl">
            InvoiceFlow Free stores your data on this device. Consider exporting a backup to protect against device loss or data deletion.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={handleExport}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-neutral-950 bg-white hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Backup</span>
        </button>

        {onLearnMore && (
          <button
            type="button"
            onClick={onLearnMore}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
          >
            <span>Learn About Backups</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleDismiss}
          className="text-neutral-400 hover:text-white p-1 ml-1 cursor-pointer"
          title="Dismiss for this session"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
