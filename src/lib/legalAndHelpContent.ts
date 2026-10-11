export const SUPPORT_EMAIL = 'support@invoiceflow.example';
export const APP_VERSION = '1.0.0 (Production Prototype)';
export const LAST_UPDATED_DATE = 'October 11, 2026';
export const WEBSITE_URL = 'https://invoiceflow.example';

export interface FaqItem {
  id: string;
  category: 'Getting Started' | 'Invoices' | 'Backup' | 'Plans' | 'Privacy';
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  // Getting Started
  {
    id: 'faq-1',
    category: 'Getting Started',
    question: 'What is InvoiceFlow?',
    answer:
      'InvoiceFlow is a fast, offline-first invoice generator designed for freelancers, independent contractors, consultants, technicians, tradespeople, and small businesses. It lets you create, customize, and export professional invoices in seconds without cumbersome accounting software or mandatory account registration.',
  },
  {
    id: 'faq-2',
    category: 'Getting Started',
    question: 'Do I need an account to use InvoiceFlow?',
    answer:
      'No. The core philosophy of InvoiceFlow is immediate utility. You do not need to register, verify an email, or sign into a cloud service to create, preview, or export invoices.',
  },
  {
    id: 'faq-3',
    category: 'Getting Started',
    question: 'Can I use InvoiceFlow offline?',
    answer:
      'Yes! InvoiceFlow is designed offline-first. All your business profile details, client records, and invoice data are saved directly to your local device browser storage. You can create, edit, print, and save PDF invoices even without an active internet connection.',
  },
  {
    id: 'faq-4',
    category: 'Getting Started',
    question: 'Where is my data stored?',
    answer:
      'On the Free plan, your data exists exclusively on your device (in local web storage). It is never sent to an InvoiceFlow cloud server. If you enable the Drive plan, encrypted backup archives can be synced to your personal Google Drive account.',
  },

  // Invoices
  {
    id: 'faq-5',
    category: 'Invoices',
    question: 'How do I create an invoice?',
    answer:
      'Click the "+ Create Invoice" button from the sidebar or dashboard. Enter or select a client, specify your line items (description, quantity, unit rate, tax, and discount), verify your payment details, and click "Preview & Print" to review the finished A4 document.',
  },
  {
    id: 'faq-6',
    category: 'Invoices',
    question: 'How does invoice numbering work?',
    answer:
      'InvoiceFlow automatically increments invoice numbers using your configured prefix (for example, INV-0001, INV-0002). You can change your prefix or next starting number at any time in Settings → Invoice Defaults, or manually override the number on any individual invoice.',
  },
  {
    id: 'faq-7',
    category: 'Invoices',
    question: 'Can I edit an invoice after saving?',
    answer:
      'Yes. Open any invoice from the Invoices table and click "Edit". You can adjust line items, rates, customer details, or payment terms, and re-save as Draft, Pending, or Paid.',
  },
  {
    id: 'faq-8',
    category: 'Invoices',
    question: 'Can I duplicate an existing invoice for recurring clients?',
    answer:
      'Yes! Click the "Duplicate" button on any invoice. InvoiceFlow will generate a new invoice draft with the same client details, line items, and terms, but with the next auto-incremented invoice number and today’s issue date.',
  },
  {
    id: 'faq-9',
    category: 'Invoices',
    question: 'How do I mark an invoice as paid?',
    answer:
      'In the invoice preview screen, use the status switcher to toggle between Paid, Pending, Overdue, or Draft. You can also edit the invoice directly to change its settlement state.',
  },
  {
    id: 'faq-10',
    category: 'Invoices',
    question: 'How do I generate and download a PDF?',
    answer:
      'Open the invoice preview and click "Print / Save PDF". Your browser print dialog will appear with custom print stylesheets formatted specifically for A4 paper. Select "Save as PDF" as your print destination to download a pristine document with zero UI chrome.',
  },
  {
    id: 'faq-11',
    category: 'Invoices',
    question: 'Can I print an invoice on paper?',
    answer:
      'Yes. In the print dialog, choose your physical printer. The page margins and table layouts are calibrated for clean single-page printing on standard A4 / US Letter paper.',
  },

