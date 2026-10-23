import React, { useMemo, useState } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  CalendarClock,
  CheckCircle2,
  Edit2,
  Plus,
  Trash2,
} from 'lucide-react'
import { CATEGORY_COLORS } from '../../data/categories'
import type { UpcomingItem, UpcomingStatus } from '../../types/finance'
import { useFinance } from '../../context/FinanceContext'
import { ConfirmModal } from '../Modals/ConfirmModal'
import { ConvertModal } from '../Modals/ConvertModal'
import { UpcomingModal } from '../Modals/UpcomingModal'

interface UpcomingViewProps {
  onOpenConvertModalWithItem?: (item: UpcomingItem) => void
}

export const UpcomingView: React.FC<UpcomingViewProps> = () => {
  const { upcomingItems, deleteUpcomingItem, formatCurrency } = useFinance()

  const [statusFilter, setStatusFilter] = useState<'all' | UpcomingStatus>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<UpcomingItem | null>(null)
  const [convertTargetItem, setConvertTargetItem] = useState<UpcomingItem | null>(null)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  const handleEdit = (item: UpcomingItem) => {
    setEditingItem(item)
    setIsModalOpen(true)
  }

  const handleAddNew = () => {
    setEditingItem(null)
    setIsModalOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (deleteTargetId) {
      deleteUpcomingItem(deleteTargetId)
      setDeleteTargetId(null)
    }
  }

  const getDaysUntilDue = (dueDateStr: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = new Date(dueDateStr)
    due.setHours(0, 0, 0, 0)

    const diffTime = due.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const filteredItems = useMemo(() => {
    return upcomingItems
      .filter((i) => {
        if (statusFilter !== 'all' && i.status !== statusFilter) return false
        if (typeFilter !== 'all' && i.type !== typeFilter) return false
        return true
      })
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === 'pending' ? -1 : 1
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      })
  }, [upcomingItems, statusFilter, typeFilter])

  const pendingIncome = upcomingItems
    .filter((i) => i.status === 'pending' && i.type === 'income')
    .reduce((acc, i) => acc + i.amount, 0)

  const pendingBills = upcomingItems
    .filter((i) => i.status === 'pending' && i.type === 'expense')
    .reduce((acc, i) => acc + i.amount, 0)

  return (
    <div className="space-y-6">
      {/* Title & Add CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            Upcoming Bills & Income
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              {upcomingItems.filter((i) => i.status === 'pending').length} pending
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Forecast scheduled obligations and convert cleared items directly into recorded transactions
          </p>
        </div>

        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg shadow-cyan-500/20 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Schedule Item
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Pending Inflow */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Expected Inflow (Pending)
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight mt-2">
            +{formatCurrency(pendingIncome)}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Expected from client invoices & scheduled payroll
          </p>
        </div>

        {/* Pending Outflow */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Scheduled Outflow (Pending)
            </span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-rose-500 tracking-tight mt-2">
            -{formatCurrency(pendingBills)}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Scheduled utility bills, rents, and liabilities
          </p>
        </div>

        {/* Net Projected Delta */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-950/30 to-slate-900 border border-cyan-900/40 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              Upcoming Net Delta
            </span>
            <CalendarClock className="w-4 h-4 text-cyan-400" />
          </div>
          <h3
            className={`text-2xl font-black tracking-tight mt-2 ${
              pendingIncome - pendingBills >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {pendingIncome - pendingBills >= 0 ? '+' : ''}
            {formatCurrency(pendingIncome - pendingBills)}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Impact on current liquidity once all are cleared
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            All Items ({upcomingItems.length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Pending Only
          </button>
          <button
            onClick={() => setStatusFilter('cleared')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              statusFilter === 'cleared'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Cleared
          </button>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="income">Inflow Only</option>
            <option value="expense">Bills (Outflow) Only</option>
          </select>
        </div>
      </div>

      {/* Upcoming Items List */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="py-16 px-4 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
              <CalendarClock className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No items in this category
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Schedule future payments or invoices so you never miss a due date.
            </p>
            <button
              onClick={handleAddNew}
              className="mt-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-xl shadow-md transition cursor-pointer"
            >
              Schedule New Item
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
            {filteredItems.map((item) => {
              const isIncome = item.type === 'income'
              const isCleared = item.status === 'cleared'
              const daysLeft = getDaysUntilDue(item.dueDate)
              const categoryColor = CATEGORY_COLORS[item.category] || '#94a3b8'

              return (
                <div
                  key={item.id}
                  className={`p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition group ${
                    isCleared ? 'opacity-65' : ''
                  }`}
                >
                  {/* Left: Indicator, Title, Date */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isCleared
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                          : isIncome
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-500/10 text-rose-500'
                      }`}
                    >
                      {isCleared ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : isIncome ? (
                        <ArrowUpRight className="w-5 h-5" />
                      ) : (
                        <ArrowDownLeft className="w-5 h-5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4
                          className={`text-sm font-bold text-slate-900 dark:text-white truncate ${
                            isCleared ? 'line-through text-slate-400 dark:text-slate-500' : ''
                          }`}
                        >
                          {item.title}
                        </h4>
                        {isCleared && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                            Cleared {item.convertedTransactionId ? '• Recorded' : ''}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-medium text-slate-600 dark:text-slate-300 text-[11px]">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: categoryColor }}
                          />
                          {item.category}
                        </span>

                        <span className="text-slate-400 text-[11px] flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Due: {item.dueDate}
                        </span>

                        {!isCleared && (
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                              daysLeft < 0
                                ? 'bg-rose-500/15 text-rose-500 font-bold'
                                : daysLeft <= 2
                                ? 'bg-amber-500/15 text-amber-500 font-bold'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {daysLeft < 0
                              ? `${Math.abs(daysLeft)} days overdue`
                              : daysLeft === 0
                              ? 'Due Today'
                              : `In ${daysLeft} days`}
                          </span>
                        )}

                        {item.notes && (
                          <span className="hidden lg:inline text-slate-400 text-[11px] truncate max-w-xs italic">
                            "{item.notes}"
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount & Actions */}
                  <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                    <div className="text-right">
                      <p
                        className={`text-sm sm:text-base font-black tracking-tight ${
                          isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                        }`}
                      >
                        {isIncome ? '+' : '-'}
                        {formatCurrency(item.amount)}
                      </p>
                      <span className="text-[10px] uppercase font-semibold text-slate-400">
                        {isIncome ? 'Expected In' : 'Scheduled Bill'}
                      </span>
                    </div>

                    {!isCleared && (
                      <button
                        onClick={() => setConvertTargetItem(item)}
                        className="flex items-center gap-1.5 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer"
                        title="Mark Cleared & Convert to Transaction"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Clear</span>
                      </button>
                    )}

                    <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-1.5 text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 rounded-lg transition cursor-pointer"
                        title="Edit Item"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTargetId(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                        title="Delete Item"
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
      </div>

      {/* Modals */}
      <UpcomingModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingItem(null)
        }}
        initialData={editingItem}
      />

      <ConvertModal
        isOpen={convertTargetItem !== null}
        onClose={() => setConvertTargetItem(null)}
        item={convertTargetItem}
      />

      <ConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Scheduled Item"
        message="Are you sure you want to remove this upcoming item from projections?"
        confirmText="Delete"
        isDestructive={true}
      />
    </div>
  )
}
