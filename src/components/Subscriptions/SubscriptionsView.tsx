import React, { useMemo, useState } from 'react'
import {
  Calendar,
  Clock,
  Edit2,
  Plus,
  Repeat,
  Trash2,
} from 'lucide-react'
import { CATEGORY_COLORS } from '../../data/categories'
import type { Subscription } from '../../types/finance'
import { useFinance } from '../../context/FinanceContext'
import { ConfirmModal } from '../Modals/ConfirmModal'
import { SubscriptionModal } from '../Modals/SubscriptionModal'

export const SubscriptionsView: React.FC = () => {
  const {
    subscriptions,
    deleteSubscription,
    toggleSubscriptionActive,
    metrics,
    formatCurrency,
  } = useFinance()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSub, setEditingSub] = useState<Subscription | null>(null)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  const handleEdit = (sub: Subscription) => {
    setEditingSub(sub)
    setIsModalOpen(true)
  }

  const handleAddNew = () => {
    setEditingSub(null)
    setIsModalOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (deleteTargetId) {
      deleteSubscription(deleteTargetId)
      setDeleteTargetId(null)
    }
  }

  // Renewal helper: calculate days until renewal
  const getDaysUntilRenewal = (renewalDateStr: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const renewal = new Date(renewalDateStr)
    renewal.setHours(0, 0, 0, 0)

    const diffTime = renewal.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Sorted list: active first, then closest renewal
  const sortedSubscriptions = useMemo(() => {
    return [...subscriptions].sort((a, b) => {
      if (a.active !== b.active) return a.active ? -1 : 1
      return new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime()
    })
  }, [subscriptions])

  return (
    <div className="space-y-6">
      {/* Title & Add CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            Recurring & Subscriptions
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              {metrics.activeSubscriptionCount} active
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor SaaS memberships, streaming services, and annualized commitments
          </p>
        </div>

        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-500/20 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Subscription
        </button>
      </div>

      {/* Auto-Calculated Cost Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Monthly Cost */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-900/30 to-slate-900 border border-indigo-800/40 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            Total Monthly Cost
          </span>
          <h3 className="text-3xl font-black text-white tracking-tight mt-2">
            {formatCurrency(metrics.monthlySubscriptionCost)}
            <span className="text-xs text-slate-400 font-normal">/month</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Normalized across monthly, weekly, and yearly plans
          </p>
        </div>

        {/* Annualized Cost */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Annualized Commitment
          </span>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-2">
            {formatCurrency(metrics.annualSubscriptionCost)}
            <span className="text-xs text-slate-400 font-normal">/year</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Projected 12-month recurring expenditure
          </p>
        </div>

        {/* Active vs Paused */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Subscription Status
          </span>
          <div className="flex items-center gap-6 mt-2">
            <div>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {metrics.activeSubscriptionCount}
              </span>
              <p className="text-xs text-slate-400">Active</p>
            </div>
            <div>
              <span className="text-2xl font-black text-slate-400">
                {subscriptions.length - metrics.activeSubscriptionCount}
              </span>
              <p className="text-xs text-slate-400">Paused</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Toggle switches to instantly include or exclude from cash calculations
          </p>
        </div>
      </div>

      {/* Subscriptions Grid */}
      {sortedSubscriptions.length === 0 ? (
        <div className="py-16 px-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
            <Repeat className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No subscriptions tracked yet
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Add recurring business subscriptions like Shopify, Meta Ads, accounting software, or server hosting to keep fixed overhead under control.
          </p>
          <button
            onClick={handleAddNew}
            className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md transition cursor-pointer"
          >
            Track First Subscription
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedSubscriptions.map((sub) => {
            const daysLeft = getDaysUntilRenewal(sub.renewalDate)
            const categoryColor = CATEGORY_COLORS[sub.category] || '#6366f1'

            // Normalized monthly
            let monthlyAmt = sub.amount
            if (sub.billingCycle === 'yearly') monthlyAmt = sub.amount / 12
            if (sub.billingCycle === 'weekly') monthlyAmt = (sub.amount * 52) / 12

            return (
              <div
                key={sub.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  sub.active
                    ? 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-indigo-500/40'
                    : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/40 opacity-60'
                }`}
              >
                <div>
                  {/* Top: Name, Category, Active Toggle */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <h4 className="text-base font-bold text-slate-900 dark:text-white truncate">
                        {sub.name}
                      </h4>
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-medium text-slate-600 dark:text-slate-300 text-[11px] mt-1">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: categoryColor }}
                        />
                        {sub.category}
                      </span>
                    </div>

                    {/* Active toggle button */}
                    <button
                      onClick={() => toggleSubscriptionActive(sub.id)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        sub.active ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                      title={sub.active ? 'Click to Pause' : 'Click to Activate'}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          sub.active ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Pricing info */}
                  <div className="mt-4 pb-4 border-b border-slate-100 dark:border-slate-800/80 flex items-baseline justify-between">
                    <div>
                      <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        {formatCurrency(sub.amount)}
                      </span>
                      <span className="text-xs text-slate-400 ml-1 font-semibold uppercase">
                        /{sub.billingCycle}
                      </span>
                    </div>

                    {sub.billingCycle !== 'monthly' && (
                      <span className="text-xs text-indigo-500 font-semibold">
                        ~{formatCurrency(monthlyAmt)}/mo
                      </span>
                    )}
                  </div>

                  {/* Renewal timing */}
                  <div className="py-3 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        Next Renewal:
                      </span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {sub.renewalDate}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        Timing:
                      </span>
                      <span
                        className={`font-semibold px-2 py-0.5 rounded-full text-[11px] ${
                          daysLeft < 0
                            ? 'bg-rose-500/15 text-rose-500'
                            : daysLeft <= 3
                            ? 'bg-amber-500/15 text-amber-500 font-bold'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {daysLeft < 0
                          ? `${Math.abs(daysLeft)} days overdue`
                          : daysLeft === 0
                          ? 'Renews Today'
                          : `In ${daysLeft} days`}
                      </span>
                    </div>

                    {sub.notes && (
                      <p className="text-[11px] text-slate-400 italic pt-1 truncate">
                        "{sub.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-400">
                    {sub.active ? '● Active in billing' : '○ Paused'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(sub)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition cursor-pointer"
                      title="Edit Subscription"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTargetId(sub.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                      title="Delete Subscription"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modals */}
      <SubscriptionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingSub(null)
        }}
        initialData={editingSub}
      />

      <ConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Subscription"
        message="Are you sure you want to remove this recurring subscription? It will no longer factor into your monthly commitments."
        confirmText="Delete"
        isDestructive={true}
      />
    </div>
  )
}
