import React, { useRef, useState } from 'react'
import {
  Building2,
  Check,
  CheckCircle2,
  Cloud,
  Code,
  Copy,
  Database,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FolderArchive,
  FolderOpen,
  Moon,
  Radio,
  RefreshCw,
  Sun,
  Trash2,
  Upload,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { CURRENCIES } from '../../data/categories'
import type { CurrencyCode } from '../../types/finance'
import { useFinance } from '../../context/FinanceContext'
import { getStoredSupabaseConfig } from '../../lib/supabase'
import { SUPABASE_SCHEMA_SQL } from '../../lib/supabaseSchemaSql'
import { ConfirmModal } from '../Modals/ConfirmModal'

export const SettingsView: React.FC = () => {
  const {
    transactions,
    subscriptions,
    upcomingItems,
    settings,
    updateSettings,
    exportData,
    importData,
    resetData,
    loadSampleData,
    addToast,
    openReceiptInWindows,
    supabaseStatus,
    connectSupabase,
    disconnectSupabase,
    syncLocalToSupabase,
  } = useFinance()

  const initialConfig = getStoredSupabaseConfig()
  const [supabaseUrl, setSupabaseUrl] = useState(initialConfig?.url || '')
  const [supabaseKey, setSupabaseKey] = useState(initialConfig?.anonKey || '')
  const [showKey, setShowKey] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [showSqlViewer, setShowSqlViewer] = useState(false)
  const [copiedSql, setCopiedSql] = useState(false)

  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace')
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false)
  const [isSampleConfirmOpen, setIsSampleConfirmOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // 1. Export Data handler
  const handleExport = () => {
    const backup = exportData()
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(backup, null, 2)
    )}`

    const now = new Date().toISOString().split('T')[0]
    const filename = `finance_backup_${now}.json`

    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', jsonString)
    downloadAnchor.setAttribute('download', filename)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()

    addToast({
      type: 'success',
      title: 'Backup Downloaded',
      message: `Saved ${filename} with ${backup.transactions.length} transactions.`,
    })
  }

  // 2. Parse & Validate JSON
  const processJsonFile = (file: File) => {
    if (!file.name.endsWith('.json')) {
      addToast({
        type: 'error',
        title: 'Invalid File Type',
        message: 'Please upload a .json file.',
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const parsed = JSON.parse(text)
        const success = importData(parsed, importMode)
        if (success && fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } catch (err: any) {
        addToast({
          type: 'error',
          title: 'JSON Parsing Error',
          message: err.message || 'Could not parse the backup file.',
        })
      }
    }
    reader.readAsText(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processJsonFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processJsonFile(file)
  }

  // Supabase Connect Action
  const handleConnectSupabase = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      addToast({
        type: 'error',
        title: 'Missing Credentials',
        message: 'Please provide both your Supabase Project URL and Anon Public Key.',
      })
      return
    }

    setIsTesting(true)
    const result = await connectSupabase(supabaseUrl.trim(), supabaseKey.trim())
    setIsTesting(false)

    if (result.success) {
      addToast({
        type: 'success',
        title: 'Supabase Connected!',
        message: 'Real-time multi-user synchronization is active. All edits are shared with your partner.',
      })
    } else {
      addToast({
        type: 'error',
        title: 'Connection Issue',
        message: result.error || 'Failed to connect to Supabase. Check your URL and Key.',
      })
    }
  }

  // Supabase Disconnect Action
  const handleDisconnect = () => {
    disconnectSupabase()
    setSupabaseUrl('')
    setSupabaseKey('')
    addToast({
      type: 'info',
      title: 'Switched to Local Mode',
      message: 'Supabase credentials cleared. Your app is now working in local browser storage.',
    })
  }

  // Push local entries to Supabase
  const handleSyncToCloud = async () => {
    if (supabaseStatus !== 'connected') {
      addToast({
        type: 'error',
        title: 'Database Not Connected',
        message: 'Please connect to Supabase before pushing local entries.',
      })
      return
    }

    setIsSyncing(true)
    try {
      await syncLocalToSupabase()
      addToast({
        type: 'success',
        title: 'Synced to Supabase',
        message: 'All local transactions, subscriptions, and settings are now in the online database.',
      })
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Sync Failed',
        message: err.message || 'Could not push records to cloud.',
      })
    } finally {
      setIsSyncing(false)
    }
  }

  // Copy Schema SQL
  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL)
      setCopiedSql(true)
      setTimeout(() => setCopiedSql(false), 2500)
      addToast({
        type: 'success',
        title: 'SQL Script Copied!',
        message: 'Paste it into your Supabase SQL Editor and click "Run" to initialize all tables.',
      })
    } catch {
      addToast({
        type: 'error',
        title: 'Clipboard Error',
        message: 'Could not copy automatically. Click "View SQL Schema Script" below to copy manually.',
      })
    }
  }

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          Data Management & Preferences
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Real-time collaborative database, local storage state persistence, and business bookkeeping preferences
        </p>
      </div>

      {/* Online Collaboration & Shared Supabase Database */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-6 relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        {/* Section Header with Status Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Shared Online Database & Collaboration
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                  Supabase
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Connect your shared PostgreSQL database so you and your business partner can record and see changes live
              </p>
            </div>
          </div>

          {/* Connection Pill */}
          <div className="shrink-0">
            {supabaseStatus === 'connected' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-xs">
                <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-500" />
                Live Sync Connected
              </span>
            )}
            {supabaseStatus === 'connecting' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
                Connecting...
              </span>
            )}
            {supabaseStatus === 'offline' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                <WifiOff className="w-3.5 h-3.5 text-rose-500" />
                Database Offline
              </span>
            )}
            {supabaseStatus === 'unconfigured' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                <Database className="w-3.5 h-3.5 text-slate-400" />
                Local Storage Mode
              </span>
            )}
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleConnectSupabase} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Supabase URL */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Supabase Project URL
              </label>
              <div className="relative">
                <input
                  type="url"
                  placeholder="https://your-project.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-mono text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
            </div>

            {/* Supabase Anon Key */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Anon Public API Key
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  className="w-full px-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-mono text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                  tabIndex={-1}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="submit"
                disabled={isTesting}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-500/20 transition cursor-pointer"
              >
                {isTesting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  <>
                    <Wifi className="w-4 h-4" />
                    Connect & Test
                  </>
                )}
              </button>

              {supabaseStatus === 'connected' && (
                <button
                  type="button"
                  onClick={handleSyncToCloud}
                  disabled={isSyncing}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md shadow-indigo-500/20 transition cursor-pointer"
                  title="Upload all existing local records to the Supabase database"
                >
                  {isSyncing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Uploading Data...
                    </>
                  ) : (
                    <>
                      <Cloud className="w-4 h-4" />
                      Sync Local Data to Cloud
                    </>
                  )}
                </button>
              )}

              {supabaseStatus !== 'unconfigured' && (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm rounded-xl transition cursor-pointer"
                >
                  Disconnect
                </button>
              )}
            </div>

            {/* Quick Link to Supabase Dashboard */}
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Supabase Dashboard
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </form>

        {/* 3-Step Setup Instructions Card */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              🚀 How to set up Supabase for you and your partner (3 Minutes):
            </span>
            <button
              type="button"
              onClick={handleCopySql}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg shadow-xs transition cursor-pointer"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedSql ? 'Copied to Clipboard!' : 'Copy Setup SQL Script'}
            </button>
          </div>

          <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-decimal list-inside leading-relaxed">
            <li>
              Log into <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">supabase.com</a> (Free) and click <strong>"New Project"</strong>.
            </li>
            <li>
              Go to <strong>SQL Editor</strong> on the left sidebar, click <strong>"Copy Setup SQL Script"</strong> above, paste it in, and press <strong>"Run"</strong>. (This creates your tables, receipt storage bucket, and real-time live channel).
            </li>
            <li>
              Go to <strong>Project Settings → API</strong>. Copy your <strong>Project URL</strong> and <strong>anon public API key</strong>, paste them above, and click <strong>Connect & Test</strong>.
            </li>
            <li>
              Send your Supabase Project URL and anon key to your business partner so they can connect too, or share the hosted website link with them!
            </li>
          </ol>

          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowSqlViewer(!showSqlViewer)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition"
            >
              <Code className="w-3.5 h-3.5 text-indigo-500" />
              {showSqlViewer ? 'Hide Database Setup SQL' : 'View Complete Database Setup SQL'}
            </button>

            {showSqlViewer && (
              <div className="mt-3 relative">
                <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 text-[11px] font-mono overflow-x-auto max-h-72 border border-slate-800">
                  {SUPABASE_SCHEMA_SQL}
                </pre>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="absolute top-3 right-3 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold rounded-md border border-slate-700 flex items-center gap-1 transition cursor-pointer"
                >
                  {copiedSql ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedSql ? 'Copied' : 'Copy'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Persistence & Backup Section */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
            <FolderArchive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Portability & JSON Backup
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Export your data to switch devices or import an existing backup file safely
            </p>
          </div>
        </div>

        {/* Current Database Metrics Pill */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 block">Stored Transactions</span>
            <span className="text-base font-bold text-slate-900 dark:text-white">
              {transactions.length}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Subscriptions</span>
            <span className="text-base font-bold text-slate-900 dark:text-white">
              {subscriptions.length}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Upcoming Items</span>
            <span className="text-base font-bold text-slate-900 dark:text-white">
              {upcomingItems.length}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Storage Engine</span>
            <span
              className={`text-base font-bold flex items-center gap-1 ${
                supabaseStatus === 'connected'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : supabaseStatus === 'offline'
                  ? 'text-rose-500'
                  : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              {supabaseStatus === 'connected' ? (
                <>
                  <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-500" />
                  Supabase Cloud
                </>
              ) : supabaseStatus === 'offline' ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-rose-500" />
                  Offline Cache
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  localStorage
                </>
              )}
            </span>
          </div>
        </div>

        {/* Export CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Export Dated JSON Backup
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Generates an offline snapshot file with your logs, subscriptions, and settings.
            </p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-500/20 transition cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4" />
            Export JSON
          </button>
        </div>

        {/* Import Drag & Drop Zone */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Import Backup JSON
            </h4>

            {/* Merge vs Replace Mode */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Mode:</span>
              <button
                type="button"
                onClick={() => setImportMode('replace')}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                  importMode === 'replace'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Replace All
              </button>
              <button
                type="button"
                onClick={() => setImportMode('merge')}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                  importMode === 'merge'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Merge
              </button>
            </div>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-emerald-500 bg-emerald-500/5'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 mx-auto flex items-center justify-center mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Click to select or drag and drop your JSON backup here
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports official FinanceFlow backup JSON schema
            </p>
          </div>
        </div>
      </div>

      {/* Business Bookkeeping Settings */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Business & Bookkeeping Configuration
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Receipts and invoices are automatically filed in your filesystem by business, year, and month
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => openReceiptInWindows('c:\\Users\\user\\Desktop\\Finance\\receipts', true)}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition cursor-pointer"
          >
            <FolderOpen className="w-4 h-4 text-amber-500" />
            Open Receipts Folder
          </button>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Business Entity / Brand Name
          </label>
          <input
            type="text"
            placeholder="e.g., Liora Baby Store, Acme Holdings, Studio 7"
            value={settings.businessName || ''}
            onChange={(e) => updateSettings({ businessName: e.target.value })}
            className="w-full sm:w-96 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-mono">
          <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            📁 Automatic Directory Architecture:
          </span>
          Finance/receipts/{settings.businessName || 'Business'}/[YYYY]/[MM]/[Transaction_Name]_[Timestamp].png
        </div>
      </div>

      {/* Preferences Section */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-5">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Preferences
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Currency Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Active Currency
            </label>
            <select
              value={settings.currency}
              onChange={(e) => updateSettings({ currency: e.target.value as CurrencyCode })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
            >
              {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => (
                <option key={code} value={code} className="dark:bg-slate-900">
                  {CURRENCIES[code].name} ({CURRENCIES[code].symbol})
                </option>
              ))}
            </select>
          </div>

          {/* Theme Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Visual Appearance
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => updateSettings({ theme: 'light' })}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                  settings.theme === 'light'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Sun className="w-3.5 h-3.5" /> Light Mode
              </button>
              <button
                type="button"
                onClick={() => updateSettings({ theme: 'dark' })}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                  settings.theme === 'dark'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Moon className="w-3.5 h-3.5" /> Dark Mode
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dangerous Operations & Sample Dataset */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Data Reset & Quick Testing
        </h3>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Load Rich Sample Dataset
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Populates realistic multi-month business transactions, recurring subscriptions, and upcoming bills.
            </p>
          </div>
          <button
            onClick={() => setIsSampleConfirmOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm rounded-xl transition cursor-pointer shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
            Load Sample Data
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40">
          <div>
            <h4 className="text-sm font-bold text-rose-700 dark:text-rose-400">
              Clear All Stored Data
            </h4>
            <p className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-0.5">
              Permanently wipes all transactions, subscriptions, and scheduled items from your browser.
            </p>
          </div>
          <button
            onClick={() => setIsResetConfirmOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs sm:text-sm rounded-xl transition cursor-pointer shrink-0"
          >
            <Trash2 className="w-4 h-4" />
            Wipe Database
          </button>
        </div>
      </div>

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={resetData}
        title="Wipe Entire Database?"
        message="This action will delete all recorded transactions, recurring subscriptions, and upcoming items from your browser's local storage. This cannot be undone unless you have a JSON backup file."
        confirmText="Yes, Wipe All Data"
        isDestructive={true}
      />

      <ConfirmModal
        isOpen={isSampleConfirmOpen}
        onClose={() => setIsSampleConfirmOpen(false)}
        onConfirm={loadSampleData}
        title="Load Sample Dataset?"
        message="This will replace current entries with realistic demo data so you can test and explore charts, projections, and reports immediately."
        confirmText="Load Sample Data"
        isDestructive={false}
      />
    </div>
  )
}
