import React, { useEffect, useRef, useState } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  FileCheck,
  FileText,
  Hash,
  Loader2,
  Tag,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../data/categories'
import type { Transaction, TransactionType } from '../../types/finance'
import { useFinance } from '../../context/FinanceContext'
import { isSupabaseReady, uploadReceiptToCloud } from '../../lib/supabase'

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  initialData?: Transaction | null
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  initialData,
}) => {
  const { addTransaction, updateTransaction, currencySymbol, settings } = useFinance()

  const [type, setType] = useState<TransactionType>('expense')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [invoiceNo, setInvoiceNo] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Receipt upload state
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const [receiptPath, setReceiptPath] = useState<string | null>(null)
  const [receiptName, setReceiptName] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (initialData) {
      setType(initialData.type)
      setDescription(initialData.description)
      setAmount(initialData.amount.toString())
      setCategory(initialData.category)
      setDate(initialData.date)
      setInvoiceNo(initialData.invoiceNo || '')
      setNotes(initialData.notes || '')
      setReceiptPreview(initialData.receiptUrl || null)
      setReceiptPath(initialData.receiptPath || null)
      setReceiptName(initialData.receiptName || null)
      setSelectedFile(null)
    } else {
      setType('expense')
      setDescription('')
      setAmount('')
      setCategory(EXPENSE_CATEGORIES[0])
      setDate(new Date().toISOString().split('T')[0])
      setInvoiceNo('')
      setNotes('')
      setReceiptPreview(null)
      setReceiptPath(null)
      setReceiptName(null)
      setSelectedFile(null)
    }
    setErrors({})
    setIsUploading(false)
  }, [initialData, isOpen])

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType)
    if (newType === 'income') {
      if (!INCOME_CATEGORIES.includes(category as any)) {
        setCategory(INCOME_CATEGORIES[0])
      }
    } else {
      if (!EXPENSE_CATEGORIES.includes(category as any)) {
        setCategory(EXPENSE_CATEGORIES[0])
      }
    }
  }

  const handleFileSelect = (file: File) => {
    if (!file) return
    setSelectedFile(file)
    setReceiptName(file.name)

    const reader = new FileReader()
    reader.onload = (e) => {
      setReceiptPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveReceipt = () => {
    setSelectedFile(null)
    setReceiptPreview(null)
    setReceiptPath(null)
    setReceiptName(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  if (!isOpen) return null

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!description.trim()) {
      errs.description = 'Description is required'
    }
    const num = parseFloat(amount)
    if (isNaN(num) || num <= 0) {
      errs.amount = 'Please enter a valid amount greater than 0'
    }
    if (!category) {
      errs.category = 'Category is required'
    }
    if (!date) {
      errs.date = 'Date is required'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const parsedAmount = Math.round(parseFloat(amount) * 100) / 100
    setIsUploading(true)

    let finalReceiptUrl = receiptPreview || undefined
    let finalReceiptPath = receiptPath || undefined
    let finalReceiptName = receiptName || undefined

    // If user selected a new file, upload to Supabase Cloud Storage or fallback to local disk
    if (selectedFile && receiptPreview) {
      setIsUploading(true)

      // 1. Try Supabase Cloud Storage first so both partners have access from anywhere
      if (isSupabaseReady()) {
        try {
          const cloudResult = await uploadReceiptToCloud(
            selectedFile,
            settings.businessName,
            date,
            description
          )
          finalReceiptUrl = cloudResult.url
          finalReceiptPath = cloudResult.path
          finalReceiptName = cloudResult.fileName
        } catch (cloudErr) {
          console.warn('Supabase cloud receipt upload failed, falling back to local storage:', cloudErr)
        }
      }

      // 2. Fallback to local Vite server filesystem if not stored in cloud
      if (!finalReceiptUrl || finalReceiptUrl.startsWith('data:')) {
        try {
          const res = await fetch('/api/upload-receipt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              businessName: settings.businessName || 'My_Business',
              date,
              transactionName: description.trim() || 'transaction',
              base64Data: receiptPreview,
              originalFileName: selectedFile.name,
            }),
          })

          if (res.ok) {
            const uploadData = await res.json()
            if (uploadData.success) {
              finalReceiptUrl = uploadData.url
              finalReceiptPath = uploadData.filePath
              finalReceiptName = uploadData.fileName
            }
          }
        } catch (err) {
          console.warn('Local receipt upload API call failed; keeping preview data URL', err)
        }
      }
    }

    if (initialData) {
      updateTransaction({
        id: initialData.id,
        type,
        description: description.trim(),
        amount: parsedAmount,
        category,
        date,
        invoiceNo: invoiceNo.trim() || undefined,
        notes: notes.trim() || undefined,
        receiptUrl: finalReceiptUrl,
        receiptPath: finalReceiptPath,
        receiptName: finalReceiptName,
      })
    } else {
      addTransaction({
        type,
        description: description.trim(),
        amount: parsedAmount,
        category,
        date,
        invoiceNo: invoiceNo.trim() || undefined,
        notes: notes.trim() || undefined,
        receiptUrl: finalReceiptUrl,
        receiptPath: finalReceiptPath,
        receiptName: finalReceiptName,
      })
    }

    setIsUploading(false)
    onClose()
  }

  const categoriesList = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden transition-all max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {initialData ? 'Edit Bookkeeping Entry' : 'Record Business Transaction'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Add receipt images, invoices, and structured records for {settings.businessName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Income vs Expense Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-all cursor-pointer ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              Expense / Payment
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-all cursor-pointer ${
                type === 'income'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              Income / Revenue
            </button>
          </div>

          {/* Amount & Invoice/Ref Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Amount ({currencySymbol.trim()})
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-semibold text-slate-400 dark:text-slate-500 text-sm">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`w-full pl-12 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border rounded-xl font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 transition text-base ${
                    errors.amount
                      ? 'border-rose-500 focus:ring-rose-500/20'
                      : 'border-slate-200 dark:border-slate-700 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400'
                  }`}
                />
              </div>
              {errors.amount && <p className="text-xs text-rose-500 mt-1">{errors.amount}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Invoice / Voucher # <span className="lowercase text-slate-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Hash className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="e.g., INV-2026-042"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Description / Payee
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <FileText className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="e.g., Office Supplies, Client Web App Milestone, Server Hosting"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 transition ${
                  errors.description
                    ? 'border-rose-500 focus:ring-rose-500/20'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400'
                }`}
              />
            </div>
            {errors.description && (
              <p className="text-xs text-rose-500 mt-1">{errors.description}</p>
            )}
          </div>

          {/* Category & Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Category
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Tag className="w-4 h-4" />
                </span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition appearance-none cursor-pointer"
                >
                  {categoriesList.map((cat) => (
                    <option key={cat} value={cat} className="dark:bg-slate-900">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Transaction Date
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Calendar className="w-4 h-4" />
                </span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                />
              </div>
            </div>
          </div>

          {/* RECEIPT / BILL / IMAGE UPLOAD SECTION */}
          <div className="space-y-2 pt-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Receipt / Bill Image (Bookkeeping Attachment)
            </label>

            {receiptPreview ? (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  {receiptPreview.startsWith('data:application/pdf') || receiptName?.endsWith('.pdf') ? (
                    <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                      <FileCheck className="w-6 h-6" />
                    </div>
                  ) : (
                    <img
                      src={receiptPreview}
                      alt="Receipt preview"
                      className="w-12 h-12 rounded-xl object-cover border border-slate-300 dark:border-slate-600 shrink-0"
                    />
                  )}

                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {receiptName || 'Attached Receipt'}
                    </p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
                      ✓ Will save in: receipts/{settings.businessName || 'Business'}/{date.slice(0, 4)}/{date.slice(5, 7)}/
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition cursor-pointer"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveReceipt}
                    className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                    title="Remove attachment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDragOver(true)
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setIsDragOver(false)
                  const file = e.dataTransfer.files?.[0]
                  if (file) handleFileSelect(file)
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                  isDragOver
                    ? 'border-emerald-500 bg-emerald-500/5'
                    : 'border-slate-200 dark:border-slate-700/80 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/30'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileSelect(file)
                  }}
                  className="hidden"
                />
                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <UploadCloud className="w-4 h-4 text-emerald-500" />
                  <span>Attach Receipt Image / Invoice Bill (PNG, JPG, PDF)</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Auto-saved to: receipts &rarr; {settings.businessName || 'Business'} &rarr; {date.slice(0, 4)} &rarr; {date.slice(5, 7)}
                </p>
              </div>
            )}
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Bookkeeping Notes <span className="lowercase text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="e.g., Tax deductible, client reimbursed, payment confirmation #..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl shadow-lg transition-all cursor-pointer ${
                type === 'income'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/25'
                  : 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/25'
              }`}
            >
              {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
              {initialData ? 'Save Changes' : type === 'income' ? 'Record Income' : 'Record Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
