import React, { useMemo, useState } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  Compass,
  Paperclip,
  PieChart as PieChartIcon,
  Plus,
  Repeat,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { CATEGORY_COLORS } from '../../data/categories'
import { useFinance } from '../../context/FinanceContext'
import type { TabId } from '../Sidebar'
import type { Transaction } from '../../types/finance'
import { ReceiptViewerModal } from '../Modals/ReceiptViewerModal'

interface DashboardViewProps {
  onOpenRecordModal: () => void
  onNavigateTab: (tab: TabId) => void
  onOpenConvertModal: (itemId: string) => void
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenRecordModal,
  onNavigateTab,
  onOpenConvertModal,
}) => {
  const {
    transactions,
    upcomingItems,
    metrics,
    formatCurrency,
    currencySymbol,
  } = useFinance()

  const [selectedReceiptTx, setSelectedReceiptTx] = useState<Transaction | null>(null)

  // 1. Monthly Cashflow Aggregation for Bar/Area Chart
  const monthlyChartData = useMemo(() => {
    const monthMap: Record<string, { income: number; expense: number; net: number }> = {}

    // Sort transactions chronologically
    const sorted = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    if (sorted.length === 0) {
      // Mock placeholder points
      const d = new Date()
      const m = d.toLocaleString('default', { month: 'short' })
      return [{ month: m, income: 0, expense: 0, net: 0 }]
    }

    sorted.forEach((tx) => {
      const d = new Date(tx.date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

      if (!monthMap[key]) {
        monthMap[key] = { income: 0, expense: 0, net: 0 }
      }
      if (tx.type === 'income') {
        monthMap[key].income += tx.amount
      } else {
        monthMap[key].expense += tx.amount
      }
      monthMap[key].net = monthMap[key].income - monthMap[key].expense
    })

    const keys = Object.keys(monthMap).sort()
    return keys.map((key) => {
      const [year, month] = key.split('-')
      const date = new Date(parseInt(year), parseInt(month) - 1, 1)
      return {
        month: date.toLocaleString('default', { month: 'short' }),
        fullMonth: key,
        income: Math.round(monthMap[key].income * 100) / 100,
        expense: Math.round(monthMap[key].expense * 100) / 100,
        net: Math.round(monthMap[key].net * 100) / 100,
      }
    })
  }, [transactions])

  // 2. Category Breakdown for Donut Chart
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {}
    let totalExpense = 0

    transactions
      .filter((t) => t.type === 'expense')
      .forEach((tx) => {
        map[tx.category] = (map[tx.category] || 0) + tx.amount
        totalExpense += tx.amount
      })

    const sortedCategories = Object.entries(map)
      .map(([name, value]) => ({
        name,
        value: Math.round(value * 100) / 100,
        percentage: totalExpense > 0 ? ((value / totalExpense) * 100).toFixed(1) : '0',
        color: CATEGORY_COLORS[name] || '#94a3b8',
      }))
      .sort((a, b) => b.value - a.value)

    return sortedCategories
  }, [transactions])

  // 3. Recent 5 Transactions
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
  }, [transactions])

  // 4. Next Due Upcoming Items
  const pendingUpcoming = useMemo(() => {
    return upcomingItems
      .filter((i) => i.status === 'pending')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 4)
  }, [upcomingItems])

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Financial Health Overview
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Financial Dashboard
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
            Real-time cash flow diagnostics, spending distribution, and 30-day runway projection.
          </p>
        </div>

        <div className="flex items-center gap-2.5 relative z-10">
          <button
            onClick={onOpenRecordModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Log Transaction
          </button>
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Net Cash Flow */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Net Cash Flow
            </span>
            <div
              className={`p-2 rounded-xl ${
                metrics.netCashFlow >= 0
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
              }`}
            >
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {formatCurrency(metrics.netCashFlow)}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 text-xs font-medium">
              {metrics.netCashFlow >= 0 ? (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Positive balance
                </span>
              ) : (
                <span className="text-rose-500 flex items-center gap-0.5">
                  <TrendingDown className="w-3.5 h-3.5" />
                  Net expenditure
                </span>
              )}
              <span className="text-slate-400">• All-time</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Total Monthly Income */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Monthly Inflow
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight text-emerald-600 dark:text-emerald-400">
              {formatCurrency(metrics.currentMonthIncome)}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Recorded income this month
            </p>
          </div>
        </div>

        {/* KPI 3: Total Monthly Expenses */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Monthly Outflow
            </span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight text-rose-500">
              {formatCurrency(metrics.currentMonthExpenses)}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Spent in current billing cycle
            </p>
          </div>
        </div>

        {/* KPI 4: Active Subscriptions */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Active Subscriptions
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <Repeat className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight text-indigo-600 dark:text-indigo-400">
              {formatCurrency(metrics.monthlySubscriptionCost)}
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                /mo
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {metrics.activeSubscriptionCount} active • {formatCurrency(metrics.annualSubscriptionCost)}/yr
            </p>
          </div>
        </div>
      </div>

      {/* Charts Grid: Cash Flow Trend & Category Spending */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 cols): Cash Flow Trend (Monthly Breakdown) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Cash Flow Trend
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Monthly income vs. expense comparison
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
                <span className="text-slate-600 dark:text-slate-400">Income</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-rose-500 inline-block" />
                <span className="text-slate-600 dark:text-slate-400">Expenses</span>
              </div>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickFormatter={(val) => `${currencySymbol}${val}`}
                />
                <Tooltip
                  cursor={false}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="p-3 bg-slate-900 text-white rounded-xl shadow-xl border border-slate-700 text-xs space-y-1">
                          <p className="font-bold border-b border-slate-700 pb-1 mb-1">{label}</p>
                          <p className="text-emerald-400 flex justify-between gap-4">
                            <span>Income:</span>
                            <span className="font-semibold">
                              {currencySymbol}
                              {Number(payload[0]?.value || 0).toFixed(2)}
                            </span>
                          </p>
                          <p className="text-rose-400 flex justify-between gap-4">
                            <span>Expense:</span>
                            <span className="font-semibold">
                              {currencySymbol}
                              {Number(payload[1]?.value || 0).toFixed(2)}
                            </span>
                          </p>
                          <p className="text-indigo-300 flex justify-between gap-4 pt-1 border-t border-slate-700 font-bold">
                            <span>Net:</span>
                            <span>
                              {currencySymbol}
                              {(
                                Number(payload[0]?.value || 0) - Number(payload[1]?.value || 0)
                              ).toFixed(2)}
                            </span>
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar dataKey="income" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={36} />
                <Bar dataKey="expense" fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right (1 col): Category Spending (Donut Chart) */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Spending by Category
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Distribution of outflows
                </p>
              </div>
              <PieChartIcon className="w-4 h-4 text-slate-400" />
            </div>

            {categoryData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-xs text-slate-400 text-center">
                No expense data recorded yet.
              </div>
            ) : (
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-xl border border-slate-700 text-xs">
                              <p className="font-bold flex items-center gap-1.5">
                                <span
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{ backgroundColor: data.color }}
                                />
                                {data.name}
                              </p>
                              <p className="text-slate-300 mt-1">
                                {currencySymbol}
                                {data.value.toFixed(2)} ({data.percentage}%)
                              </p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Top 3 categories summary list */}
          <div className="space-y-2 mt-2 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            {categoryData.slice(0, 3).map((cat) => (
              <div key={cat.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-slate-700 dark:text-slate-300 truncate max-w-[130px]">
                    {cat.name}
                  </span>
                </div>
                <div className="font-semibold text-slate-900 dark:text-white">
                  {currencySymbol}
                  {cat.value.toFixed(2)}{' '}
                  <span className="text-slate-400 font-normal">({cat.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Runway / Projections Forecast Widget & Upcoming/Recent Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Runway Widget (1 col) */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/30 to-slate-900 border border-indigo-900/40 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <Compass className="w-4 h-4" />
                30-Day Cash Runway Forecast
              </span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>

            <p className="text-xs text-slate-300 mb-5 leading-relaxed">
              Predicts your available balance 30 days from now based on current cash flow, upcoming scheduled bills, and active recurring subscriptions.
            </p>

            <div className="space-y-2.5 p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Current Net Balance</span>
                <span className="text-white font-medium">{formatCurrency(metrics.netCashFlow)}</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>+ Expected Inflow (Upcoming)</span>
                <span className="font-medium">+{formatCurrency(metrics.pendingUpcomingIncome)}</span>
              </div>
              <div className="flex justify-between text-rose-400">
                <span>- Scheduled Bills (Upcoming)</span>
                <span className="font-medium">-{formatCurrency(metrics.pendingUpcomingExpenses)}</span>
              </div>
              <div className="flex justify-between text-indigo-300">
                <span>- Monthly Subscriptions</span>
                <span className="font-medium">-{formatCurrency(metrics.monthlySubscriptionCost)}</span>
              </div>
              <div className="pt-2 border-t border-slate-700/80 flex justify-between items-center text-sm font-bold">
                <span className="text-white">Projected Balance:</span>
                <span
                  className={
                    metrics.projected30DayBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }
                >
                  {formatCurrency(metrics.projected30DayBalance)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-indigo-900/40 flex items-center justify-between">
            <span className="text-xs text-slate-400">Runway Status</span>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                metrics.projected30DayBalance > 1000
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : metrics.projected30DayBalance >= 0
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-rose-500/20 text-rose-300'
              }`}
            >
              {metrics.projected30DayBalance > 1000
                ? 'Healthy Buffer'
                : metrics.projected30DayBalance >= 0
                ? 'Tight Margin'
                : 'Deficit Risk'}
            </span>
          </div>
        </div>

        {/* Recent Transactions & Upcoming Bills (2 cols) */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Recent Activity */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Recent Transactions
                </h4>
                <button
                  onClick={() => onNavigateTab('transactions')}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold cursor-pointer"
                >
                  View All
                </button>
              </div>

              {recentTransactions.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <p className="text-xs text-slate-400">No transactions recorded yet.</p>
                  <button
                    type="button"
                    onClick={onOpenRecordModal}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-lg transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Record First Entry
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            tx.type === 'income'
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : 'bg-rose-500/10 text-rose-500'
                          }`}
                        >
                          {tx.type === 'income' ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <ArrowDownLeft className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                            {tx.description}
                            {tx.receiptUrl && (
                              <button
                                type="button"
                                onClick={() => setSelectedReceiptTx(tx)}
                                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 font-semibold text-[10px] transition cursor-pointer shrink-0"
                                title="Click to view attached receipt"
                              >
                                <Paperclip className="w-2.5 h-2.5" />
                                Receipt
                              </button>
                            )}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {tx.category} • {tx.date}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-xs font-bold shrink-0 ${
                          tx.type === 'income'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-500'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'}
                        {formatCurrency(tx.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Bills & Payoffs */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Pending Due Items
                </h4>
                <button
                  onClick={() => onNavigateTab('upcoming')}
                  className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline font-semibold cursor-pointer"
                >
                  Manage
                </button>
              </div>

              {pendingUpcoming.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <p className="text-xs text-slate-400">No scheduled bills or payouts.</p>
                  <button
                    type="button"
                    onClick={() => onNavigateTab('upcoming')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-600 dark:text-cyan-400 text-xs font-semibold rounded-lg transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Schedule Bill
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingUpcoming.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {item.title}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-cyan-500" />
                          Due: {item.dueDate}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-xs font-bold ${
                            item.type === 'income'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-500'
                          }`}
                        >
                          {item.type === 'income' ? '+' : '-'}
                          {formatCurrency(item.amount)}
                        </span>
                        <button
                          onClick={() => onOpenConvertModal(item.id)}
                          className="px-2 py-1 text-[10px] font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 rounded-lg transition cursor-pointer"
                          title="Mark Cleared"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Global Receipt Viewer for Dashboard */}
      <ReceiptViewerModal
        isOpen={!!selectedReceiptTx}
        onClose={() => setSelectedReceiptTx(null)}
        transaction={selectedReceiptTx}
      />
    </div>
  )
}