  // Backup
  {
    id: 'faq-12',
    category: 'Backup',
    question: 'What happens to my data if I lose or reset my device?',
    answer:
      'Because the Free plan is strictly local-first, data stored solely on your device cannot be restored by InvoiceFlow if your device is lost, stolen, damaged, reset, or if browser data is cleared. That is why we recommend regularly exporting JSON backups or using the Drive plan.',
  },
  {
    id: 'faq-13',
    category: 'Backup',
    question: 'How do I export my invoices as a backup?',
    answer:
      'Navigate to Settings → Data & Backup and click "Export Backup (.json)". This downloads a complete, structured JSON archive of all your business information, customers, invoices, and settings to your computer or phone.',
  },
  {
    id: 'faq-14',
    category: 'Backup',
    question: 'How do I restore a backup on another device?',
    answer:
      'On your new device or browser, go to Settings → Data & Backup, click "Import Backup File", and select your previously exported .json file. All invoices and client records will be restored instantly.',
  },
  {
    id: 'faq-15',
    category: 'Backup',
    question: 'How does Google Drive backup work?',
    answer:
      'The Drive plan connects to your own personal Google Drive account with your permission. It saves backup copies into an isolated application folder. InvoiceFlow does not host your files on its own servers—your files remain inside your personal Google Drive storage.',
  },
  {
    id: 'faq-16',
    category: 'Backup',
    question: 'Is my data stored in InvoiceFlow’s cloud?',
    answer:
      'Not currently. In this prototype, all operations are local-first. In the future Pro Cloud plan, optional managed cloud synchronization will be available for multi-device live syncing.',
  },

  // Plans
  {
    id: 'faq-17',
    category: 'Plans',
    question: 'What is included in the Free plan?',
    answer:
      'The Free plan includes unlimited local invoices, unlimited customers, offline operation, standard invoice templates, PDF generation, and complete JSON backup/export. There are no monthly creation caps.',
  },
  {
    id: 'faq-18',
    category: 'Plans',
    question: 'What is the Drive plan ($2.99 / ₹49/month)?',
    answer:
      'The Drive plan includes everything in Free, plus automated backup to your personal Google Drive, multi-device backup restore, and regional country templates. The subtle InvoiceFlow watermark remains.',
  },
  {
    id: 'faq-19',
    category: 'Plans',
    question: 'What is the Pro Cloud plan ($4.99 / ₹99/month)?',
    answer:
      'Pro Cloud includes all Drive features, complete watermark removal, access to all premium templates, the live Custom Template Builder, and upcoming multi-device cloud synchronization.',
  },
  {
    id: 'faq-20',
    category: 'Plans',
    question: 'Why does the Free plan have a watermark?',
    answer:
      'A subtle "Created with InvoiceFlow · Simple Offline Invoicing" note appears in the footer of invoices generated on the Free and Drive plans. This helps spread the word about our independent product while keeping the software genuinely free for freelancers.',
  },
  {
    id: 'faq-21',
    category: 'Plans',
    question: 'Can I cancel a subscription anytime?',
    answer:
      'Yes. When paid plans launch, subscriptions can be cancelled at any time without penalties. Your local data will remain completely intact and functional even after downgrading to the Free plan.',
  },

  // Privacy
  {
    id: 'faq-22',
    category: 'Privacy',
    question: 'Does InvoiceFlow sell or monetize my data?',
    answer:
      'No. We do not sell, rent, monetize, or track your invoice data. Because data lives on your device, we do not even have access to read your clients, prices, or amounts.',
  },
  {
    id: 'faq-23',
    category: 'Privacy',
    question: 'Does InvoiceFlow see my customer information?',
    answer:
      'No. On the local-first architecture, your customer names, addresses, and billing amounts never pass through an InvoiceFlow backend server.',
  },
  {
    id: 'faq-24',
    category: 'Privacy',
    question: 'What happens when I click "Delete All Local Data"?',
    answer:
      'All local database records (invoices, customers, settings, business profile) stored in your browser for InvoiceFlow are permanently purged. This action cannot be undone unless you possess an exported JSON backup.',
  },
];

