import React from 'react'
import { ArrowRightLeft, CheckCircle2, X } from 'lucide-react'
import type { UpcomingItem } from '../../types/finance'
import { useFinance } from '../../context/FinanceContext'

interface ConvertModalProps {
  isOpen: boolean
  onClose: () => void
  item: UpcomingItem | null
}

export const ConvertModal: React.FC<ConvertModalProps> = ({ isOpen, onClose, item }) => {
  const { markUpcomingCleared, formatCurrency } = useFinance()

  if (!isOpen || !item) return null

  const handleConvertAndClear = () => {
    markUpcomingCleared(item.id, true)
    onClose()
  }

  const handleClearOnly = () => {
    markUpcomingCleared(item.id, false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 transition-all">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Mark as Cleared</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Scheduled Item Settlement</p>
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 mb-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.title}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {item.category} • Due {item.dueDate}
              </p>
            </div>
            <span
              className={`text-sm font-bold ${
                item.type === 'income' ? 'text-emerald-500' : 'text-rose-500'
              }`}
            >
              {item.type === 'income' ? '+' : '-'}
              {formatCurrency(item.amount)}
            </span>
          </div>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
          Would you like to automatically convert and record this item into your permanent{' '}
          <strong className="text-slate-900 dark:text-white">Transactions log</strong>, or simply mark it
          cleared?
        </p>

        <div className="space-y-2.5">
          <button
            onClick={handleConvertAndClear}
            className="w-full py-3 px-4 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <ArrowRightLeft className="w-4 h-4" />
            Convert & Record to Transactions (Recommended)
          </button>

          <button
            onClick={handleClearOnly}
            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-sm rounded-xl transition-all cursor-pointer"
          >
            Mark Cleared Only (Do Not Record Transaction)
          </button>

          <button
            onClick={onClose}
            className="w-full py-2 px-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-medium transition cursor-pointer"
          >
            Keep Pending (Cancel)
          </button>
        </div>
      </div>
    </div>
  )
}
