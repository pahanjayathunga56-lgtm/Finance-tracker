import type { CurrencyCode, CurrencyConfig, Subscription, Transaction, UpcomingItem } from '../types/finance'

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar ($)' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro (€)' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound (£)' },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar ($)' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar ($)' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen (¥)' },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee (₹)' },
  LKR: { code: 'LKR', symbol: 'Rs. ', name: 'Sri Lankan Rupee (LKR)' },
}

export const INCOME_CATEGORIES = [
  'Product Sales / Retail Orders',
  'Wholesale & Bulk Orders',
  'Client Invoices & Consulting',
  'Cash on Delivery (COD) Settlements',
  'Shipping & Delivery Fees Collected',
  'Subscription & Retainer Revenue',
  'Interest & Financial Investments',
  'Vendor Refunds & Rebates',
  'Other Business Income',
] as const

export const EXPENSE_CATEGORIES = [
  'Inventory & Materials (COGS)',
  'Packaging & Box Supplies',
  'Courier & Logistics (COD Fees)',
  'Advertising & Meta/Google Ads',
  'Employee Salaries & Payroll',
  'Freelance & Contract Work',
  'Rent & Storage / Showroom',
  'Utilities (CEB Electricity & Water)',
  'Internet, Phone & Communications',
  'Software, Shopify & Subscriptions',
  'Equipment & Machinery',
  'Office Supplies & Stationery',
  'Taxes, Duties & Government Fees',
  'Bank Charges & Gateway Fees',
  'Maintenance, Servicing & Repairs',
  'Business Transport & Fuel',
  'Customer Returns & Damaged Stock',
  'Professional Fees (Legal & Audit)',
  'Other Business Expense',
] as const

export const ALL_CATEGORIES = Array.from(new Set([...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES]))

export const CATEGORY_COLORS: Record<string, string> = {
  // Business Incomes
  'Product Sales / Retail Orders': '#10b981', // emerald
  'Wholesale & Bulk Orders': '#06b6d4', // cyan
  'Client Invoices & Consulting': '#3b82f6', // blue
  'Cash on Delivery (COD) Settlements': '#14b8a6', // teal
  'Shipping & Delivery Fees Collected': '#8b5cf6', // purple
  'Subscription & Retainer Revenue': '#6366f1', // indigo
  'Interest & Financial Investments': '#ec4899', // pink
  'Vendor Refunds & Rebates': '#0ea5e9', // sky
  'Other Business Income': '#64748b',

  // Business Expenses
  'Inventory & Materials (COGS)': '#f43f5e', // rose
  'Packaging & Box Supplies': '#f97316', // orange
  'Courier & Logistics (COD Fees)': '#d97706', // amber
  'Advertising & Meta/Google Ads': '#8b5cf6', // purple
  'Employee Salaries & Payroll': '#e11d48', // rose-red
  'Freelance & Contract Work': '#0284c7', // sky
  'Rent & Storage / Showroom': '#ea580c', // deep orange
  'Utilities (CEB Electricity & Water)': '#eab308', // yellow
  'Internet, Phone & Communications': '#06b6d4', // cyan
  'Software, Shopify & Subscriptions': '#6366f1', // indigo
  'Equipment & Machinery': '#4f46e5', // indigo
  'Office Supplies & Stationery': '#78716c', // stone
  'Taxes, Duties & Government Fees': '#b91c1c', // red
  'Bank Charges & Gateway Fees': '#ca8a04', // golden
  'Maintenance, Servicing & Repairs': '#475569', // slate
  'Business Transport & Fuel': '#2563eb', // blue
  'Customer Returns & Damaged Stock': '#dc2626', // red
  'Professional Fees (Legal & Audit)': '#9333ea', // purple
  'Other Business Expense': '#94a3b8',

  // Legacy mappings for backwards-compatibility
  'Other Income': '#10b981',
  'Salary': '#3b82f6',
  'Freelance': '#0284c7',
  'Food & Dining': '#f97316',
  'Shopping': '#f43f5e',
  'Housing': '#ea580c',
  'Transportation': '#2563eb',
  'Utilities': '#eab308',
  'Entertainment': '#8b5cf6',
  'Other Expense': '#94a3b8',
}

