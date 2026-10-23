import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type {
  Subscription,
  Transaction,
  UpcomingItem,
} from '../types/finance'

const CONFIG_KEY = 'finance_flow_supabase_config'

export interface SupabaseConfig {
  url: string
  anonKey: string
}

export const getStoredSupabaseConfig = (): SupabaseConfig | null => {
  try {
    const envUrl = import.meta.env.VITE_SUPABASE_URL
    const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    if (envUrl && envKey && !envUrl.includes('your-project')) {
      return { url: envUrl, anonKey: envKey }
    }

    const saved = localStorage.getItem(CONFIG_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed?.url && parsed?.anonKey) {
        return parsed
      }
    }
    return null
  } catch {
    return null
  }
}

let supabaseInstance: SupabaseClient | null = null
let currentConfigString = ''

export const getSupabase = (): SupabaseClient | null => {
  const config = getStoredSupabaseConfig()
  if (!config) {
    supabaseInstance = null
    currentConfigString = ''
    return null
  }

  const configString = `${config.url}|${config.anonKey}`
  if (!supabaseInstance || currentConfigString !== configString) {
    supabaseInstance = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
    currentConfigString = configString
  }

  return supabaseInstance
}

export const isSupabaseReady = (): boolean => {
  return getStoredSupabaseConfig() !== null
}

export const saveSupabaseCredentials = (url: string, anonKey: string): void => {
  let cleanUrl = url.trim().replace(/^["']|["']$/g, '').replace(/\/+$/, '')
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = 'https://' + cleanUrl
  }
  const cleanKey = anonKey.trim().replace(/^["']|["']$/g, '')
  localStorage.setItem(CONFIG_KEY, JSON.stringify({ url: cleanUrl, anonKey: cleanKey }))
  // Force client recreation
  supabaseInstance = null
  currentConfigString = ''
}

export const clearSupabaseCredentials = (): void => {
  localStorage.removeItem(CONFIG_KEY)
  supabaseInstance = null
  currentConfigString = ''
}

export const testSupabaseConnection = async (): Promise<{ success: boolean; error?: string }> => {
  const client = getSupabase()
  if (!client) {
    return { success: false, error: 'Supabase credentials not configured' }
  }

  try {
    // Quick probe to check connection and schema
    const { error } = await client.from('transactions').select('id').limit(1)
    if (error) {
      if (error.code === '42P01' || error.message?.toLowerCase().includes('relation') || error.message?.includes('does not exist')) {
        return {
          success: false,
          error: 'Connected to Supabase, but the tables do not exist yet! Click "Copy Setup SQL Script" in Settings and run it in your Supabase SQL Editor.',
        }
      }
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Connection test failed' }
  }
}

// ----------------------------------------------------------------------------
// Database Model Mappers (CamelCase TS <-> snake_case Postgres)
// ----------------------------------------------------------------------------

export const rowToTransaction = (row: any): Transaction => ({
  id: row.id,
  date: row.date,
  description: row.description,
  amount: Number(row.amount || 0),
  type: row.type,
  category: row.category,
  notes: row.notes || undefined,
  invoiceNo: row.invoice_no || undefined,
  receiptUrl: row.receipt_url || undefined,
  receiptPath: row.receipt_path || undefined,
  receiptName: row.receipt_name || undefined,
})

export const transactionToRow = (tx: Transaction) => ({
  id: tx.id,
  date: tx.date,
  description: tx.description,
  amount: tx.amount,
  type: tx.type,
  category: tx.category,
  notes: tx.notes || null,
  invoice_no: tx.invoiceNo || null,
  receipt_url: tx.receiptUrl || null,
  receipt_path: tx.receiptPath || null,
  receipt_name: tx.receiptName || null,
  updated_at: new Date().toISOString(),
})

export const rowToSubscription = (row: any): Subscription => ({
  id: row.id,
  name: row.name,
  amount: Number(row.amount || 0),
  billingCycle: row.billing_cycle,
  category: row.category,
  renewalDate: row.renewal_date,
  active: Boolean(row.active),
  notes: row.notes || undefined,
})

export const subscriptionToRow = (sub: Subscription) => ({
  id: sub.id,
  name: sub.name,
  amount: sub.amount,
  billing_cycle: sub.billingCycle,
  category: sub.category,
  renewal_date: sub.renewalDate,
  active: sub.active,
  notes: sub.notes || null,
  updated_at: new Date().toISOString(),
})

export const rowToUpcoming = (row: any): UpcomingItem => ({
  id: row.id,
  title: row.title,
  amount: Number(row.amount || 0),
  type: row.type,
  dueDate: row.due_date,
  category: row.category,
  status: row.status,
  notes: row.notes || undefined,
  convertedTransactionId: row.converted_transaction_id || undefined,
})

export const upcomingToRow = (item: UpcomingItem) => ({
  id: item.id,
  title: item.title,
  amount: item.amount,
  type: item.type,
  due_date: item.dueDate,
  category: item.category,
  status: item.status,
  notes: item.notes || null,
  converted_transaction_id: item.convertedTransactionId || null,
  updated_at: new Date().toISOString(),
})

// ----------------------------------------------------------------------------
// Cloud Receipt Storage (Supabase Storage Bucket: 'receipts')
// ----------------------------------------------------------------------------

export const uploadReceiptToCloud = async (
  file: File,
  businessName: string,
  date: string,
  txName: string
): Promise<{ url: string; path: string; fileName: string }> => {
  const client = getSupabase()
  if (!client) {
    throw new Error('Supabase client not initialized')
  }

  const safeBusiness = (businessName || 'Business')
    .replace(/[^a-zA-Z0-9_\-]/g, '_')
    .trim() || 'Business'

  const txDate = new Date(date || Date.now())
  const year = String(txDate.getFullYear() || new Date().getFullYear())
  const month = String(txDate.getMonth() + 1).padStart(2, '0')

  const originalName = file.name || 'receipt.png'
  const ext = originalName.substring(originalName.lastIndexOf('.')) || '.png'
  const safeTxName = (txName || 'transaction')
    .replace(/[^a-zA-Z0-9_\-]/g, '_')
    .substring(0, 40)

  const fileName = `${safeTxName}_${Date.now()}${ext}`
  const storagePath = `${safeBusiness}/${year}/${month}/${fileName}`

  // Upload to Supabase bucket 'receipts'
  const { error: uploadError } = await client.storage
    .from('receipts')
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type || 'application/octet-stream',
    })

  if (uploadError) {
    throw new Error(`Failed to upload receipt to cloud: ${uploadError.message}`)
  }

  // Get public permanent URL
  const { data: publicUrlData } = client.storage
    .from('receipts')
    .getPublicUrl(storagePath)

  return {
    url: publicUrlData.publicUrl,
    path: storagePath,
    fileName,
  }
}