export const PRIVACY_POLICY_TEXT = {
  lastUpdated: LAST_UPDATED_DATE,
  sections: [
    {
      title: '1. Introduction',
      content:
        'InvoiceFlow ("we", "us", or "our") respects your privacy and is committed to protecting your personal data. This Privacy Policy describes how information is collected, stored, and managed when you use the InvoiceFlow functional application prototype. Unlike conventional accounting SaaS applications that require mandatory centralized account registration, InvoiceFlow operates primarily as an offline-first, local tool.',
    },
    {
      title: '2. Information We Store',
      content:
        'When you use InvoiceFlow, structured application records are created based on the details you input. These records are held within your local device environment.',
    },
    {
      title: '3. Business Information',
      content:
        'You may input your business identity, including your company name, trade name, contact email, phone number, physical address, business tax identification number (such as GSTIN, EIN, or VAT ID), banking details, and payment handle. This information is used strictly to populate your invoice headers.',
    },
    {
      title: '4. Customer Information',
      content:
        'You may maintain a directory of clients including their name, company, billing address, email address, phone number, and tax registration number. This information is used solely to fill the "Billed To" section of your invoices.',
    },
    {
      title: '5. Invoice Information',
      content:
        'Each invoice contains invoice numbers, issue dates, payment terms, due dates, currency, line item descriptions, quantities, unit prices, tax percentages, discount amounts, and notes. These details constitute your financial documentation.',
    },
    {
      title: '6. How Information Is Stored',
      content:
        'InvoiceFlow is architected with a local-first philosophy. Your data is stored directly in your browser or local client application storage (such as Web Storage / IndexedDB). We do not automatically transmit or upload your invoice contents to centralized application databases.',
    },
    {
      title: '7. Local Device Storage',
      content:
        'All records remain on the specific physical device and web browser instance you use. No server connection is required to create, update, search, preview, or export invoices.',
    },
    {
      title: '8. Google Drive Backup',
      content:
        'If you opt to use the Drive backup feature, data is archived directly into your personal Google Drive account under your explicit authorization. InvoiceFlow does not receive a copy of your files on its own servers during this synchronization.',
    },
    {
      title: '9. Future InvoiceFlow Cloud Storage',
      content:
        'In future releases of the Pro Cloud plan, optional managed cloud synchronization may be offered. In such future events, cloud storage will require explicit user consent, secure end-to-end transport, and transparent server privacy disclosures.',
    },
    {
      title: '10. How We Use Information',
      content:
        'We use your data solely to execute the functional operations you request: rendering invoices on your screen, calculating totals and taxes, applying template stylesheets, and formatting print/PDF layouts.',
    },
    {
      title: '11. Data Sharing',
      content:
        'We do not sell, rent, trade, share, or broker your personal information, customer lists, or financial data to any advertisers, data brokers, or third parties.',
    },
    {
      title: '12. Third-Party Services',
      content:
        'The application may interact with trusted third-party providers only when initiated by you (for example, Google Drive authentication when backing up). In such cases, the respective third party\'s privacy policies govern their services.',
    },
    {
      title: '13. Data Retention',
      content:
        'Because your data resides on your device, retention is entirely within your control. Your records persist until you delete them within the app, clear your browser storage, or uninstall the application.',
    },
    {
      title: '14. Data Deletion',
      content:
        'You may delete individual invoices, remove customer profiles, or execute "Clear All Local Data" in Settings at any time. When deleted locally, data is removed from your browser storage immediately.',
    },
    {
      title: '15. Data Export',
      content:
        'You maintain absolute ownership of your data. InvoiceFlow provides a one-click structured JSON export tool in Settings allowing you to obtain a machine-readable copy of your full database at any time.',
    },
    {
      title: '16. Data Security',
      content:
        'Local storage security is bound by the operating system and browser security controls of your device. We recommend safeguarding your personal computer or mobile phone with device passwords, disk encryption, and up-to-date software.',
    },
    {
      title: '17. User Responsibilities',
      content:
        'Because InvoiceFlow Free is local-first without mandatory remote servers, you are solely responsible for creating regular backups of your invoices to protect against hardware failure, loss, or browser data clearance.',
    },
    {
      title: '18. International Users',
      content:
        'InvoiceFlow is accessible globally. Since processing occurs locally on your machine, your data is processed where you physically use the application, respecting local data residency by default.',
    },
    {
      title: '19. Children\'s Privacy',
      content:
        'InvoiceFlow is intended for professional, commercial, freelance, and business invoicing by individuals who have reached the age of majority in their jurisdiction. It is not directed at children.',
    },
    {
      title: '20. Changes to This Privacy Policy',
      content:
        'We may update this Privacy Policy periodically as new product features (such as paid subscriptions or cloud services) are introduced. Revisions will be reflected with an updated "Last Updated" date.',
    },
    {
      title: '21. Contact Information',
      content: `If you have questions, feedback, or privacy concerns regarding InvoiceFlow, please contact us at: ${SUPPORT_EMAIL}`,
    },
  ],
};

