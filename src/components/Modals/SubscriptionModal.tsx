import React, { useEffect, useState } from 'react'
import { Calendar, Repeat, Tag, X } from 'lucide-react'
import { EXPENSE_CATEGORIES } from '../../data/categories'
import type { BillingCycle, Subscription } from '../../types/finance'
import { useFinance } from '../../context/FinanceContext'

interface SubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  initialData?: Subscription | null
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  initialData,
}) => {
  const { addSubscription, updateSubscription, currencySymbol } = useFinance()

  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly')
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[6] || 'Tech & Subscriptions')
  const [renewalDate, setRenewalDate] = useState(new Date().toISOString().split('T')[0])
  const [active, setActive] = useState(true)
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (initialData) {
      setName(initialData.name)
      setAmount(initialData.amount.toString())
      setBillingCycle(initialData.billingCycle)
      setCategory(initialData.category)
      setRenewalDate(initialData.renewalDate)
      setActive(initialData.active)
      setNotes(initialData.notes || '')
    } else {
      setName('')
      setAmount('')
      setBillingCycle('monthly')
      setCategory(EXPENSE_CATEGORIES[6] || 'Tech & Subscriptions')
      setRenewalDate(new Date().toISOString().split('T')[0])
      setActive(true)
      setNotes('')
    }
    setErrors({})
  }, [initialData, isOpen])

  if (!isOpen) return null

  // Calculate live normalized values
  const parsedAmt = parseFloat(amount) || 0
  let monthlyEquivalent = 0
  let annualEquivalent = 0

  if (billingCycle === 'monthly') {
    monthlyEquivalent = parsedAmt
    annualEquivalent = parsedAmt * 12
  } else if (billingCycle === 'yearly') {
    monthlyEquivalent = parsedAmt / 12
    annualEquivalent = parsedAmt
  } else if (billingCycle === 'weekly') {
    monthlyEquivalent = (parsedAmt * 52) / 12
    annualEquivalent = parsedAmt * 52
  }

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = 'Subscription name is required'
    if (isNaN(parsedAmt) || parsedAmt <= 0) errs.amount = 'Enter a valid amount greater than 0'
    if (!renewalDate) errs.renewalDate = 'Renewal date is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const cleanAmount = Math.round(parsedAmt * 100) / 100

    if (initialData) {
      updateSubscription({
        id: initialData.id,
        name: name.trim(),
        amount: cleanAmount,
        billingCycle,
        category,
        renewalDate,
        active,
        notes: notes.trim() || undefined,
      })
    } else {
      addSubscription({
        name: name.trim(),
        amount: cleanAmount,
        billingCycle,
        category,
        renewalDate,
        active,
        notes: notes.trim() || undefined,
      })
    }

    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-all">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800/80">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {initialData ? 'Edit Recurring Subscription' : 'Add Recurring Subscription'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Track renewals, cycles, and annualized expenditure
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
          {/* Subscription Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Service / Provider Name
            </label>
            <input
              type="text"
              placeholder="e.g., Netflix, Spotify, Amazon Prime, AWS"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 transition ${
                errors.name
                  ? 'border-rose-500 focus:ring-rose-500/20'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500/20 focus:border-indigo-500'
              }`}
            />
            {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
          </div>

          {/* Amount & Billing Cycle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Amount
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
                      : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500/20 focus:border-indigo-500'
                  }`}
                />
              </div>
              {errors.amount && <p className="text-xs text-rose-500 mt-1">{errors.amount}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Billing Cycle
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Repeat className="w-4 h-4" />
                </span>
                <select
                  value={billingCycle}
                  onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition appearance-none cursor-pointer"
                >
                  <option value="monthly" className="dark:bg-slate-900">
                    Monthly
                  </option>
                  <option value="yearly" className="dark:bg-slate-900">
                    Yearly (Annual)
                  </option>
                  <option value="weekly" className="dark:bg-slate-900">
                    Weekly
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* Live Cost Calculation Card */}
          {parsedAmt > 0 && (
            <div className="p-3.5 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-xl flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold block">
                  Normalized Monthly Cost:
                </span>
                <span className="text-slate-800 dark:text-white font-bold text-sm">
                  {currencySymbol}
                  {monthlyEquivalent.toFixed(2)}/mo
                </span>
              </div>
              <div className="space-y-0.5 text-right">
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold block">
                  Annualized Cost:
                </span>
                <span className="text-slate-800 dark:text-white font-bold text-sm">
                  {currencySymbol}
                  {annualEquivalent.toFixed(2)}/yr
                </span>
              </div>
            </div>
          )}

          {/* Category & Next Renewal Date */}
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
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition appearance-none cursor-pointer"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="dark:bg-slate-900">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Next Renewal Date
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Calendar className="w-4 h-4" />
                </span>
                <input
                  type="date"
                  value={renewalDate}
                  onChange={(e) => setRenewalDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Active Status Checkbox */}
          <div className="flex items-center gap-3 pt-1">
            <input
              type="checkbox"
              id="activeSubscription"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 cursor-pointer"
            />
            <label
              htmlFor="activeSubscription"
              className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none"
            >
              Active Subscription (counts toward monthly recurring expenses)
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Notes <span className="lowercase text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="e.g., Shared with family, annual discount code applied"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition resize-none"
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
              className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/25 transition-all"
            >
              {initialData ? 'Save Changes' : 'Add Subscription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
