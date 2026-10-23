import React from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarClock,
  Database,
  LayoutDashboard,
  Receipt,
  Repeat,
  Sparkles,
} from 'lucide-react'
import { useFinance } from '../context/FinanceContext'

export type TabId = 'overview' | 'transactions' | 'subscriptions' | 'upcoming' | 'settings'

interface SidebarProps {
  activeTab: TabId
  setActiveTab: (tab: TabId) => void
  isMobileMenuOpen: boolean
  setIsMobileMenuOpen: (open: boolean) => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}) => {
  const { transactions, upcomingItems, metrics, formatCurrency } = useFinance()

  const pendingUpcomingCount = upcomingItems.filter((i) => i.status === 'pending').length

  const navItems: { id: TabId; label: string; icon: React.ReactNode; badge?: string | number }[] = [
    {
      id: 'overview',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: <Receipt className="w-5 h-5" />,
      badge: transactions.length,
    },
    {
      id: 'subscriptions',
      label: 'Recurring Subs',
      icon: <Repeat className="w-5 h-5" />,
      badge: metrics.activeSubscriptionCount > 0 ? `${metrics.activeSubscriptionCount} active` : undefined,
    },
    {
      id: 'upcoming',
      label: 'Upcoming Bills',
      icon: <CalendarClock className="w-5 h-5" />,
      badge: pendingUpcomingCount > 0 ? pendingUpcomingCount : undefined,
    },
    {
      id: 'settings',
      label: 'Data & Settings',
      icon: <Database className="w-5 h-5" />,
    },
  ]

  const handleSelectTab = (tab: TabId) => {
    setActiveTab(tab)
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64 border-r border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md p-4 flex flex-col justify-between transition-transform duration-300 ease-in-out shrink-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="space-y-6">
          {/* Main Navigation */}
          <div className="space-y-1">
            <span className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Menu
            </span>
            <nav className="mt-2 space-y-1">
              {navItems.map((item) => {
                const isActive = activeTab === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>

                    {item.badge !== undefined && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          isActive
                            ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Bottom Mini Net Cash Flow Widget */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/70 dark:from-slate-900/80 dark:to-slate-800/40 border border-slate-200/70 dark:border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              Net Cash Flow
            </span>
            <span
              className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${
                metrics.netCashFlow >= 0
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
              }`}
            >
              {metrics.netCashFlow >= 0 ? '+Surplus' : '-Deficit'}
            </span>
          </div>

          <p className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(metrics.netCashFlow)}
          </p>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/80 text-[11px]">
            <div>
              <span className="text-slate-400 block">Total In</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" />
                {formatCurrency(metrics.totalIncome)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Total Out</span>
              <span className="font-semibold text-rose-500 flex items-center gap-0.5">
                <ArrowDownLeft className="w-3 h-3" />
                {formatCurrency(metrics.totalExpenses)}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
