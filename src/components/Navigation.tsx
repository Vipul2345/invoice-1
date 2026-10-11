import React from 'react';
import { PlanTier } from '../types';
import {
  LayoutDashboard,
  FileText,
  Users,
  LayoutTemplate,
  BarChart3,
  Settings,
  Plus,
  Crown,
  HardDrive,
  Cloud,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

export type NavTab = 'dashboard' | 'invoices' | 'customers' | 'templates' | 'reports' | 'settings' | 'pricing';

interface NavigationProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onCreateInvoice: () => void;
  currentPlan: PlanTier;
  onUpgradeClick: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onTabChange,
  onCreateInvoice,
  currentPlan,
  onUpgradeClick,
}) => {
  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'invoices' as NavTab, label: 'Invoices', icon: FileText },
    { id: 'customers' as NavTab, label: 'Customers', icon: Users },
    { id: 'templates' as NavTab, label: 'Templates', icon: LayoutTemplate },
    { id: 'reports' as NavTab, label: 'Reports', icon: BarChart3 },
    { id: 'settings' as NavTab, label: 'Settings', icon: Settings },
  ];

  const getPlanBadge = () => {
    switch (currentPlan) {
      case 'pro':
        return (
          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
            <Crown className="w-3 h-3 fill-amber-500 text-amber-500" /> Pro Cloud
          </span>
        );
      case 'drive':
        return (
          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
            <Cloud className="w-3 h-3 text-blue-600" /> Drive Backup
          </span>
        );
      case 'free':
      default:
        return (
          <span className="text-[10px] font-bold text-neutral-600 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded uppercase tracking-wider">
            Free Plan
          </span>
        );
    }
  };

  return (
    <>
      {/* Desktop Sidebar (Left) */}
      <aside className="no-print hidden md:flex md:flex-col md:w-64 bg-white border-r border-neutral-200/80 fixed inset-y-0 left-0 z-30 select-none">
        {/* Brand Area */}
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
          <button
            onClick={() => onTabChange('dashboard')}
            className="flex items-center gap-2.5 text-left group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-neutral-950 text-white flex items-center justify-center font-black text-sm tracking-tight shadow-2xs group-hover:bg-neutral-800 transition-colors">
              IF
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-neutral-950 block">
                InvoiceFlow
              </span>
              <span className="text-[10px] font-mono text-neutral-400 block -mt-0.5">
                Offline-First App
              </span>
            </div>
          </button>
        </div>

        {/* Primary CTA */}
        <div className="p-4">
          <button
            onClick={onCreateInvoice}
            className="w-full py-2.5 px-4 text-xs font-bold text-white bg-neutral-950 hover:bg-neutral-800 rounded-lg shadow-2xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Invoice</span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-neutral-900 text-white shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-neutral-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Plan & Storage Area */}
        <div className="p-4 border-t border-neutral-100 space-y-3 bg-neutral-50/50">
          {/* Plan Card */}
          <div className="bg-white p-3 rounded-xl border border-neutral-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-neutral-500">Your Plan</span>
              {getPlanBadge()}
            </div>

            <button
              onClick={onUpgradeClick}
              className="mt-2 w-full text-center text-xs font-bold text-neutral-900 bg-neutral-100 hover:bg-neutral-200 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>{currentPlan === 'pro' ? 'Manage Plan' : 'View Plans & Upgrade'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Offline Trust Footnote */}
          <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 px-1">
            <HardDrive className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <span>Local Database Active</span>
          </div>
        </div>
      </aside>

      {/* Mobile Top Header (Small Screens Only) */}
      <header className="no-print md:hidden bg-white border-b border-neutral-200 sticky top-0 z-30 px-4 py-3 flex items-center justify-between shadow-2xs">
        <button
          onClick={() => onTabChange('dashboard')}
          className="flex items-center gap-2 text-left"
        >
          <div className="w-7 h-7 rounded-md bg-neutral-950 text-white flex items-center justify-center font-bold text-xs">
            IF
          </div>
          <span className="text-sm font-extrabold tracking-tight text-neutral-950">
            InvoiceFlow
          </span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onUpgradeClick}
            className="text-[11px] font-semibold text-neutral-600 bg-neutral-100 px-2.5 py-1 rounded-md"
          >
            {currentPlan.toUpperCase()}
          </button>
          <button
            onClick={onCreateInvoice}
            className="px-3 py-1.5 text-xs font-bold text-white bg-neutral-950 rounded-lg flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Invoice</span>
          </button>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Small Screens Only) */}
      <nav className="no-print md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-neutral-200/90 z-30 px-2 py-1.5 flex items-center justify-around shadow-lg">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
                isActive ? 'text-neutral-950 font-bold' : 'text-neutral-400 hover:text-neutral-700'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-neutral-950' : 'text-neutral-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
        {/* Settings button on mobile */}
        <button
          onClick={() => onTabChange('settings')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
            currentTab === 'settings' ? 'text-neutral-950 font-bold' : 'text-neutral-400 hover:text-neutral-700'
          }`}
        >
          <Settings className={`w-4 h-4 ${currentTab === 'settings' ? 'text-neutral-950' : 'text-neutral-400'}`} />
          <span>Settings</span>
        </button>
      </nav>
    </>
  );
};
