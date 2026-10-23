import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  CURRENCIES,
  normalizeBusinessCategory,
  SAMPLE_SUBSCRIPTIONS,
  SAMPLE_TRANSACTIONS,
  SAMPLE_UPCOMING,
} from '../data/categories'
import type {
  AppDataBackup,
  Subscription,
  ToastMessage,
  Transaction,
  UpcomingItem,
  UserSettings,
} from '../types/finance'
import {
  clearSupabaseCredentials,
  getSupabase,
  isSupabaseReady,
  rowToSubscription,
  rowToTransaction,
  rowToUpcoming,
  saveSupabaseCredentials,
  subscriptionToRow,
  testSupabaseConnection,
  transactionToRow,
  upcomingToRow,
} from '../lib/supabase'

interface FinanceContextType {
  transactions: Transaction[]
  subscriptions: Subscription[]
  upcomingItems: UpcomingItem[]
  settings: UserSettings
  toasts: ToastMessage[]

  // Action helpers
  addTransaction: (tx: Omit<Transaction, 'id'>) => void
  updateTransaction: (tx: Transaction) => void
  deleteTransaction: (id: string) => void

  addSubscription: (sub: Omit<Subscription, 'id'>) => void
  updateSubscription: (sub: Subscription) => void
  deleteSubscription: (id: string) => void
  toggleSubscriptionActive: (id: string) => void

  addUpcomingItem: (item: Omit<UpcomingItem, 'id'>) => void
  updateUpcomingItem: (item: UpcomingItem) => void
  deleteUpcomingItem: (id: string) => void
  markUpcomingCleared: (id: string, convertToTransaction?: boolean) => void

  // Persistence & Data Management
  exportData: () => AppDataBackup
  importData: (data: AppDataBackup, mode: 'replace' | 'merge') => boolean
  resetData: () => void
  loadSampleData: () => void
  updateSettings: (newSettings: Partial<UserSettings>) => void
  toggleTheme: () => void

  // Cloud Collaboration (Supabase)
  supabaseStatus: 'connected' | 'connecting' | 'offline' | 'unconfigured'
  connectSupabase: (url: string, anonKey: string) => Promise<{ success: boolean; error?: string }>
  disconnectSupabase: () => void
  syncLocalToSupabase: () => Promise<void>

  // Toasts
  addToast: (toast: Omit<ToastMessage, 'id'>) => void
  removeToast: (id: string) => void

  // Currency helpers
  formatCurrency: (amount: number) => string
  currencySymbol: string

  // Windows Desktop File Helper
  openReceiptInWindows: (filePath: string, showInFolder?: boolean) => Promise<void>

  // Computed metrics
  metrics: {
    totalIncome: number
    totalExpenses: number
    netCashFlow: number
    currentMonthIncome: number
    currentMonthExpenses: number
    currentMonthNet: number
    monthlySubscriptionCost: number
    annualSubscriptionCost: number
    activeSubscriptionCount: number
    pendingUpcomingIncome: number
    pendingUpcomingExpenses: number
    projected30DayBalance: number
  }
}

const STORAGE_KEYS = {
  TRANSACTIONS: 'finance_flow_transactions_v1',
  SUBSCRIPTIONS: 'finance_flow_subscriptions_v1',
  UPCOMING: 'finance_flow_upcoming_v1',
  SETTINGS: 'finance_flow_settings_v1',
}

const DEFAULT_SETTINGS: UserSettings = {
  currency: 'LKR',
  theme: 'dark',
  dateFormat: 'YYYY-MM-DD',
  businessName: 'My Business',
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined)

