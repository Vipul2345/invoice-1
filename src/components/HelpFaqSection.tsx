import React, { useState } from 'react';
import { FAQ_ITEMS, FaqItem, SUPPORT_EMAIL } from '../lib/legalAndHelpContent';
import {
  HelpCircle,
  Search,
  ChevronDown,
  Mail,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

interface HelpFaqSectionProps {
  onContactClick?: () => void;
}

export const HelpFaqSection: React.FC<HelpFaqSectionProps> = ({ onContactClick }) => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [openIds, setOpenIds] = useState<string[]>(['faq-1', 'faq-4', 'faq-12']);

  const toggleAccordion = (id: string) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const categories = ['all', 'Getting Started', 'Invoices', 'Backup', 'Plans', 'Privacy'];

  const filtered = FAQ_ITEMS.filter((item) => {
    if (category !== 'all' && item.category !== category) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-neutral-950 tracking-tight flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-neutral-700" />
          Help & Frequently Asked Questions
        </h2>
        <p className="text-xs text-neutral-500 mt-1">
          Everything you need to know about creating invoices, local device storage, backups, and privacy.
        </p>
      </div>

      {/* Search and Category Filters */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200/90 shadow-2xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search questions or keywords (e.g., backup, PDF, account, privacy)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs bg-neutral-50 border border-neutral-200 rounded-lg pl-10 pr-4 py-2.5 text-neutral-900 placeholder-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>

        {/* Category Pills/Segment */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
                category === cat
                  ? 'bg-neutral-900 text-white shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200'
              }`}
            >
              {cat === 'all' ? 'All Questions' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ Accordion List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-neutral-200 shadow-2xs">
            <HelpCircle className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-neutral-800">No matching questions found</h3>
            <p className="text-xs text-neutral-500 mt-1">
              Try adjusting your search terms or reach out directly to support.
            </p>
            {onContactClick && (
              <button
                onClick={onContactClick}
                className="mt-4 px-4 py-2 text-xs font-bold text-white bg-neutral-900 rounded-lg cursor-pointer"
              >
                Contact Support
              </button>
            )}
          </div>
        ) : (
          filtered.map((item) => {
            const isOpen = openIds.includes(item.id);
            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-neutral-200/90 shadow-2xs overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleAccordion(item.id)}
                  className="w-full p-4 sm:p-4.5 text-left flex items-start justify-between gap-4 cursor-pointer hover:bg-neutral-50/60 transition-colors"
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-0.5">
                      {item.category}
                    </span>
                    <h3 className="text-sm font-bold text-neutral-950">
                      {item.question}
                    </h3>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-neutral-400 shrink-0 mt-1 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-neutral-900' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 sm:px-4.5 sm:pb-4.5 pt-1 text-xs sm:text-sm text-neutral-600 leading-relaxed border-t border-neutral-100">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Need more help banner */}
      <div className="bg-neutral-900 text-white p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold tracking-tight">
            Still have questions or feedback?
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Our support team is here to assist with feature requests, bug reports, and guidance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onContactClick ? (
            <button
              onClick={onContactClick}
              className="px-4 py-2 text-xs font-bold text-neutral-900 bg-white hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
            >
              Contact Support
            </button>
          ) : (
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="px-4 py-2 text-xs font-bold text-neutral-900 bg-white hover:bg-neutral-100 rounded-lg transition-colors inline-flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{SUPPORT_EMAIL}</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
