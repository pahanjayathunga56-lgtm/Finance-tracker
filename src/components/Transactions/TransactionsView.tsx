import React, { useMemo, useState } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Edit2,
  Paperclip,
  Plus,
  Receipt,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { ALL_CATEGORIES, CATEGORY_COLORS } from '../../data/categories'
import type { Transaction, TransactionType } from '../../types/finance'
import { useFinance } from '../../context/FinanceContext'
import { ConfirmModal } from '../Modals/ConfirmModal'
import { ReceiptViewerModal } from '../Modals/ReceiptViewerModal'
import { TransactionModal } from '../Modals/TransactionModal'

export const TransactionsView: React.FC = () => {
  const { transactions, deleteTransaction, formatCurrency } = useFinance()

  // Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [sortOrder, setSortOrder] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>(
    'date-desc'
  )

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<Transaction | null>(null)

  // Filtered & Sorted Transactions
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        // Type filter
        if (typeFilter !== 'all' && t.type !== typeFilter) return false
        // Category filter
        if (categoryFilter !== 'all' && t.category !== categoryFilter) return false
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase()
          const descMatch = t.description.toLowerCase().includes(q)
          const notesMatch = t.notes?.toLowerCase().includes(q) || false
          const catMatch = t.category.toLowerCase().includes(q)
          const amountMatch = t.amount.toString().includes(q)
          if (!descMatch && !notesMatch && !catMatch && !amountMatch) return false
        }
        return true
      })
      .sort((a, b) => {
        if (sortOrder === 'date-desc') {
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        }
        if (sortOrder === 'date-asc') {
          return new Date(a.date).getTime() - new Date(b.date).getTime()
        }
        if (sortOrder === 'amount-desc') {
          return b.amount - a.amount
        }
        if (sortOrder === 'amount-asc') {
          return a.amount - b.amount
        }
        return 0
      })
  }, [transactions, typeFilter, categoryFilter, searchQuery, sortOrder])

  // Filtered totals
  const filteredSummary = useMemo(() => {
    let income = 0
    let expense = 0
    filteredTransactions.forEach((t) => {
      if (t.type === 'income') income += t.amount
      else expense += t.amount
    })
    return {
      income,
      expense,
      net: income - expense,
      count: filteredTransactions.length,
    }
  }, [filteredTransactions])

  const handleEdit = (tx: Transaction) => {
    setEditingTransaction(tx)
    setIsModalOpen(true)
  }

  const handleAddNew = () => {
    setEditingTransaction(null)
    setIsModalOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (deleteTargetId) {
      deleteTransaction(deleteTargetId)
      setDeleteTargetId(null)
    }
  }

  const hasActiveFilters = searchQuery !== '' || typeFilter !== 'all' || categoryFilter !== 'all'

  const resetFilters = () => {
    setSearchQuery('')
    setTypeFilter('all')
    setCategoryFilter('all')
  }

  return (
    <div className="space-y-6">
      {/* Header with Title and Add CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            Transactions
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {transactions.length} total
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Comprehensive audit log of all income deposits and expenditures
          </p>
        </div>

        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Transaction
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search description, note, amount..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Type Filter */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer appearance-none"
            >
              <option value="all" className="dark:bg-slate-900">
                All Types (Income & Expense)
              </option>
              <option value="income" className="dark:bg-slate-900">
                Inflow Only (Income)
              </option>
              <option value="expense" className="dark:bg-slate-900">
                Outflow Only (Expense)
              </option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer appearance-none"
            >
              <option value="all" className="dark:bg-slate-900">
                All Categories
              </option>
              {ALL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="dark:bg-slate-900">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Order */}
          <div className="relative">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer appearance-none"
            >
              <option value="date-desc" className="dark:bg-slate-900">
                Date: Newest First
              </option>
              <option value="date-asc" className="dark:bg-slate-900">
                Date: Oldest First
              </option>
              <option value="amount-desc" className="dark:bg-slate-900">
                Amount: High to Low
              </option>
              <option value="amount-asc" className="dark:bg-slate-900">
                Amount: Low to High
              </option>
            </select>
          </div>
        </div>

        {/* Filter Summary & Active Filter Reset */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs border-t border-slate-100 dark:border-slate-800/60 text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-4">
            <span>
              Showing <strong className="text-slate-900 dark:text-white">{filteredSummary.count}</strong>{' '}
              transactions
            </span>
            <span>
              Total In:{' '}
              <strong className="text-emerald-600 dark:text-emerald-400">
                {formatCurrency(filteredSummary.income)}
              </strong>
            </span>
            <span>
              Total Out:{' '}
              <strong className="text-rose-500">
                {formatCurrency(filteredSummary.expense)}
              </strong>
            </span>
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Transactions List / Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="py-16 px-4 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
              <Receipt className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No transactions match your filter
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Try adjusting your search criteria or add a new transaction to begin recording.
            </p>
            {hasActiveFilters ? (
              <button
                onClick={resetFilters}
                className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                Clear all filters
              </button>
            ) : (
              <button
                onClick={handleAddNew}
                className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-md transition cursor-pointer"
              >
                Create First Transaction
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
            {filteredTransactions.map((tx) => {
              const isIncome = tx.type === 'income'
              const categoryColor = CATEGORY_COLORS[tx.category] || '#94a3b8'

              return (
                <div
                  key={tx.id}
                  className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition group"
                >
                  {/* Left: Icon & Details */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isIncome
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-500/10 text-rose-500'
                      }`}
                    >
                      {isIncome ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {tx.description}
                        </h4>
                        {tx.invoiceNo && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono shrink-0">
                            #{tx.invoiceNo}
                          </span>
                        )}
                        {tx.receiptUrl && (
                          <button
                            onClick={() => setSelectedReceiptTx(tx)}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] transition cursor-pointer shrink-0"
                            title="Click to open attached receipt"
                          >
                            <Paperclip className="w-3 h-3" />
                            Receipt
                          </button>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-medium text-slate-600 dark:text-slate-300 text-[11px]">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: categoryColor }}
                          />
                          {tx.category}
                        </span>

                        <span className="text-slate-400 text-[11px] flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {tx.date}
                        </span>

                        {tx.notes && (
                          <span className="hidden md:inline text-slate-400 text-[11px] truncate max-w-xs italic">
                            "{tx.notes}"
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount & Action Buttons */}
                  <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                    <div className="text-right">
                      <p
                        className={`text-sm sm:text-base font-black tracking-tight ${
                          isIncome
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {isIncome ? '+' : '-'}
                        {formatCurrency(tx.amount)}
                      </p>
                      <span className="text-[10px] uppercase font-semibold text-slate-400">
                        {isIncome ? 'Deposit' : 'Withdrawal'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition">
                      {tx.receiptUrl && (
                        <button
                          onClick={() => setSelectedReceiptTx(tx)}
                          className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition cursor-pointer"
                          title="Open Receipt"
                        >
                          <Paperclip className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(tx)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                        title="Edit Transaction"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTargetId(tx.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                        title="Delete Transaction"
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
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingTransaction(null)
        }}
        initialData={editingTransaction}
      />

      <ReceiptViewerModal
        isOpen={selectedReceiptTx !== null}
        onClose={() => setSelectedReceiptTx(null)}
        transaction={selectedReceiptTx}
      />

      <ConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Transaction"
        message="Are you sure you want to remove this transaction? This will permanently update your net cash flow."
        confirmText="Delete"
        isDestructive={true}
      />
    </div>
  )
}