// Helper filters to identify demo/placeholder entries
const isPlaceholderTransaction = (tx: Transaction): boolean => {
  if (!tx) return true
  // Mock IDs from demo datasets: tx-1, tx-2, ..., tx-12
  if (/^tx-[0-9]{1,2}$/.test(tx.id)) return true
  const sampleKeywords = [
    'Boutique Store Retail Orders',
    'Raw Fabric & Cotton Nursery',
    'Koombiyo Weekly COD Remittance',
    'Wholesale Baby Care Gift Box',
    'Warehouse & Studio Monthly Rent',
    'Staff Tailoring & Packing Fortnightly',
    'Meta & Instagram Ads Promotion',
    'Custom Corrugated Boxes & Poly',
    'CEB Commercial Power & Water',
    'Commercial Bank Payment Gateway',
    'Prompt Xpress Courier Delivery',
    'Delivery Van Fuel & Servicing',
    'Keells Supermarket',
    'Client Web App',
    'Espresso & Artisan Cafe',
    'Monthly Apartment Rent',
    'Monthly Senior Software Engineer',
    'CEB Electricity & SLT Fiber',
    'Colombo Stock Exchange',
    'Ceypetco Fuel',
    'Dinner at Ministry of Crab',
    'Ergonomic Desk & Mechanical',
    'Digital Product Template Sales',
    'Asiri Hospital Health Checkup',
  ]
  return sampleKeywords.some((kw) => tx.description.toLowerCase().includes(kw.toLowerCase()))
}

const isPlaceholderSubscription = (sub: Subscription): boolean => {
  if (!sub) return true
  if (/^sub-[0-9]{1,2}$/.test(sub.id)) return true
  const sampleKeywords = [
    'Shopify Advanced',
    'Meta Ads Manager',
    'Accounting & Invoicing',
    'SLT Commercial',
    'Annual Trademark',
    'Bulk SMS',
    'Netflix',
    'Spotify',
    'AWS Cloud',
    'GitHub Copilot',
    'Gym',
    'ChatGPT Plus',
  ]
  return sampleKeywords.some((kw) => sub.name.toLowerCase().includes(kw.toLowerCase()))
}

