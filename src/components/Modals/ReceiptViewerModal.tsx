import React, { useState } from 'react'
import {
  Check,
  Download,
  ExternalLink,
  FileText,
  FolderOpen,
  Loader2,
  Receipt,
  X,
} from 'lucide-react'
import type { Transaction } from '../../types/finance'
import { useFinance } from '../../context/FinanceContext'
import { normalizeBusinessCategory } from '../../data/categories'

interface ReceiptViewerModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: Transaction | null
}

export const ReceiptViewerModal: React.FC<ReceiptViewerModalProps> = ({
  isOpen,
  onClose,
  transaction,
}) => {
  const { formatCurrency, openReceiptInWindows, addToast } = useFinance()
  const [openingWindows, setOpeningWindows] = useState(false)
  const [openingFolder, setOpeningFolder] = useState(false)
  const [justLaunched, setJustLaunched] = useState(false)
  const [justOpenedFolder, setJustOpenedFolder] = useState(false)

  if (!isOpen || !transaction || !transaction.receiptUrl) return null

  const isPdf =
    transaction.receiptUrl.toLowerCase().endsWith('.pdf') ||
    transaction.receiptName?.toLowerCase().endsWith('.pdf') ||
    transaction.receiptUrl.startsWith('data:application/pdf')

  const displayCategory = normalizeBusinessCategory(
    transaction.category,
    transaction.type,
    transaction.description
  )

  const handleOpenInWindows = async () => {
    if (transaction.receiptPath) {
      setOpeningWindows(true)
      try {
        await openReceiptInWindows(transaction.receiptPath, false)
        setJustLaunched(true)
        setTimeout(() => setJustLaunched(false), 3000)
        addToast({
          type: 'success',
          title: 'Opening in Windows',
          message: 'Launched with your default Windows application.',
        })
      } catch (err: any) {
        addToast({
          type: 'warning',
          title: 'Could not open in Windows',
          message: err.message || 'Opening in browser tab instead.',
        })
        window.open(transaction.receiptUrl, '_blank')
      } finally {
        setOpeningWindows(false)
      }
    } else {
      window.open(transaction.receiptUrl, '_blank')
    }
  }

  const handleShowInFolder = async () => {
    if (transaction.receiptPath) {
      setOpeningFolder(true)
      try {
        await openReceiptInWindows(transaction.receiptPath, true)
        setJustOpenedFolder(true)
        setTimeout(() => setJustOpenedFolder(false), 3000)
        addToast({
          type: 'success',
          title: 'Windows File Explorer',
          message: 'Highlighted file in receipts folder.',
        })
      } catch (err: any) {
        addToast({
          type: 'warning',
          title: 'Explorer notice',
          message: err.message || 'File location could not be opened.',
        })
      } finally {
        setOpeningFolder(false)
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {transaction.description}
                {transaction.invoiceNo && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
                    #{transaction.invoiceNo}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {transaction.date} • <span className="font-medium text-slate-700 dark:text-slate-300">{displayCategory}</span> •{' '}
                <span
                  className={`font-bold ${
                    transaction.type === 'income' ? 'text-emerald-500' : 'text-rose-500'
                  }`}
                >
                  {transaction.type === 'income' ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* In-Modal Quick Action Banner */}
        <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <FileText className="w-4 h-4 text-emerald-500" />
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {transaction.receiptName || 'Receipt Attachment'}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700 font-mono uppercase">
              {isPdf ? 'PDF Invoice' : 'Image'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={transaction.receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 font-semibold transition cursor-pointer border border-indigo-200/50 dark:border-indigo-800/50"
              title="Open full size in browser tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Full Browser View
            </a>
          </div>
        </div>

        {/* Content Body: Live PDF or Image Viewer */}
        <div className="flex-1 p-4 overflow-y-auto flex items-center justify-center bg-slate-100/60 dark:bg-slate-950/80 min-h-[380px]">
          {isPdf ? (
            <div className="w-full h-[58vh] flex flex-col rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md bg-white">
              <iframe
                src={transaction.receiptUrl}
                title={`PDF Receipt for ${transaction.description}`}
                className="w-full h-full border-none"
              />
            </div>
          ) : (
            <div className="relative group max-h-[60vh] flex items-center justify-center p-2">
              <img
                src={transaction.receiptUrl}
                alt={`Receipt for ${transaction.description}`}
                className="max-h-[58vh] max-w-full rounded-2xl object-contain shadow-xl border border-slate-200/60 dark:border-slate-800"
              />
            </div>
          )}
        </div>

        {/* Path Info Footer */}
        {transaction.receiptPath && (
          <div className="px-6 py-2 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between gap-2 overflow-hidden">
            <span className="truncate">
              <strong className="text-slate-600 dark:text-slate-300">Storage Location:</strong> {transaction.receiptPath}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            {/* Open in Windows App */}
            {transaction.receiptPath && (
              <>
                <button
                  type="button"
                  onClick={handleOpenInWindows}
                  disabled={openingWindows}
                  className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition cursor-pointer disabled:opacity-50"
                  title="Open file using default Windows Photo or PDF app"
                >
                  {openingWindows ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                  ) : justLaunched ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-500" />
                  )}
                  {justLaunched ? 'Opened in Windows!' : 'Open in Windows'}
                </button>

                <button
                  type="button"
                  onClick={handleShowInFolder}
                  disabled={openingFolder}
                  className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition cursor-pointer disabled:opacity-50"
                  title="Highlight file in Windows Explorer folder"
                >
                  {openingFolder ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                  ) : justOpenedFolder ? (
                    <Check className="w-3.5 h-3.5 text-amber-500" />
                  ) : (
                    <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
                  )}
                  {justOpenedFolder ? 'Folder Opened!' : 'Show in Folder'}
                </button>
              </>
            )}

            {/* View Full in New Browser Tab */}
            <a
              href={transaction.receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold rounded-xl border border-indigo-200/60 dark:border-indigo-800/60 transition cursor-pointer"
              title="Open full size in a new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View in New Tab
            </a>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={transaction.receiptUrl}
              download={transaction.receiptName || 'receipt.pdf'}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </a>

            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