export const TERMS_OF_SERVICE_TEXT = {
  lastUpdated: LAST_UPDATED_DATE,
  sections: [
    {
      title: '1. Acceptance of Terms',
      content:
        'By opening, browsing, or using the InvoiceFlow application ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the application.',
    },
    {
      title: '2. Description of InvoiceFlow',
      content:
        'InvoiceFlow is an offline-first productivity tool designed to help freelancers, contractors, consultants, and businesses format, manage, and print commercial invoices rapidly.',
    },
    {
      title: '3. Eligibility',
      content:
        'You must be at least 18 years of age or the legal age of majority in your jurisdiction to use InvoiceFlow for commercial invoicing and contracting purposes.',
    },
    {
      title: '4. User Account / No Forced Account',
      content:
        'InvoiceFlow Free does not mandate account creation or user registration. You may begin generating invoices immediately upon launching the application.',
    },
    {
      title: '5. Acceptable Use',
      content:
        'You agree not to use InvoiceFlow to generate fraudulent, deceptive, illegal, or forged invoices, or to engage in unlawful trade, money laundering, or tax evasion.',
    },
    {
      title: '6. User Responsibilities',
      content:
        'You are solely responsible for the content, accuracy, authenticity, and legal validity of any business name, address, tax registration number, client details, line items, and financial values you input.',
    },
    {
      title: '7. Invoice Accuracy',
      content:
        'InvoiceFlow provides automated arithmetic calculations (such as subtotal, tax sums, discounts, and grand totals) as a mechanical aid. You must independently verify all calculated numbers before delivering invoices to clients.',
    },
    {
      title: '8. Tax and Legal Compliance',
      content:
        'InvoiceFlow does not provide tax, legal, or accounting advice. You are solely responsible for complying with the tax laws, invoice reporting rules, sales tax/VAT/GST regulations, and statutory bookkeeping requirements of your relevant country.',
    },
    {
      title: '9. Local Data Responsibility',
      content:
        'InvoiceFlow Free is designed to work without a mandatory account or cloud storage. Invoice and related application data may be stored locally on the user\'s device. Locally stored data can become unavailable if the device is lost, stolen, damaged, reset, application data is cleared, or storage becomes corrupted.',
    },
    {
      title: '10. Backup Responsibility',
      content:
        'InvoiceFlow does not guarantee recovery of data that exists only on the user\'s device. Users are responsible for maintaining appropriate backups of important invoice data through JSON export or other secondary storage.',
    },
    {
      title: '11. Google Drive Backup',
      content:
        'The Drive plan facilitates backup archives inside your personal Google Drive account. Use of Google Drive is subject to Google\'s separate terms and policies. InvoiceFlow is not an affiliate of Google LLC.',
    },
    {
      title: '12. Pro Cloud Service',
      content:
        'The Pro Cloud plan represents a future multi-device synchronization service. Prototype depictions of Pro Cloud represent feature roadmaps and prototype capabilities.',
    },
    {
      title: '13. Subscriptions',
      content:
        'Any prospective paid plan fees are presented on a recurring monthly or annual basis. In this current prototype, payment processing is simulated and no real credit card charges are made.',
    },
    {
      title: '14. Payments',
      content:
        'Upon commercial release of paid subscriptions, payments will be processed by PCI-compliant third-party payment gateways. You agree to provide valid billing credentials.',
    },
    {
      title: '15. Cancellation',
      content:
        'You may cancel any active paid plan at any time. Upon cancellation, your access will continue until the end of your billing cycle, and your local data will remain fully usable on the Free tier.',
    },
    {
      title: '16. Refunds',
      content:
        'Refund terms for upcoming paid plans are outlined in our Refund Policy. In the current functional prototype, no real funds are collected.',
    },
    {
      title: '17. Service Availability',
      content:
        'While the local application is designed to function offline without server reliance, we do not guarantee uninterrupted, error-free operation across all web browsers or operating systems.',
    },
    {
      title: '18. Intellectual Property',
      content:
        'The InvoiceFlow name, brand mark, visual design, template structures, and application code are owned by InvoiceFlow. You retain full ownership of all business data, invoices, and text you create.',
    },
    {
      title: '19. Third-Party Services',
      content:
        'InvoiceFlow may provide links or integrations with external services (such as Google Drive). We are not liable for the performance or availability of third-party platforms.',
    },
    {
      title: '20. Disclaimers',
      content:
        'The Service is provided on an "as is" and "as available" basis without warranties of any kind, whether express or implied. InvoiceFlow disclaims warranties of merchantability, fitness for a particular purpose, and non-infringement to the fullest extent permitted by law.',
    },
    {
      title: '21. Limitation of Liability',
      content:
        'To the maximum extent permitted by applicable law, InvoiceFlow and its creators shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or loss of profits, data, or business opportunities arising from your use of the application.',
    },
    {
      title: '22. Changes to Terms',
      content:
        'We reserve the right to revise these Terms of Service. Changes will be posted within the application with an updated modification date.',
    },
    {
      title: '23. Contact Information',
      content: `For inquiries regarding these Terms of Service, contact: ${SUPPORT_EMAIL}`,
    },
  ],
};