export const LEGACY_CATEGORY_MAP: Record<string, string> = {
  // Legacy personal -> business income
  'Other Income': 'Other Business Income',
  'Salary': 'Client Invoices & Consulting',
  'Freelance': 'Client Invoices & Consulting',
  'Investment': 'Interest & Financial Investments',
  'Investments': 'Interest & Financial Investments',

  // Legacy personal -> business expense
  'Food & Dining': 'Office Supplies & Stationery',
  'Groceries': 'Inventory & Materials (COGS)',
  'Shopping': 'Inventory & Materials (COGS)',
  'Housing': 'Rent & Storage / Showroom',
  'Transportation': 'Business Transport & Fuel',
  'Utilities': 'Utilities (CEB Electricity & Water)',
  'Bills & Utilities': 'Utilities (CEB Electricity & Water)',
  'Healthcare': 'Employee Salaries & Payroll',
  'Education': 'Professional Fees (Legal & Audit)',
  'Personal Care': 'Office Supplies & Stationery',
  'Entertainment': 'Advertising & Meta/Google Ads',
  'Tech & Subscriptions': 'Software, Shopify & Subscriptions',
  'Travel': 'Business Transport & Fuel',
  'Gifts & Donations': 'Other Business Expense',
  'Other Expense': 'Other Business Expense',
}

export const normalizeBusinessCategory = (
  category: string,
  type: 'income' | 'expense' = 'expense',
  description?: string
): string => {
  // If already a valid category for its type, return it
  if (type === 'income' && (INCOME_CATEGORIES as readonly string[]).includes(category as any)) {
    return category
  }
  if (type === 'expense' && (EXPENSE_CATEGORIES as readonly string[]).includes(category as any)) {
    return category
  }

  // Handle specific contextual matches (e.g. "Sold products" with "Other Income")
  if (category === 'Other Income' && description && /sold|sale|product|order|shop/i.test(description)) {
    return 'Product Sales / Retail Orders'
  }

  if (LEGACY_CATEGORY_MAP[category]) {
    return LEGACY_CATEGORY_MAP[category]
  }

  return type === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]
}

// Generate dates relative to current date
const now = new Date()
const formatDate = (offsetDays: number): string => {
  const d = new Date(now)
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().split('T')[0]
}

export const SAMPLE_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    date: formatDate(-1),
    description: 'Boutique Store Retail Orders Batch #184',
    amount: 148500.0,
    type: 'income',
    category: 'Product Sales / Retail Orders',
    invoiceNo: 'ORD-2026-184',
    notes: 'Online store website checkout settlements',
  },
  {
    id: 'tx-2',
    date: formatDate(-3),
    description: 'Raw Fabric & Cotton Nursery Roll Purchase',
    amount: 68500.0,
    type: 'expense',
    category: 'Inventory & Materials (COGS)',
    invoiceNo: 'SUP-4921',
    notes: 'Textile mill batch invoice for 150m organic baby cotton',
  },
  {
    id: 'tx-3',
    date: formatDate(-4),
    description: 'Koombiyo Weekly COD Remittance Payout',
    amount: 92400.0,
    type: 'income',
    category: 'Cash on Delivery (COD) Settlements',
    invoiceNo: 'COD-WK42',
    notes: 'Cash on delivery parcels collected and settled',
  },
  {
    id: 'tx-4',
    date: formatDate(-6),
    description: 'Wholesale Baby Care Gift Box Order',
    amount: 185000.0,
    type: 'income',
    category: 'Wholesale & Bulk Orders',
    invoiceNo: 'WS-2026-08',
    notes: 'Bulk corporate baby hamper order invoice paid',
  },
  {
    id: 'tx-5',
    date: formatDate(-8),
    description: 'Warehouse & Studio Monthly Rent',
    amount: 75000.0,
    type: 'expense',
    category: 'Rent & Storage / Showroom',
    invoiceNo: 'LND-OCT26',
    notes: 'Commercial storage and packing studio lease',
  },
  {
    id: 'tx-6',
    date: formatDate(-10),
    description: 'Staff Tailoring & Packing Fortnightly Payroll',
    amount: 98000.0,
    type: 'expense',
    category: 'Employee Salaries & Payroll',
    invoiceNo: 'PAY-OCT-1',
    notes: 'Salaries for packing assistants & sewing staff',
  },
  {
    id: 'tx-7',
    date: formatDate(-12),
    description: 'Meta & Instagram Ads Promotion Spend',
    amount: 28500.0,
    type: 'expense',
    category: 'Advertising & Meta/Google Ads',
    invoiceNo: 'FB-98124',
    notes: 'Newborn essentials festive sales campaign',
  },
  {
    id: 'tx-8',
    date: formatDate(-14),
    description: 'Custom Corrugated Boxes & Poly Mailers',
    amount: 24500.0,
    type: 'expense',
    category: 'Packaging & Box Supplies',
    invoiceNo: 'PKG-774',
    notes: '1,000 branded baby wear packaging boxes',
  },
  {
    id: 'tx-9',
    date: formatDate(-17),
    description: 'CEB Commercial Power & Water Utilities',
    amount: 16800.0,
    type: 'expense',
    category: 'Utilities (CEB Electricity & Water)',
    invoiceNo: 'CEB-55102',
    notes: 'Electricity bill for showroom and ironers',
  },
  {
    id: 'tx-10',
    date: formatDate(-20),
    description: 'Commercial Bank Payment Gateway Fees',
    amount: 4950.0,
    type: 'expense',
    category: 'Bank Charges & Gateway Fees',
    invoiceNo: 'IPG-OCT',
    notes: 'Visa & MasterCard 2.5% transaction processing fees',
  },
  {
    id: 'tx-11',
    date: formatDate(-22),
    description: 'Prompt Xpress Courier Delivery Fees',
    amount: 18200.0,
    type: 'expense',
    category: 'Courier & Logistics (COD Fees)',
    invoiceNo: 'LOG-309',
    notes: 'Monthly door-to-door islandwide deliveries',
  },
  {
    id: 'tx-12',
    date: formatDate(-25),
    description: 'Delivery Van Fuel & Servicing',
    amount: 14500.0,
    type: 'expense',
    category: 'Business Transport & Fuel',
    notes: 'Stock transportation from factory to warehouse',
  },
]

