export type TransactionType = 'income' | 'expense'

export interface Transaction {
  id: string
  date: string // YYYY-MM-DD
  description: string
  amount: number
  type: TransactionType
  category: string
  notes?: string
  invoiceNo?: string // e.g. INV-2026-001
  receiptUrl?: string // Web URL or base64 preview
  receiptPath?: string // Local disk path in receipts/<business>/<year>/<month>/...
  receiptName?: string // Original or generated file name
}

export type BillingCycle = 'monthly' | 'yearly' | 'weekly'

export interface Subscription {
  id: string
  name: string
  amount: number
  billingCycle: BillingCycle
  category: string
  renewalDate: string // YYYY-MM-DD
  active: boolean
  notes?: string
}

export type UpcomingStatus = 'pending' | 'cleared'

export interface UpcomingItem {
  id: string
  title: string
  amount: number
  type: TransactionType
  dueDate: string // YYYY-MM-DD
  category: string
  status: UpcomingStatus
  notes?: string
  convertedTransactionId?: string
}

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY' | 'INR' | 'LKR'

export interface CurrencyConfig {
  code: CurrencyCode
  symbol: string
  name: string
}

export interface UserSettings {
  currency: CurrencyCode
  theme: 'light' | 'dark'
  dateFormat: string
  businessName: string
}

export interface AppDataBackup {
  version: string
  exportedAt: string
  settings: UserSettings
  transactions: Transaction[]
  subscriptions: Subscription[]
  upcomingItems: UpcomingItem[]
}

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message?: string
}