export const DATA_BACKUP_POLICY_TEXT = {
  lastUpdated: LAST_UPDATED_DATE,
  overview:
    'InvoiceFlow was engineered with privacy and offline freedom at its heart. Because we believe freelancers should own their data, the Free plan avoids mandatory cloud lock-in. Understanding where your records reside and how to safeguard them is crucial.',
  scenarios: [
    'Your device is lost or stolen',
    'Your physical hardware is damaged or fails',
    'Your device is factory reset or restored',
    'You clear browser cookies, local storage, or site data',
    'The operating system cleans app caches to free disk space',
    'You switch to a new phone, tablet, or laptop without exporting',
  ],
};

export const DISCLAIMER_TEXT = {
  lastUpdated: LAST_UPDATED_DATE,
  statement:
    'InvoiceFlow provides software tools for composing, calculating, and printing business invoices. InvoiceFlow is not an accounting firm, law firm, financial institution, or certified tax consultancy, and does not provide legal, tax, accounting, or professional financial advice.',
  jurisdictionNote:
    'Tax regulations, VAT reporting requirements, GST rates, HSN codes, and invoice compliance laws vary widely across states, provinces, and countries. Country-specific templates provided in InvoiceFlow are convenience layout aids and do not guarantee statutory tax compliance in every jurisdiction. Users are solely responsible for verifying the legal and tax compliance of their invoices with qualified local professionals.',
};

export const REFUND_POLICY_TEXT = {
  lastUpdated: LAST_UPDATED_DATE,
  statusNotice: 'Prototype Notice: Payment and refund implementation to be finalized before paid plans launch.',
  sections: [
    {
      title: '1. Prototype Status',
      content:
        'InvoiceFlow is currently operating as a functional prototype. Plan upgrades simulated within this version do not execute live credit card transactions, and no actual financial charges are incurred.',
    },
    {
      title: '2. Future Paid Subscription Terms',
      content:
        'Prior to the public launch of commercial Drive ($2.99/mo / ₹49/mo) and Pro Cloud ($4.99/mo / ₹99/mo) plans, a complete, binding commercial refund policy will be published. This will outline grace periods, monthly vs annual billing policies, and billing dispute processes.',
    },
    {
      title: '3. Cancellation Guarantee',
      content:
        'Users will always be able to cancel paid subscriptions at any time with one click. Upon cancellation, your account will remain active through the prepaid period and gracefully revert to the Free plan with zero loss of local invoice records.',
    },
    {
      title: '4. Support and Inquiries',
      content: `Questions regarding prospective plans or billing can be submitted to: ${SUPPORT_EMAIL}`,
    },
  ],
};

export const THIRD_PARTY_LICENSES = [
  { name: 'React', license: 'MIT License', url: 'https://react.dev' },
  { name: 'Tailwind CSS', license: 'MIT License', url: 'https://tailwindcss.com' },
  { name: 'Lucide Icons', license: 'ISC License', url: 'https://lucide.dev' },
  { name: 'Plus Jakarta Sans', license: 'SIL Open Font License 1.1', url: 'https://fonts.google.com' },
  { name: 'JetBrains Mono', license: 'SIL Open Font License 1.1', url: 'https://www.jetbrains.com/lp/mono/' },
];
