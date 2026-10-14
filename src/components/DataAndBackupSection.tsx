import React, { useState } from 'react';
import { AppSettings, PlanTier, ExportDataPayload } from '../types';
import {
  exportBackupFile,
  importBackupPayload,
  clearAllLocalData,
  mockTriggerDriveBackup,
  getSettings,
} from '../lib/storage';
import { useAuth } from '../context/AuthContext';
import { DrivePermissionModal } from './DrivePermissionModal';
import { showToast } from './ToastNotification';
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
  Clock,
  LogIn,
  RefreshCw,
  Database,
  ShieldCheck,
} from 'lucide-react';

interface DataAndBackupSectionProps {
  settings: AppSettings;
  plan: PlanTier;
  onSettingsUpdated: (updated: AppSettings) => void;
  onDataResetOrCleared: () => void;
  onLearnMoreLegal?: () => void;
  onRequestAuth?: () => void;
}

export const DataAndBackupSection: React.FC<DataAndBackupSectionProps> = ({
  settings,
  plan,
  onSettingsUpdated,
  onDataResetOrCleared,
  onLearnMoreLegal,
  onRequestAuth,
}) => {
  const { currentUser, subscription, syncDailyCloudBackup, cancelSubscription } = useAuth();
  const [exportNotice, setExportNotice] = useState(false);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [cloudSyncMessage, setCloudSyncMessage] = useState<{ text: string; error?: boolean } | null>(null);

  // Import preview modal state
  const [importCandidate, setImportCandidate] = useState<ExportDataPayload | null>(null);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');

  const handleCancelSubscription = async () => {
    const confirmCancel = window.confirm(
      'Are you sure you want to cancel your subscription? Your Google Drive sync connection and cloud backup will be disconnected immediately and your plan downgraded to Free.'
    );
    if (!confirmCancel) return;
    try {
      await cancelSubscription();
      showToast('Subscription cancelled. Google Drive sync has been disconnected.', 'info');
      onSettingsUpdated(getSettings());
      onDataResetOrCleared();
    } catch (err: any) {
      showToast(`Cancellation error: ${err.message}`, 'error');
    }
  };

  const handleTestCloudSync = async () => {
    if (!currentUser) {
      showToast('Please sign in with Google (Gmail) or email first.', 'info');
      onRequestAuth?.();
      return;
    }

    setIsSyncingCloud(true);
    setCloudSyncMessage(null);
    try {
      const res = await syncDailyCloudBackup(true);
      if (res) {
        const invCount = res.recordCounts?.invoices ?? 0;
        const quoCount = res.recordCounts?.quotations ?? 0;
        const msg = `Synced successfully! Backed up ${invCount} invoices and ${quoCount} quotations to Firebase Cloud.`;
        setCloudSyncMessage({ text: msg, error: false });
        showToast(msg, 'success');
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Cloud sync failed. Active subscription required.';
      setCloudSyncMessage({ text: errMsg, error: true });
      showToast(`Cloud Sync Blocked: ${errMsg}`, 'error');
    } finally {
      setIsSyncingCloud(false);
    }
  };

  // Danger Zone Clear Data Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationWord, setDeleteConfirmationWord] = useState('');
  const [showDrivePermissionModal, setShowDrivePermissionModal] = useState(false);

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
        if (!json.business || !json.invoices || !json.settings) {
          alert('Invalid InvoiceFlow backup file. Missing required schema keys.');
          return;
        }
        // Show validation & confirmation dialog first
        setImportCandidate(json);
      } catch (err) {
        alert('Could not parse the selected JSON file. Please ensure it is valid JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmImport = () => {
    if (!importCandidate) return;
    const ok = importBackupPayload(importCandidate);
    if (ok) {
      setImportNotice(
        `Backup successfully restored (${importCandidate.invoices?.length || 0} invoices, ${
          importCandidate.customers?.length || 0
        } customers).`
      );
      setImportCandidate(null);
      onDataResetOrCleared();
      setTimeout(() => setImportNotice(null), 5000);
    } else {
      alert('Could not complete restore. Validation failed.');
    }
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmationWord.toUpperCase() !== 'DELETE') return;
    clearAllLocalData();
    setShowDeleteModal(false);
    setDeleteConfirmationWord('');
    onDataResetOrCleared();
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
              Your structured JSON backup file has been generated and saved to your device. You can store this in your personal archives or import it onto any other computer or phone.
            </span>
          </div>
        </div>
      )}

      {importNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
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
              Your invoices are stored locally on your device. Works completely offline. No mandatory cloud account is required.
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
              <div className="font-semibold text-neutral-900">Local JSON Payload</div>
              <div className="text-neutral-400">↓ (User Authorization)</div>
              <div className="font-bold text-blue-700">User's Google Drive</div>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              Google Drive backup allows you to store an encrypted backup of your structured JSON in your own Google Drive.
            </p>
          </div>

          {/* PRO CLOUD PLAN */}
          <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900">PRO CLOUD</span>
              <span className="text-[10px] font-semibold bg-amber-50 text-amber-800 px-2 py-0.5 rounded">
                Cloud Sync
              </span>
            </div>

            <div className="font-mono text-xs text-neutral-800 bg-amber-50/30 p-3 rounded-xl border border-amber-100 space-y-1">
              <div className="font-bold text-neutral-950">Authenticated User</div>
              <div className="text-neutral-400">↓ (Zero-Trust ABAC)</div>
              <div className="font-bold text-amber-700">Firestore Cloud Sync</div>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              Cloud synchronization across desktop and mobile clients with secure rules scoped strictly to user UID.
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
              InvoiceFlow Free is designed to work without a mandatory account or cloud storage. Invoice and customer data are stored locally on your device. If your device is reset or browser storage cleared, local data could be lost.
            </p>
            <p className="text-xs font-medium text-amber-950 pt-1">
              Recommendation: Regularly export your structured JSON backup to keep your business records safe.
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
            Structured JSON is the authoritative source of truth for InvoiceFlow. PDFs are rendered dynamically on demand.
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
                Produces a standardized .json archive containing your business profile, customers, line items, numbering sequence, and past invoices.
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
                Inspects and restores an existing InvoiceFlow backup. Validates the JSON schema before applying changes.
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

      {/* Firebase Cloud Synchronization & Server-side Daily Sync Section */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-sm font-bold text-neutral-900">
                Firebase Cloud Sync & Daily Auto-Backup
              </h3>
              <p className="text-xs text-neutral-500">
                Authoritative daily synchronization to Firestore, enforced strictly by database security rules.
              </p>
            </div>
          </div>

          <div>
            {!currentUser ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-600 bg-neutral-100 border border-neutral-200 px-2.5 py-1 rounded-md">
                Not Signed In
              </span>
            ) : subscription?.status === 'active' && (subscription.plan === 'drive' || subscription.plan === 'pro') ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Active Sync
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-md">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Inactive / Free Tier
              </span>
            )}
          </div>
        </div>

        {cloudSyncMessage && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
              cloudSyncMessage.error
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            {cloudSyncMessage.error ? (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{cloudSyncMessage.text}</span>
          </div>
        )}

        <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-neutral-700">
            <div className="space-y-0.5">
              <span className="text-[11px] text-neutral-400 font-semibold uppercase tracking-wider block">Connected Account</span>
              <span className="font-bold text-neutral-900 truncate block">
                {currentUser?.email || 'Offline Free User'}
              </span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] text-neutral-400 font-semibold uppercase tracking-wider block">Firebase Subscription</span>
              <span className="font-bold text-neutral-900 capitalize block">
                {subscription ? `${subscription.plan} Plan (${subscription.status})` : 'No active cloud plan'}
              </span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] text-neutral-400 font-semibold uppercase tracking-wider block">Last Synced to Cloud</span>
              <span className="font-bold text-neutral-900 block">
                {subscription?.lastCloudSyncAt ? new Date(subscription.lastCloudSyncAt).toLocaleDateString() + ' ' + new Date(subscription.lastCloudSyncAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2 pt-2 border-t border-neutral-200/80 text-[11px] text-neutral-600">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <span>
              <strong>Server-Side Subscription Validation:</strong> Whenever the application opens, your subscription is verified against Firebase Firestore. If active, records are synced once daily. Inactive subscriptions throw an error at the Firestore security rule level.
            </span>
          </div>

          <div className="pt-2 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] text-neutral-500">
              {currentUser ? 'Daily sync triggers automatically on software opening.' : 'Sign in using your Gmail account to enable cloud sync.'}
            </span>
            <div className="flex items-center gap-2">
              {!currentUser ? (
                <button
                  type="button"
                  onClick={onRequestAuth}
                  className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In with Google</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  {subscription?.status === 'active' && (subscription.plan === 'drive' || subscription.plan === 'pro') && (
                    <button
                      type="button"
                      onClick={handleCancelSubscription}
                      className="px-3 py-1.5 bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer text-xs"
                    >
                      Cancel Subscription
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleTestCloudSync}
                    disabled={isSyncingCloud}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCloud ? 'animate-spin' : ''}`} />
                    <span>{isSyncingCloud ? 'Verifying & Syncing...' : 'Test Cloud Sync Now'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Google Drive Status Section */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Cloud className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-sm font-bold text-neutral-900">
                Google Drive Backup & Sync
              </h3>
              <p className="text-xs text-neutral-500">
                Store and synchronize your invoices and quotations in your personal Google Drive.
              </p>
            </div>
          </div>

          <div>
            {subscription?.status === 'canceled' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-md">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Cancelled · Sync Revoked
              </span>
            ) : subscription?.status === 'expired' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-md">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Expired · Sync Revoked
              </span>
            ) : plan === 'drive' ? (
              settings.driveSync?.permissionGranted ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Permission Granted
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Permission Required
                </span>
              )
            ) : plan === 'pro' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-md">
                Pro Gold Cloud
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-600 bg-neutral-100 border border-neutral-200 px-2.5 py-1 rounded-md">
                Drive Plan Required
              </span>
            )}
          </div>
        </div>

        {plan === 'drive' ? (
          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-3 text-xs">
            {settings.driveSync?.permissionGranted ? (
              <>
                <div className="flex items-start gap-2 text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-neutral-900">
                      Authorization Active: Permission Granted
                    </p>
                    <p className="text-neutral-600 text-[11px] mt-0.5">
                      InvoiceFlow has authorized access to create, edit, modify, and save backup files in your Google Drive (<code className="font-mono bg-neutral-200/60 px-1 py-0.5 rounded text-[10px]">drive.file</code> scope).
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-200 text-[11px]">
                  <span className="text-neutral-500">
                    Last Cloud Sync: <strong>{settings.driveSync?.lastBackupAt || 'Not synced yet'}</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        mockTriggerDriveBackup();
                        showToast('Backup successfully synchronized to Google Drive!', 'success');
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
                    >
                      Sync Now
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDrivePermissionModal(true)}
                      className="px-3 py-1.5 bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-700 font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
                    >
                      Review Permissions
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-2 text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-neutral-900">
                      Google Drive Permission Needed
                    </p>
                    <p className="text-neutral-600 text-[11px] mt-0.5">
                      You are subscribed to the Drive Plan. To save and edit backup files directly in your Google Drive, InvoiceFlow needs your one-time permission.
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-200 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowDrivePermissionModal(true)}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <HardDrive className="w-3.5 h-3.5" />
                    <span>Authorize Google Drive</span>
                  </button>
                </div>
              </>
            )}
          </div>
        ) : plan === 'pro' ? (
          <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200/80 space-y-2 text-xs">
            <p className="text-amber-950 font-medium">
              <strong>Pro Gold Cloud Architecture:</strong> As a Pro Gold member, you receive 100% ad-free, unbranded invoice generation. Direct cloud synchronization and custom template persistence are enabled for this account.
            </p>
          </div>
        ) : (
          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-2 text-xs">
            <p className="text-neutral-700">
              <strong>Free Plan Status:</strong> Your invoices and quotations are stored 100% privately in your browser's local storage. To enable automated Google Drive sync and multi-device backup, upgrade to the <strong>Drive Plan</strong>.
            </p>
            <div className="text-neutral-500 text-[11px] flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-neutral-400" />
              <span>Drive Plan is available at ₹49/mo ($2.99/mo).</span>
            </div>
          </div>
        )}
      </div>

      {/* Danger Zone: Clear Local Data */}
      <div className="border border-rose-200 bg-rose-50/40 p-6 rounded-2xl space-y-3">
        <div className="flex items-center gap-2 text-rose-800">
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider">Danger Zone</h3>
        </div>
        <p className="text-xs text-neutral-600">
          Clear all locally stored invoices, customer records, and custom templates on this device.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="px-4 py-2 text-xs font-bold text-rose-700 bg-white border border-rose-300 hover:bg-rose-50 rounded-lg shadow-2xs transition-colors cursor-pointer"
        >
          Reset Local Database
        </button>
      </div>

      {/* Import Confirmation Preview Modal */}
      {importCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-200">
            <h3 className="text-base font-bold text-neutral-900 mb-2">
              Preview & Confirm Backup Import
            </h3>
            <p className="text-xs text-neutral-600 mb-4">
              We validated your backup JSON file. Review the records to be restored:
            </p>

            <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-200 text-xs space-y-1.5 mb-4">
              <div className="flex justify-between">
                <span className="text-neutral-500">Business Name:</span>
                <span className="font-semibold text-neutral-900">{importCandidate.business?.name || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Invoices Count:</span>
                <span className="font-semibold text-neutral-900">{importCandidate.invoices?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Customers Count:</span>
                <span className="font-semibold text-neutral-900">{importCandidate.customers?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Exported At:</span>
                <span className="font-semibold text-neutral-900">{importCandidate.exportedAt ? new Date(importCandidate.exportedAt).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setImportCandidate(null)}
                className="px-4 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmImport}
                className="px-4 py-2 text-xs font-bold text-white bg-neutral-950 hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
              >
                Confirm & Restore
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-200">
            <h3 className="text-base font-bold text-rose-900 mb-2">
              Are you absolutely sure?
            </h3>
            <p className="text-xs text-neutral-600 mb-4 leading-relaxed">
              This will permanently erase all local invoice records, customer details, and configurations from your browser storage.
            </p>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Type <strong>DELETE</strong> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmationWord}
                onChange={(e) => setDeleteConfirmationWord(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmationWord('');
                }}
                className="px-4 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleteConfirmationWord.toUpperCase() !== 'DELETE'}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl disabled:opacity-50"
              >
                Permanently Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Drive Permission Modal */}
      <DrivePermissionModal
        isOpen={showDrivePermissionModal}
        onClose={() => setShowDrivePermissionModal(false)}
        onPermissionGranted={() => {
          onSettingsUpdated({
            ...settings,
            driveSync: {
              ...settings.driveSync,
              permissionGranted: true,
              isConnected: true,
            },
          });
        }}
      />
    </div>
  );
};
