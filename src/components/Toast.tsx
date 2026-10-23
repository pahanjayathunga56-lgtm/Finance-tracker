import React from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { useFinance } from '../context/FinanceContext'

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useFinance()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success'
        const isError = toast.type === 'error'
        const isWarning = toast.type === 'warning'

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-3 ${
              isSuccess
                ? 'bg-slate-900/95 text-emerald-300 border-emerald-500/30 dark:bg-slate-900/90 dark:border-emerald-500/40'
                : isError
                ? 'bg-slate-900/95 text-rose-300 border-rose-500/30 dark:bg-slate-900/90 dark:border-rose-500/40'
                : isWarning
                ? 'bg-slate-900/95 text-amber-300 border-amber-500/30 dark:bg-slate-900/90 dark:border-amber-500/40'
                : 'bg-slate-900/95 text-sky-300 border-sky-500/30 dark:bg-slate-900/90 dark:border-sky-500/40'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {isError && <AlertCircle className="w-5 h-5 text-rose-400" />}
              {isWarning && <AlertCircle className="w-5 h-5 text-amber-400" />}
              {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5 text-sky-400" />}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-white tracking-tight">{toast.title}</h4>
              {toast.message && (
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed break-words">{toast.message}</p>
              )}
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 text-slate-400 hover:text-white transition-colors p-1 -mr-1 -mt-1 rounded-lg"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
