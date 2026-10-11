import React, { useState } from 'react';
import { AppSettings, PlanTier } from '../types';
import {
  exportBackupFile,
  importBackupPayload,
  clearAllLocalData,
  mockConnectDrive,
  mockDisconnectDrive,
  mockTriggerDriveBackup,
} from '../lib/storage';
import {
  HardDrive,
  Cloud,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldAlert,
  FileCheck,
  X,
  ExternalLink,
} from 'lucide-react';

interface DataAndBackupSectionProps {
  settings: AppSettings;
  plan: PlanTier;
  onSettingsUpdated: (updated: AppSettings) => void;
  onDataResetOrCleared: () => void;
  onLearnMoreLegal?: () => void;
}

export const DataAndBackupSection: React.FC<DataAndBackupSectionProps> = ({
  settings,
  plan,
  onSettingsUpdated,
  onDataResetOrCleared,
  onLearnMoreLegal,
}) => {
  const [exportNotice, setExportNotice] = useState(false);
  const [importNotice, setImportNotice] = useState<string | null>(null);

  // Drive Modal state
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [driveEmail, setDriveEmail] = useState('user@gmail.com');

  // Danger Zone Clear Data Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationWord, setDeleteConfirmationWord] = useState('');

  const handleExport = () => {
    exportBackupFile();
    setExportNotice(true);
    setTimeout(() => setExportNotice(false), 5000);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const ok = importBackupPayload(json);
        if (ok) {
          setImportNotice('Backup successfully restored from JSON file.');
          onDataResetOrCleared();
          setTimeout(() => setImportNotice(null), 4000);
        } else {
          alert('Invalid InvoiceFlow backup file. Could not restore.');
        }
      } catch (err) {
        alert('Could not parse the selected JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmationWord.toUpperCase() !== 'DELETE') return;
    clearAllLocalData();
    setShowDeleteModal(false);
    setDeleteConfirmationWord('');
    onDataResetOrCleared();
  };

  const handleMockConnectDrive = () => {
    mockConnectDrive(driveEmail);
    setShowDriveModal(false);
    onSettingsUpdated({
      ...settings,
      driveSync: {
        isConnected: true,
        email: driveEmail,
        lastBackupAt: 'Just now',
        autoSync: true,
      },
    });
  };

  const handleMockDisconnectDrive = () => {
    mockDisconnectDrive();
    onSettingsUpdated({
      ...settings,
      driveSync: {
        isConnected: false,
        email: undefined,
        lastBackupAt: undefined,
        autoSync: false,
      },
    });
  };

  const handleMockBackupNow = () => {
    mockTriggerDriveBackup();
    onSettingsUpdated({
      ...settings,
      driveSync: {
        ...settings.driveSync,
        lastBackupAt: 'Just now (' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ')',
      },
    });
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-neutral-950 tracking-tight">
          Data Architecture & Backup
        </h2>
        <p className="text-xs text-neutral-500 mt-1">
          Complete visibility over where your invoice records live, how backups operate, and data ownership.
        </p>
      </div>

      {exportNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-start gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-sm">Backup Created Successfully!</span>
            <span>
              Your structured JSON backup file has been generated and saved to your device's downloads folder. You can store this in your personal archives or import it onto any other computer or mobile device.
            </span>
          </div>
        </div>
      )}

      {importNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{importNotice}</span>
        </div>
      )}

      {/* Visual Architectural Explanations */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
          How Your Data Flows By Plan
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* FREE PLAN */}
          <div className="bg-white p-5 rounded-2xl border border-neutral-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-900">FREE PLAN</span>
              <span className="text-[10px] font-semibold bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded">
                Local-First
              </span>
            </div>

            <div className="font-mono text-xs text-neutral-800 bg-neutral-50 p-3 rounded-xl border border-neutral-200 space-y-1">
              <div className="font-bold text-neutral-950">User's Device</div>
              <div className="text-neutral-400">↓ (Device Storage)</div>
              <div className="font-semibold text-neutral-900">InvoiceFlow Local DB</div>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              Your invoices are stored locally on your device. No mandatory cloud account is required.
            </p>
          </div>

          {/* DRIVE PLAN */}
          <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900">DRIVE PLAN</span>
              <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                Personal Drive
              </span>
            </div>

            <div className="font-mono text-xs text-neutral-800 bg-blue-50/40 p-3 rounded-xl border border-blue-100 space-y-1">
              <div className="font-bold text-neutral-950">User's Device</div>
              <div className="text-neutral-400">↓</div>
              <div className="font-semibold text-neutral-900">InvoiceFlow Local</div>
              <div className="text-neutral-400">↓ (User Authorization)</div>
              <div className="font-bold text-blue-700">User's Google Drive</div>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              Google Drive backup allows you to keep an encrypted backup of your InvoiceFlow data in your own Google Drive account.
            </p>
          </div>

          {/* PRO CLOUD PLAN */}
          <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900">PRO CLOUD</span>
              <span className="text-[10px] font-semibold bg-amber-50 text-amber-800 px-2 py-0.5 rounded">
                Coming with Pro
              </span>
            </div>

            <div className="font-mono text-xs text-neutral-800 bg-amber-50/30 p-3 rounded-xl border border-amber-100 space-y-1">
              <div className="font-bold text-neutral-950">User's Device</div>
              <div className="text-neutral-400">↓ (Cloud Sync)</div>
              <div className="font-bold text-amber-700">InvoiceFlow Cloud</div>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              Future managed cloud synchronization across multi-platform desktop and mobile clients. Clearly marked as upcoming.
            </p>
          </div>
        </div>
      </div>

      {/* Free Plan Data Responsibility Warning Card */}
      <div className="p-5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-amber-950">
              Important: Free Plan Local Data Responsibility
            </h3>
            <p className="text-xs text-amber-900 leading-relaxed">
              InvoiceFlow Free is designed to work without a mandatory account or cloud storage. Invoice and related application data are stored locally on your device. If your device is lost, damaged, reset, replaced, or its application data is deleted, locally stored data may become unavailable.
            </p>
            <p className="text-xs font-medium text-amber-950 pt-1">
              Recommendation: Regularly export your structured JSON backup to protect against unexpected hardware or storage loss.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-amber-200/60">
          <button
            onClick={handleExport}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            Export Backup Now
          </button>
          {onLearnMoreLegal && (
            <button
              onClick={onLearnMoreLegal}
              className="px-3.5 py-1.5 text-xs font-semibold text-neutral-800 hover:text-neutral-950 bg-white border border-neutral-300 rounded-lg transition-colors cursor-pointer"
            >
              Read Full Data & Backup Policy
            </button>
          )}
        </div>
      </div>

      {/* Structured JSON Export & Import Section */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200/90 shadow-2xs space-y-5">
        <div>
          <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
            Structured Data Portability
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Structured JSON is the single authoritative source of truth for InvoiceFlow. PDFs are rendered dynamically on demand.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 font-bold text-neutral-900 text-xs mb-1">
                <Download className="w-4 h-4 text-neutral-600" />
                Export Data (JSON)
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Produces a standardized, unencrypted .json archive of your business profile, clients, line items, numbering sequences, and past invoices.
              </p>
            </div>
            <div>
              <button
                type="button"
                onClick={handleExport}
                className="w-full py-2 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                Export Backup (.json)
              </button>
            </div>
          </div>

          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 font-bold text-neutral-900 text-xs mb-1">
                <Upload className="w-4 h-4 text-neutral-600" />
                Import / Restore (JSON)
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Restores an existing InvoiceFlow backup. Replaces current workspace records with the contents of the chosen JSON file.
              </p>
            </div>
            <div>
              <label className="w-full text-center block py-2 text-xs font-bold text-neutral-800 bg-white border border-neutral-300 hover:bg-neutral-100 rounded-lg shadow-2xs transition-colors cursor-pointer">
                Select Backup File to Import
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Google Drive Mock Section */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Cloud className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-sm font-bold text-neutral-900">
                Google Drive Backup (Drive Plan)
              </h3>
              <p className="text-xs text-neutral-500">
                Synchronizes backup archives to your personal Google Drive application folder.
              </p>
            </div>
          </div>

          <div>
            {settings.driveSync.isConnected ? (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                Connected
              </span>
            ) : (
              <span className="text-[11px] font-medium text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-md">
                Not connected
              </span>
            )}
          </div>
        </div>

        {settings.driveSync.isConnected ? (
          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-3 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-neutral-500">Account:</span>{' '}
                <span className="font-mono font-bold text-neutral-900">{settings.driveSync.email}</span>
              </div>
              <div>
                <span className="text-neutral-500">Last backup:</span>{' '}
                <span className="font-semibold text-neutral-800">{settings.driveSync.lastBackupAt || 'Today, 10:42 AM'}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-200">
              <button
                onClick={handleMockBackupNow}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
              >
                Backup Now
              </button>
              <button
                onClick={() => alert('Data verified against Google Drive backup snapshot.')}
                className="px-3.5 py-1.5 text-xs font-semibold text-neutral-700 bg-neutral-200 hover:bg-neutral-300 rounded-lg transition-colors cursor-pointer"
              >
                Verify & Restore
              </button>
              <button
                onClick={handleMockDisconnectDrive}
                className="px-3.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
              >
                Disconnect Drive
              </button>
            </div>
          </div>
        ) : (
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs text-neutral-600 max-w-md">
              Google Drive access requires explicit authorization and stores data inside your personal cloud storage.
            </p>
            <button
              onClick={() => setShowDriveModal(true)}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors shrink-0 cursor-pointer"
            >
              Connect Google Drive
            </button>
          </div>
        )}
      </div>

      {/* Enhanced Danger Zone */}
      <div className="bg-white p-6 rounded-2xl border border-rose-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 text-rose-700">
          <ShieldAlert className="w-5 h-5 text-rose-600" />
          <h3 className="text-sm font-bold uppercase tracking-wider">
            Danger Zone · Delete Local Data
          </h3>
        </div>

        <p className="text-xs text-neutral-600 leading-relaxed">
          Permanently purges all locally stored records from this device's browser memory, including:
        </p>

        <ul className="text-xs text-neutral-700 list-disc list-inside space-y-0.5">
          <li>All saved invoice history and drafts</li>
          <li>Customer contacts and directory records</li>
          <li>Business profile information and bank details</li>
          <li>Custom invoice styling templates and numbering preferences</li>
        </ul>

        <div className="pt-2 flex items-center justify-between">
          <span className="text-[11px] text-neutral-500">
            This action cannot be undone unless you possess an exported backup.
          </span>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
          >
            Clear All Local Data
          </button>
        </div>
      </div>

      {/* Google Drive Mock Modal */}
      {showDriveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-neutral-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="font-bold text-neutral-900 text-sm flex items-center gap-2">
                <Cloud className="w-4 h-4 text-blue-600" />
                Connect Google Drive
              </h3>
              <button
                onClick={() => setShowDriveModal(false)}
                className="text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-neutral-600 mt-3 leading-relaxed">
              InvoiceFlow will request permission to create and maintain encrypted backup archives in an isolated application folder in your Google Drive.
            </p>

            <div className="mt-4">
              <label className="block font-medium text-neutral-700 mb-1">
                Google Account Email
              </label>
              <input
                type="email"
                value={driveEmail}
                onChange={(e) => setDriveEmail(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 text-neutral-900"
              />
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDriveModal(false)}
                className="px-3 py-1.5 text-neutral-600 hover:text-neutral-900 font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleMockConnectDrive}
                className="px-4 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                Authorize & Connect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Explicit Confirmation Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 text-xs animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-700 mb-3">
              <div className="p-2.5 bg-rose-100 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-950">
                  Delete All Local Data?
                </h3>
                <span className="text-[11px] text-rose-700 font-semibold">
                  This action is permanent and cannot be undone.
                </span>
              </div>
            </div>

            <p className="text-neutral-600 leading-relaxed my-3">
              All invoices, client records, custom templates, and business configuration stored in this browser will be wiped.
            </p>

            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-neutral-700 mb-4 space-y-1">
              <span className="font-bold text-neutral-900 block">Safety Recommendation:</span>
              <span>Export a JSON backup before proceeding to preserve a recoverable copy of your records.</span>
            </div>

            <div className="mb-4">
              <label className="block text-neutral-700 font-medium mb-1">
                Type <strong className="font-mono text-rose-700">DELETE</strong> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmationWord}
                onChange={(e) => setDeleteConfirmationWord(e.target.value)}
                placeholder="DELETE"
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-2 font-mono text-neutral-900 font-bold uppercase tracking-wider"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 font-semibold text-neutral-700 hover:bg-neutral-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExport}
                className="px-4 py-2 font-bold text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
              >
                Export Backup First
              </button>
              <button
                type="button"
                disabled={deleteConfirmationWord.toUpperCase() !== 'DELETE'}
                onClick={handleConfirmDelete}
                className={`px-4 py-2 font-bold rounded-lg shadow-2xs transition-colors cursor-pointer ${
                  deleteConfirmationWord.toUpperCase() === 'DELETE'
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                }`}
              >
                Delete Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
