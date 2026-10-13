import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info';
}

/**
 * Fires a global popup toast notification anywhere in the application.
 */
export function showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('invoiceflow_toast', {
        detail: { message, type },
      })
    );
  }
}

export const ToastNotificationContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string; type?: 'success' | 'error' | 'info' }>;
      if (!customEvent.detail?.message) return;
      const newToast: ToastMessage = {
        id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        message: customEvent.detail.message,
        type: customEvent.detail.type || 'success',
      };
      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 3500);
    };

    window.addEventListener('invoiceflow_toast', handler);
    return () => window.removeEventListener('invoiceflow_toast', handler);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none no-print">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl shadow-xl border text-xs font-semibold animate-in slide-in-from-top-2 duration-200 transition-all ${
            toast.type === 'error'
              ? 'bg-rose-950 text-rose-100 border-rose-800 shadow-rose-950/30'
              : toast.type === 'info'
              ? 'bg-neutral-900 text-white border-neutral-700 shadow-neutral-950/30'
              : 'bg-emerald-950 text-emerald-100 border-emerald-800 shadow-emerald-950/30'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : toast.type === 'info' ? (
              <Info className="w-4 h-4 text-blue-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span className="leading-snug">{toast.message}</span>
          </div>
          <button
            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            className="p-1 text-white/60 hover:text-white rounded transition-colors cursor-pointer"
            title="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