const isPlaceholderUpcoming = (up: UpcomingItem): boolean => {
  if (!up) return true
  if (/^up-[0-9]{1,2}$/.test(up.id)) return true
  const sampleKeywords = [
    'Weekly Courier COD',
    'Cotton & Linen Fabric',
    'Monthly Warehouse & Studio',
    'Wholesale Baby Boutique',
    'CEB Showroom',
    'Staff Mid-Month Payroll',
    'Client Consulting Retainer',
    'CEB Electricity',
    'Apartment Monthly Rent',
    'Mid-Month Corporate Consignment',
  ]
  return sampleKeywords.some((kw) => up.title.toLowerCase().includes(kw.toLowerCase()))
}

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State initialization with localStorage fallback - starts fresh with 0 placeholders
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          // Filter out placeholder transactions so the user starts fresh
          const userOnly = (parsed as Transaction[]).filter((tx) => !isPlaceholderTransaction(tx))
          return userOnly.map((tx) => ({
            ...tx,
            category: normalizeBusinessCategory(tx.category, tx.type, tx.description),
          }))
        }
      }
      return []
    } catch {
      return []
    }
  })

  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          const userOnly = (parsed as Subscription[]).filter((sub) => !isPlaceholderSubscription(sub))
          return userOnly.map((sub) => ({
            ...sub,
            category: normalizeBusinessCategory(sub.category, 'expense', sub.name),
          }))
        }
      }
      return []
    } catch {
      return []
    }
  })

  const [upcomingItems, setUpcomingItems] = useState<UpcomingItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.UPCOMING)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          const userOnly = (parsed as UpcomingItem[]).filter((item) => !isPlaceholderUpcoming(item))
          return userOnly.map((item) => ({
            ...item,
            category: normalizeBusinessCategory(item.category, item.type, item.title),
          }))
        }
      }
      return []
    } catch {
      return []
    }
  })

  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS)
      if (saved) {
        const parsed = JSON.parse(saved)
        // Upgrade currency to LKR if it was default USD
        if (parsed.currency === 'USD') {
          return { ...DEFAULT_SETTINGS, ...parsed, currency: 'LKR' }
        }
        return { ...DEFAULT_SETTINGS, ...parsed }
      }
      return DEFAULT_SETTINGS
    } catch {
      return DEFAULT_SETTINGS
    }
  })

  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [supabaseEpoch, setSupabaseEpoch] = useState(0)
  const [supabaseStatus, setSupabaseStatus] = useState<'connected' | 'connecting' | 'offline' | 'unconfigured'>(
    isSupabaseReady() ? 'connecting' : 'unconfigured'
  )

  // Supabase Initial Cloud Fetch & Realtime Listeners
  useEffect(() => {
    const client = getSupabase()
    if (!client) {
      setSupabaseStatus('unconfigured')
      return
    }

    let isMounted = true
    let channel: any = null

    const loadCloudData = async () => {
      try {
        setSupabaseStatus('connecting')
        // 1. Fetch Transactions
        const { data: txData, error: txErr } = await client
          .from('transactions')
          .select('*')
          .order('date', { ascending: false })

        if (txErr) {
          if (txErr.code === '42P01' || txErr.message?.includes('does not exist')) {
            if (isMounted) {
              setSupabaseStatus('offline')
              addToast({
                type: 'warning',
                title: 'Database Tables Missing',
                message: 'Supabase connected, but tables were not found! Copy the SQL script in Settings and run it in SQL Editor.',
              })
            }
            return
          }
          throw txErr
        }

        // 2. Fetch Subscriptions
        const { data: subData, error: subErr } = await client
          .from('subscriptions')
          .select('*')
          .order('name', { ascending: true })

        if (subErr) throw subErr

        // 3. Fetch Upcoming Items
        const { data: upData, error: upErr } = await client
          .from('upcoming_items')
          .select('*')
          .order('due_date', { ascending: true })

        if (upErr) throw upErr

        // 4. Fetch Settings
        const { data: setRow } = await client
          .from('business_settings')
          .select('*')
          .eq('id', 'default')
          .single()

        if (isMounted) {
          if (txData && txData.length > 0) {
            setTransactions(txData.map(rowToTransaction))
          }
          if (subData && subData.length > 0) {
            setSubscriptions(subData.map(rowToSubscription))
          }
          if (upData && upData.length > 0) {
            setUpcomingItems(upData.map(rowToUpcoming))
          }
          if (setRow) {
            setSettings((prev) => ({
              ...prev,
              businessName: setRow.business_name || prev.businessName,
              currency: (setRow.currency as any) || prev.currency,
              dateFormat: setRow.date_format || prev.dateFormat,
            }))
          }
          setSupabaseStatus('connected')
        }
      } catch (err: any) {
        console.warn('Supabase cloud connection warning:', err?.message || err)
        if (isMounted) setSupabaseStatus('offline')
      }
    }

    loadCloudData()

    // Realtime channel for team collaboration
    channel = client
      .channel('finance_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newTx = rowToTransaction(payload.new)
            setTransactions((prev) => {
              if (prev.some((t) => t.id === newTx.id)) return prev
              return [newTx, ...prev]
            })
            addToast({
              type: 'info',
              title: 'Partner Added Entry',
              message: `${newTx.description} (${newTx.type === 'income' ? '+' : '-'}${newTx.amount.toFixed(2)})`,
            })
          } else if (payload.eventType === 'UPDATE') {
            const updatedTx = rowToTransaction(payload.new)
            setTransactions((prev) => prev.map((t) => (t.id === updatedTx.id ? updatedTx : t)))
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as any).id
            setTransactions((prev) => prev.filter((t) => t.id !== deletedId))
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'subscriptions' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newSub = rowToSubscription(payload.new)
            setSubscriptions((prev) => {
              if (prev.some((s) => s.id === newSub.id)) return prev
              return [newSub, ...prev]
            })
          } else if (payload.eventType === 'UPDATE') {
            const updatedSub = rowToSubscription(payload.new)
            setSubscriptions((prev) => prev.map((s) => (s.id === updatedSub.id ? updatedSub : s)))
          } else if (payload.eventType === 'DELETE') {
            setSubscriptions((prev) => prev.filter((s) => s.id !== (payload.old as any).id))
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'upcoming_items' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newItem = rowToUpcoming(payload.new)
            setUpcomingItems((prev) => {
              if (prev.some((i) => i.id === newItem.id)) return prev
              return [newItem, ...prev]
            })
          } else if (payload.eventType === 'UPDATE') {
            const updatedItem = rowToUpcoming(payload.new)
            setUpcomingItems((prev) => prev.map((i) => (i.id === updatedItem.id ? updatedItem : i)))
          } else if (payload.eventType === 'DELETE') {
            setUpcomingItems((prev) => prev.filter((i) => i.id !== (payload.old as any).id))
          }
        }
      )
      .subscribe((status) => {
        if (isMounted && status === 'SUBSCRIBED') {
          setSupabaseStatus('connected')
        }
      })

    return () => {
      isMounted = false
      if (channel) {
        client.removeChannel(channel)
      }
    }
  }, [supabaseEpoch])

  // Toast Helper
  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = 'toast-' + Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { ...toast, id }])
    setTimeout(() => {
      removeToast(id)
    }, 4000)
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  // Synchronize state changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions))
    } catch (e) {
      console.error('Failed to save transactions to localStorage', e)
    }
  }, [transactions])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(subscriptions))
    } catch (e) {
      console.error('Failed to save subscriptions to localStorage', e)
    }
  }, [subscriptions])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.UPCOMING, JSON.stringify(upcomingItems))
    } catch (e) {
      console.error('Failed to save upcoming items to localStorage', e)
    }
  }, [upcomingItems])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings))
    } catch (e) {
      console.error('Failed to save settings to localStorage', e)
    }

    // Apply dark class to root document
    const root = document.documentElement
    if (settings.theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [settings])

  // Currency Formatter
  const currencyConfig = CURRENCIES[settings.currency] || CURRENCIES.USD
  const currencySymbol = currencyConfig.symbol

  const formatCurrency = (amount: number): string => {
    const isNegative = amount < 0
    const abs = Math.abs(amount)
    const formatted = abs.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    return `${isNegative ? '-' : ''}${currencySymbol}${formatted}`
  }

  // Transactions Handlers
  const addTransaction = async (txData: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = {
      ...txData,
      category: normalizeBusinessCategory(txData.category, txData.type, txData.description),
      id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    }
    setTransactions((prev) => [newTx, ...prev])
    addToast({
      type: 'success',
      title: 'Transaction Recorded',
      message: `${newTx.type === 'income' ? '+' : '-'}${currencySymbol}${newTx.amount.toFixed(2)}: ${newTx.description}`,
    })

    const client = getSupabase()
    if (client && supabaseStatus === 'connected') {
      try {
        await client.from('transactions').insert(transactionToRow(newTx))
      } catch (e) {
        console.error('Supabase transaction insert failed:', e)
      }
    }
  }

  const updateTransaction = async (updatedTx: Transaction) => {
    const normalizedTx: Transaction = {
      ...updatedTx,
      category: normalizeBusinessCategory(updatedTx.category, updatedTx.type, updatedTx.description),
    }
    setTransactions((prev) => prev.map((t) => (t.id === normalizedTx.id ? normalizedTx : t)))
    addToast({
      type: 'success',
      title: 'Transaction Updated',
      message: normalizedTx.description,
    })

    const client = getSupabase()
    if (client && supabaseStatus === 'connected') {
      try {
        await client.from('transactions').update(transactionToRow(normalizedTx)).eq('id', normalizedTx.id)
      } catch (e) {
        console.error('Supabase transaction update failed:', e)
      }
    }
  }

  const deleteTransaction = async (id: string) => {
    const tx = transactions.find((t) => t.id === id)
    setTransactions((prev) => prev.filter((t) => t.id !== id))
    addToast({
      type: 'info',
      title: 'Transaction Removed',
      message: tx ? tx.description : 'Transaction deleted',
    })

    const client = getSupabase()
    if (client && supabaseStatus === 'connected') {
      try {
        await client.from('transactions').delete().eq('id', id)
      } catch (e) {
        console.error('Supabase transaction delete failed:', e)
      }
    }
  }

  // Subscriptions Handlers
  const addSubscription = async (subData: Omit<Subscription, 'id'>) => {
    const newSub: Subscription = {
      ...subData,
      category: normalizeBusinessCategory(subData.category, 'expense', subData.name),
      id: 'sub-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    }
    setSubscriptions((prev) => [newSub, ...prev])
    addToast({
      type: 'success',
      title: 'Subscription Added',
      message: `${newSub.name} (${currencySymbol}${newSub.amount}/${newSub.billingCycle})`,
    })

    const client = getSupabase()
    if (client && supabaseStatus === 'connected') {
      try {
        await client.from('subscriptions').insert(subscriptionToRow(newSub))
      } catch (e) {
        console.error('Supabase subscription insert failed:', e)
      }
    }
  }

  const updateSubscription = async (updatedSub: Subscription) => {
    const normalizedSub: Subscription = {
      ...updatedSub,
      category: normalizeBusinessCategory(updatedSub.category, 'expense', updatedSub.name),
    }
    setSubscriptions((prev) => prev.map((s) => (s.id === normalizedSub.id ? normalizedSub : s)))
    addToast({
      type: 'success',
      title: 'Subscription Updated',
      message: normalizedSub.name,
    })

    const client = getSupabase()
    if (client && supabaseStatus === 'connected') {
      try {
        await client.from('subscriptions').update(subscriptionToRow(normalizedSub)).eq('id', normalizedSub.id)
      } catch (e) {
        console.error('Supabase subscription update failed:', e)
      }
    }
  }

  const deleteSubscription = async (id: string) => {
    const sub = subscriptions.find((s) => s.id === id)
    setSubscriptions((prev) => prev.filter((s) => s.id !== id))
    addToast({
      type: 'info',
      title: 'Subscription Removed',
      message: sub ? sub.name : 'Subscription deleted',
    })

    const client = getSupabase()
    if (client && supabaseStatus === 'connected') {
      try {
        await client.from('subscriptions').delete().eq('id', id)
      } catch (e) {
        console.error('Supabase subscription delete failed:', e)
      }
    }
  }

  const toggleSubscriptionActive = async (id: string) => {
    let updatedItem: Subscription | undefined
    setSubscriptions((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const nextActive = !s.active
          updatedItem = { ...s, active: nextActive }
          addToast({
            type: 'info',
            title: nextActive ? 'Subscription Activated' : 'Subscription Paused',
            message: s.name,
          })
          return updatedItem
        }
        return s
      })
    )

    const client = getSupabase()
    if (client && supabaseStatus === 'connected' && updatedItem) {
      try {
        await client.from('subscriptions').update(subscriptionToRow(updatedItem)).eq('id', id)
      } catch (e) {
        console.error('Supabase subscription toggle failed:', e)
      }
    }
  }

  // Upcoming Items Handlers
  const addUpcomingItem = async (itemData: Omit<UpcomingItem, 'id'>) => {
    const newItem: UpcomingItem = {
      ...itemData,
      category: normalizeBusinessCategory(itemData.category, itemData.type, itemData.title),
      id: 'up-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    }
    setUpcomingItems((prev) => [newItem, ...prev])
    addToast({
      type: 'success',
      title: 'Upcoming Item Scheduled',
      message: `${newItem.title} (${currencySymbol}${newItem.amount.toFixed(2)})`,
    })

    const client = getSupabase()
    if (client && supabaseStatus === 'connected') {
      try {
        await client.from('upcoming_items').insert(upcomingToRow(newItem))
      } catch (e) {
        console.error('Supabase upcoming item insert failed:', e)
      }
    }
  }

  const updateUpcomingItem = async (updatedItem: UpcomingItem) => {
    const normalizedItem: UpcomingItem = {
      ...updatedItem,
      category: normalizeBusinessCategory(updatedItem.category, updatedItem.type, updatedItem.title),
    }
    setUpcomingItems((prev) => prev.map((item) => (item.id === normalizedItem.id ? normalizedItem : item)))
    addToast({
      type: 'success',
      title: 'Upcoming Item Updated',
      message: normalizedItem.title,
    })

    const client = getSupabase()
    if (client && supabaseStatus === 'connected') {
      try {
        await client.from('upcoming_items').update(upcomingToRow(normalizedItem)).eq('id', normalizedItem.id)
      } catch (e) {
        console.error('Supabase upcoming item update failed:', e)
      }
    }
  }

  const deleteUpcomingItem = async (id: string) => {
    const item = upcomingItems.find((i) => i.id === id)
    setUpcomingItems((prev) => prev.filter((i) => i.id !== id))
    addToast({
      type: 'info',
      title: 'Upcoming Item Removed',
      message: item ? item.title : 'Item deleted',
    })

    const client = getSupabase()
    if (client && supabaseStatus === 'connected') {
      try {
        await client.from('upcoming_items').delete().eq('id', id)
      } catch (e) {
        console.error('Supabase upcoming item delete failed:', e)
      }
    }
  }

  const markUpcomingCleared = (id: string, convertToTransaction = false) => {
    const item = upcomingItems.find((i) => i.id === id)
    if (!item) return

    let createdTxId: string | undefined

    if (convertToTransaction) {
      createdTxId = 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6)
      const newTx: Transaction = {
        id: createdTxId,
        date: new Date().toISOString().split('T')[0],
        description: item.title,
        amount: item.amount,
        type: item.type,
        category: normalizeBusinessCategory(item.category, item.type, item.title),
        notes: item.notes ? `Converted from upcoming: ${item.notes}` : 'Converted from scheduled item',
      }
      setTransactions((prev) => [newTx, ...prev])
    }

    setUpcomingItems((prev) =>
      prev.map((i) => {
        if (i.id === id) {
          return {
            ...i,
            status: 'cleared',
            convertedTransactionId: createdTxId || i.convertedTransactionId,
          }
        }
        return i
      })
    )

    addToast({
      type: 'success',
      title: convertToTransaction ? 'Marked Cleared & Converted' : 'Marked Cleared',
      message: convertToTransaction
        ? `Added to Transactions as ${item.type}: ${currencySymbol}${item.amount.toFixed(2)}`
        : `${item.title} marked as completed`,
    })
  }

  // Backup & Restore
  const exportData = (): AppDataBackup => {
    const backup: AppDataBackup = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      settings,
      transactions,
      subscriptions,
      upcomingItems,
    }
    return backup
  }

  const importData = (data: AppDataBackup, mode: 'replace' | 'merge'): boolean => {
    try {
      if (!data || !Array.isArray(data.transactions) || !Array.isArray(data.subscriptions)) {
        throw new Error('Invalid JSON format: missing transactions or subscriptions arrays.')
      }

      if (mode === 'replace') {
        setTransactions(data.transactions)
        setSubscriptions(data.subscriptions)
        setUpcomingItems(Array.isArray(data.upcomingItems) ? data.upcomingItems : [])
        if (data.settings) {
          setSettings(data.settings)
        }
      } else {
        // Merge: deduplicate by id
        setTransactions((prev) => {
          const existingIds = new Set(prev.map((t) => t.id))
          const newOnes = data.transactions.filter((t) => !existingIds.has(t.id))
          return [...newOnes, ...prev]
        })

        setSubscriptions((prev) => {
          const existingIds = new Set(prev.map((s) => s.id))
          const newOnes = data.subscriptions.filter((s) => !existingIds.has(s.id))
          return [...prev, ...newOnes]
        })

        if (Array.isArray(data.upcomingItems)) {
          setUpcomingItems((prev) => {
            const existingIds = new Set(prev.map((u) => u.id))
            const newOnes = data.upcomingItems.filter((u) => !existingIds.has(u.id))
            return [...prev, ...newOnes]
          })
        }
      }

      addToast({
        type: 'success',
        title: 'Data Successfully Imported',
        message: `${data.transactions.length} transactions and ${data.subscriptions.length} subscriptions loaded.`,
      })
      return true
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Import Failed',
        message: err.message || 'The selected file is not a valid FinanceFlow backup JSON.',
      })
      return false
    }
  }

  const resetData = () => {
    setTransactions([])
    setSubscriptions([])
    setUpcomingItems([])
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS)
    localStorage.removeItem(STORAGE_KEYS.SUBSCRIPTIONS)
    localStorage.removeItem(STORAGE_KEYS.UPCOMING)
    addToast({
      type: 'warning',
      title: 'All Data Cleared',
      message: 'Your database has been wiped clean.',
    })
  }

  const loadSampleData = () => {
    setTransactions(SAMPLE_TRANSACTIONS)
    setSubscriptions(SAMPLE_SUBSCRIPTIONS)
    setUpcomingItems(SAMPLE_UPCOMING)
    addToast({
      type: 'success',
      title: 'Sample Data Loaded',
      message: 'Demo dataset restored with transactions, subscriptions, and projections.',
    })
  }

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }))
    addToast({
      type: 'info',
      title: 'Settings Saved',
      message: 'Your preferences have been updated.',
    })

    const client = getSupabase()
    if (client && supabaseStatus === 'connected') {
      try {
        await client.from('business_settings').upsert({
          id: 'default',
          business_name: newSettings.businessName || settings.businessName,
          currency: newSettings.currency || settings.currency,
          date_format: newSettings.dateFormat || settings.dateFormat,
          theme: newSettings.theme || settings.theme,
          updated_at: new Date().toISOString(),
        })
      } catch (e) {
        console.error('Supabase settings update failed:', e)
      }
    }
  }

  const connectSupabase = async (url: string, anonKey: string): Promise<{ success: boolean; error?: string }> => {
    saveSupabaseCredentials(url, anonKey)
    setSupabaseStatus('connecting')
    const test = await testSupabaseConnection()
    if (test.success) {
      setSupabaseStatus('connected')
      setSupabaseEpoch((v) => v + 1)
      addToast({
        type: 'success',
        title: 'Supabase Connected!',
        message: 'Online database and live sync with your business partner are active.',
      })
      return { success: true }
    } else {
      setSupabaseStatus('offline')
      return { success: false, error: test.error }
    }
  }

  const disconnectSupabase = () => {
    clearSupabaseCredentials()
    setSupabaseStatus('unconfigured')
    setSupabaseEpoch((v) => v + 1)
    addToast({
      type: 'info',
      title: 'Disconnected from Supabase',
      message: 'Switched back to local mode.',
    })
  }

  const syncLocalToSupabase = async () => {
    const client = getSupabase()
    if (!client) throw new Error('Supabase not connected')

    try {
      if (transactions.length > 0) {
        await client.from('transactions').upsert(transactions.map(transactionToRow))
      }
      if (subscriptions.length > 0) {
        await client.from('subscriptions').upsert(subscriptions.map(subscriptionToRow))
      }
      if (upcomingItems.length > 0) {
        await client.from('upcoming_items').upsert(upcomingItems.map(upcomingToRow))
      }
      addToast({
        type: 'success',
        title: 'Data Synced to Cloud',
        message: 'All local records successfully uploaded to your shared database.',
      })
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Sync Failed',
        message: err.message,
      })
      throw err
    }
  }

  const toggleTheme = () => {
    setSettings((prev) => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }))
  }

  // Dynamic Calculated Metrics
  const now = new Date()
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + Number(t.amount || 0), 0)

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + Number(t.amount || 0), 0)

  const netCashFlow = totalIncome - totalExpenses

  // Current Month calculations
  const currentMonthTransactions = transactions.filter((t) => t.date.startsWith(currentYearMonth))
  const currentMonthIncome = currentMonthTransactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + Number(t.amount || 0), 0)

  const currentMonthExpenses = currentMonthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + Number(t.amount || 0), 0)

  const currentMonthNet = currentMonthIncome - currentMonthExpenses

  // Subscriptions recurring calculation
  const activeSubs = subscriptions.filter((s) => s.active)
  const monthlySubscriptionCost = activeSubs.reduce((acc, s) => {
    const amt = Number(s.amount || 0)
    if (s.billingCycle === 'monthly') return acc + amt
    if (s.billingCycle === 'yearly') return acc + amt / 12
    if (s.billingCycle === 'weekly') return acc + (amt * 52) / 12
    return acc + amt
  }, 0)

  const annualSubscriptionCost = monthlySubscriptionCost * 12
  const activeSubscriptionCount = activeSubs.length

  // Pending Upcoming Items
  const pendingUpcoming = upcomingItems.filter((i) => i.status === 'pending')
  const pendingUpcomingIncome = pendingUpcoming
    .filter((i) => i.type === 'income')
    .reduce((acc, i) => acc + Number(i.amount || 0), 0)

  const pendingUpcomingExpenses = pendingUpcoming
    .filter((i) => i.type === 'expense')
    .reduce((acc, i) => acc + Number(i.amount || 0), 0)

  // 30-Day Runway Forecast
  const projected30DayBalance =
    netCashFlow + pendingUpcomingIncome - pendingUpcomingExpenses - monthlySubscriptionCost

  // Windows Native File Opener
  const openReceiptInWindows = async (filePath: string, showInFolder = false) => {
    try {
      const res = await fetch('/api/open-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath, showInFolder }),
      })
      const data = await res.json()
      if (!data.success) {
        throw new Error(data.error || 'Could not open file')
      }
    } catch (err: any) {
      addToast({
        type: 'warning',
        title: 'Could not open file in Windows',
        message: err.message || 'Make sure the file exists in the receipts directory.',
      })
    }
  }

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        subscriptions,
        upcomingItems,
        settings,
        toasts,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addSubscription,
        updateSubscription,
        deleteSubscription,
        toggleSubscriptionActive,
        addUpcomingItem,
        updateUpcomingItem,
        deleteUpcomingItem,
        markUpcomingCleared,
        exportData,
        importData,
        resetData,
        loadSampleData,
        updateSettings,
        toggleTheme,
        addToast,
        removeToast,
        formatCurrency,
        currencySymbol,
        openReceiptInWindows,
        supabaseStatus,
        connectSupabase,
        disconnectSupabase,
        syncLocalToSupabase,
        metrics: {
          totalIncome,
          totalExpenses,
          netCashFlow,
          currentMonthIncome,
          currentMonthExpenses,
          currentMonthNet,
          monthlySubscriptionCost,
          annualSubscriptionCost,
          activeSubscriptionCount,
          pendingUpcomingIncome,
          pendingUpcomingExpenses,
          projected30DayBalance,
        },
      }}
    >
      {children}
    </FinanceContext.Provider>
  )
}

export const useFinance = () => {
  const context = useContext(FinanceContext)
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider')
  }
  return context
}