export const SAMPLE_SUBSCRIPTIONS: Subscription[] = [
  {
    id: 'sub-1',
    name: 'Shopify Advanced E-Commerce Store',
    amount: 14500.0,
    billingCycle: 'monthly',
    category: 'Software, Shopify & Subscriptions',
    renewalDate: formatDate(5),
    active: true,
    notes: 'Store checkout & customer portal',
  },
  {
    id: 'sub-2',
    name: 'Meta Ads Manager Recurring Retainer',
    amount: 35000.0,
    billingCycle: 'monthly',
    category: 'Advertising & Meta/Google Ads',
    renewalDate: formatDate(12),
    active: true,
    notes: 'Digital marketing performance campaign',
  },
  {
    id: 'sub-3',
    name: 'Accounting & Invoicing Software (Xero)',
    amount: 6800.0,
    billingCycle: 'monthly',
    category: 'Software, Shopify & Subscriptions',
    renewalDate: formatDate(18),
    active: true,
    notes: 'Bookkeeping and tax ledger',
  },
  {
    id: 'sub-4',
    name: 'SLT Commercial Unlimited Fiber Internet',
    amount: 8500.0,
    billingCycle: 'monthly',
    category: 'Internet, Phone & Communications',
    renewalDate: formatDate(2),
    active: true,
    notes: 'Warehouse & office connectivity',
  },
  {
    id: 'sub-5',
    name: 'Annual Trademark & Business Registration Fee',
    amount: 24000.0,
    billingCycle: 'yearly',
    category: 'Taxes, Duties & Government Fees',
    renewalDate: formatDate(60),
    active: true,
    notes: 'Company Registrar & legal renewal',
  },
  {
    id: 'sub-6',
    name: 'Bulk SMS Notification Gateway',
    amount: 3500.0,
    billingCycle: 'monthly',
    category: 'Internet, Phone & Communications',
    renewalDate: formatDate(22),
    active: true,
    notes: 'Automated order dispatch & tracking SMS',
  },
]

export const SAMPLE_UPCOMING: UpcomingItem[] = [
  {
    id: 'up-1',
    title: 'Weekly Courier COD Settlement Payout',
    amount: 145000.0,
    type: 'income',
    dueDate: formatDate(3),
    category: 'Cash on Delivery (COD) Settlements',
    status: 'pending',
    notes: 'Remittance from courier partner for completed orders',
  },
  {
    id: 'up-2',
    title: 'Cotton & Linen Fabric Supplier Invoice',
    amount: 72000.0,
    type: 'expense',
    dueDate: formatDate(6),
    category: 'Inventory & Materials (COGS)',
    status: 'pending',
    notes: 'Textile supplier 30-day payment term',
  },
  {
    id: 'up-3',
    title: 'Monthly Warehouse & Studio Lease Rent',
    amount: 75000.0,
    type: 'expense',
    dueDate: formatDate(9),
    category: 'Rent & Storage / Showroom',
    status: 'pending',
    notes: 'Direct bank transfer to premises owner',
  },
  {
    id: 'up-4',
    title: 'Wholesale Baby Boutique Bulk Invoice',
    amount: 110000.0,
    type: 'income',
    dueDate: formatDate(12),
    category: 'Wholesale & Bulk Orders',
    status: 'pending',
    notes: 'Consignment sales balance clearance',
  },
  {
    id: 'up-5',
    title: 'CEB Showroom & Studio Electricity',
    amount: 17500.0,
    type: 'expense',
    dueDate: formatDate(18),
    category: 'Utilities (CEB Electricity & Water)',
    status: 'pending',
    notes: 'Monthly power consumption bill',
  },
  {
    id: 'up-6',
    title: 'Staff Mid-Month Payroll Advance Run',
    amount: 52000.0,
    type: 'expense',
    dueDate: formatDate(15),
    category: 'Employee Salaries & Payroll',
    status: 'pending',
    notes: 'Mid-month staff advance payments',
  },
]
