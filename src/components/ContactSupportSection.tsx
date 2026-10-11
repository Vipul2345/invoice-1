import React, { useState } from 'react';
import { SUPPORT_EMAIL, APP_VERSION } from '../lib/legalAndHelpContent';
import {
  Mail,
  Send,
  Copy,
  CheckCircle2,
  Bug,
  Lightbulb,
  HelpCircle,
  CreditCard,
  Shield,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';

export type ContactCategory =
  | 'General Question'
  | 'Report a Bug'
  | 'Billing Issue'
  | 'Feature Request'
  | 'Privacy Concern'
  | 'Other';

interface ContactSupportSectionProps {
  initialCategory?: ContactCategory;
}

export const ContactSupportSection: React.FC<ContactSupportSectionProps> = ({
  initialCategory = 'General Question',
}) => {
  const [category, setCategory] = useState<ContactCategory>(initialCategory);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  // Bug report specific
  const [platform, setPlatform] = useState(() => {
    if (typeof navigator !== 'undefined') {
      return `${navigator.userAgent.includes('Mac') ? 'macOS' : navigator.userAgent.includes('Win') ? 'Windows' : 'Linux / Mobile'} (${navigator.userAgent.includes('Chrome') ? 'Chrome' : navigator.userAgent.includes('Firefox') ? 'Firefox' : 'Browser'})`;
    }
    return 'Web Browser';
  });
  const [stepsToReproduce, setStepsToReproduce] = useState('');

  // Feature suggestion specific
  const [featureTitle, setFeatureTitle] = useState('');
  const [usefulness, setUsefulness] = useState('');

  const [copiedEmail, setCopiedEmail] = useState(false);
  const [submittedNotice, setSubmittedNotice] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(SUPPORT_EMAIL);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();

    let emailSubject = `[${category}] `;
    let emailBody = '';

    if (category === 'Report a Bug') {
      emailSubject += subject.trim() || 'Bug Report';
      emailBody = `Issue Category: ${category}
App Version: ${APP_VERSION}
Platform / Environment: ${platform}

Description:
${message}

Steps to Reproduce:
${stepsToReproduce || 'N/A'}

[Note: No customer or invoice data attached for privacy protection.]`;
    } else if (category === 'Feature Request') {
      emailSubject += featureTitle.trim() || 'Feature Suggestion';
      emailBody = `Feature Title: ${featureTitle}

Description:
${message}

Why would this be useful?
${usefulness}

App Version: ${APP_VERSION}`;
    } else {
      emailSubject += subject.trim() || 'Inquiry';
      emailBody = `Category: ${category}
App Version: ${APP_VERSION}

Message:
${message}`;
    }

    const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      emailSubject
    )}&body=${encodeURIComponent(emailBody)}`;

    window.location.href = mailtoUrl;
    setSubmittedNotice(true);
    setTimeout(() => setSubmittedNotice(false), 5000);
  };

  const getCategoryIcon = (cat: ContactCategory) => {
    switch (cat) {
      case 'Report a Bug':
        return <Bug className="w-4 h-4 text-rose-600" />;
      case 'Feature Request':
        return <Lightbulb className="w-4 h-4 text-amber-600" />;
      case 'Billing Issue':
        return <CreditCard className="w-4 h-4 text-blue-600" />;
      case 'Privacy Concern':
        return <Shield className="w-4 h-4 text-emerald-600" />;
      default:
        return <HelpCircle className="w-4 h-4 text-neutral-600" />;
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-16">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-neutral-950 tracking-tight">
          Contact InvoiceFlow Support
        </h2>
        <p className="text-xs text-neutral-500 mt-1">
          Have a question, found a bug, or have an idea for InvoiceFlow? We'd love to hear from you.
        </p>
      </div>

      {/* Direct Contact Bar */}
      <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <Mail className="w-4 h-4 text-neutral-700 shrink-0" />
          <div>
            <span className="text-neutral-500">Official Support Channel:</span>{' '}
            <span className="font-mono font-semibold text-neutral-900">{SUPPORT_EMAIL}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopyEmail}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-neutral-100 text-neutral-800 font-medium rounded-lg border border-neutral-200 shadow-2xs transition-colors cursor-pointer w-fit"
        >
          {copiedEmail ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Copied to Clipboard</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Email</span>
            </>
          )}
        </button>
      </div>

      {submittedNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Opening your default mail client with prefilled details. Thank you!</span>
        </div>
      )}

      {/* Interactive Form */}
      <form onSubmit={handleSend} className="bg-white p-6 sm:p-7 rounded-2xl border border-neutral-200/90 shadow-2xs space-y-5 text-xs">
        {/* Category Picker */}
        <div>
          <label className="block font-bold uppercase tracking-wider text-neutral-700 mb-2">
            Select Inquiry Category
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(
              [
                'General Question',
                'Report a Bug',
                'Feature Request',
                'Billing Issue',
                'Privacy Concern',
                'Other',
              ] as ContactCategory[]
            ).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`p-2.5 rounded-xl border text-left flex items-center gap-2 font-medium transition-colors cursor-pointer ${
                  category === cat
                    ? 'border-neutral-900 bg-neutral-900 text-white shadow-2xs'
                    : 'border-neutral-200 bg-neutral-50/70 text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                {getCategoryIcon(cat)}
                <span className="truncate">{cat}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Fields for Bug Report */}
        {category === 'Report a Bug' ? (
          <div className="space-y-4 pt-2 border-t border-neutral-100">
            <div>
              <label className="block font-medium text-neutral-700 mb-1">
                Bug Summary / Issue Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Total calculation discrepancy when discount applied"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-neutral-700 mb-1">
                  Platform / Browser
                </label>
                <input
                  type="text"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
              <div>
                <label className="block font-medium text-neutral-700 mb-1">
                  App Version
                </label>
                <input
                  type="text"
                  readOnly
                  value={APP_VERSION}
                  className="w-full bg-neutral-100 border border-neutral-300 rounded-lg p-2.5 text-neutral-600 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-neutral-700 mb-1">
                Description of the Issue *
              </label>
              <textarea
                rows={3}
                required
                placeholder="What happened? What did you expect to happen instead?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-700 mb-1">
                Steps to Reproduce (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="1. Created invoice&#10;2. Added 2 items&#10;3. Switched template"
                value={stepsToReproduce}
                onChange={(e) => setStepsToReproduce(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 font-mono text-[11px]"
              />
            </div>
          </div>
        ) : category === 'Feature Request' ? (
          /* Dynamic Fields for Feature Suggestion */
          <div className="space-y-4 pt-2 border-t border-neutral-100">
            <div>
              <label className="block font-medium text-neutral-700 mb-1">
                Feature Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Export individual invoice as CSV / Excel"
                value={featureTitle}
                onChange={(e) => setFeatureTitle(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-700 mb-1">
                Feature Description *
              </label>
              <textarea
                rows={3}
                required
                placeholder="Describe how this feature should work..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-700 mb-1">
                Why would this be useful to you or other businesses?
              </label>
              <textarea
                rows={2}
                placeholder="Explain the workflow or time saved..."
                value={usefulness}
                onChange={(e) => setUsefulness(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>
          </div>
        ) : (
          /* Standard Contact Fields */
          <div className="space-y-4 pt-2 border-t border-neutral-100">
            <div>
              <label className="block font-medium text-neutral-700 mb-1">
                Subject *
              </label>
              <input
                type="text"
                required
                placeholder="Brief summary of your question or inquiry"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-700 mb-1">
                Message *
              </label>
              <textarea
                rows={4}
                required
                placeholder="Provide detailed information regarding your inquiry..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>
          </div>
        )}

        {/* Privacy Assurance Note */}
        <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/80 flex items-start gap-2.5 text-neutral-600 text-[11px]">
          <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>
            <strong>Privacy Protection Guarantee:</strong> InvoiceFlow will not attach your private customer names, invoice line items, or banking numbers to support emails. Only the information you type above is sent.
          </span>
        </div>

        {/* Submit */}
        <div className="pt-2 flex items-center justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 text-xs font-bold text-white bg-neutral-950 hover:bg-neutral-800 rounded-xl shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send via Email Client</span>
          </button>
        </div>
      </form>
    </div>
  );
};
