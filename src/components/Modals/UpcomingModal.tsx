import React, { useEffect, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Calendar, FileText, Tag, X } from 'lucide-react'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../data/categories'
import type { TransactionType, UpcomingItem, UpcomingStatus } from '../../types/finance'
import { useFinance } from '../../context/FinanceContext'

interface UpcomingModalProps {
  isOpen: boolean
  onClose: () => void
  initialData?: UpcomingItem | null
}

export const UpcomingModal: React.FC<UpcomingModalProps> = ({ isOpen, onClose, initialData }) => {
  const { addUpcomingItem, updateUpcomingItem, currencySymbol } = useFinance()

  const [type, setType] = useState<TransactionType>('expense')
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0])
  const [status, setStatus] = useState<UpcomingStatus>('pending')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (initialData) {
      setType(initialData.type)
      setTitle(initialData.title)
      setAmount(initialData.amount.toString())
      setCategory(initialData.category)
      setDueDate(initialData.dueDate)
      setStatus(initialData.status)
      setNotes(initialData.notes || '')
    } else {
      setType('expense')
      setTitle('')
      setAmount('')
      setCategory(EXPENSE_CATEGORIES[3] || 'Utilities & Bills')
      setDueDate(new Date().toISOString().split('T')[0])
      setStatus('pending')
      setNotes('')
    }
    setErrors({})
  }, [initialData, isOpen])

  if (!isOpen) return null

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

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!title.trim()) errs.title = 'Title / Payee / Source is required'
    const num = parseFloat(amount)
    if (isNaN(num) || num <= 0) errs.amount = 'Enter a valid amount greater than 0'
    if (!dueDate) errs.dueDate = 'Due / Expected date is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const parsedAmount = Math.round(parseFloat(amount) * 100) / 100

    if (initialData) {
      updateUpcomingItem({
        id: initialData.id,
        title: title.trim(),
        amount: parsedAmount,
        type,
        category,
        dueDate,
        status,
        notes: notes.trim() || undefined,
        convertedTransactionId: initialData.convertedTransactionId,
      })
    } else {
      addUpcomingItem({
        title: title.trim(),
        amount: parsedAmount,
        type,
        category,
        dueDate,
        status,
        notes: notes.trim() || undefined,
      })
    }

    onClose()
  }

  const categoriesList = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-all">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800/80">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {initialData ? 'Edit Scheduled Item' : 'Schedule Projected Item'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Anticipate upcoming bills, scheduled payouts, or customer invoices
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Income vs Expense Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              Upcoming Bill (Expense)
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
                type === 'income'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              Expected Payout (Income)
            </button>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Title / Source
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <FileText className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="e.g., Electric Bill, Freelance Retainer Invoice"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 transition ${
                  errors.title
                    ? 'border-rose-500 focus:ring-rose-500/20'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-cyan-500/20 focus:border-cyan-500'
                }`}
              />
            </div>
            {errors.title && <p className="text-xs text-rose-500 mt-1">{errors.title}</p>}
          </div>

          {/* Amount & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Expected Amount
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-semibold text-slate-400">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border rounded-xl font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 transition ${
                    errors.amount
                      ? 'border-rose-500 focus:ring-rose-500/20'
                      : 'border-slate-200 dark:border-slate-700 focus:ring-cyan-500/20 focus:border-cyan-500'
                  }`}
                />
              </div>
              {errors.amount && <p className="text-xs text-rose-500 mt-1">{errors.amount}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Expected Date
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Calendar className="w-4 h-4" />
                </span>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Category & Status */}
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
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition appearance-none cursor-pointer"
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
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as UpcomingStatus)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition appearance-none cursor-pointer"
              >
                <option value="pending" className="dark:bg-slate-900">
                  Pending (Projected)
                </option>
                <option value="cleared" className="dark:bg-slate-900">
                  Cleared (Settled)
                </option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Notes <span className="lowercase text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="e.g., Automatic deduction from account *4812"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl shadow-lg shadow-cyan-500/25 transition-all"
            >
              {initialData ? 'Save Changes' : 'Schedule Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
