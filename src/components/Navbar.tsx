import React from 'react'
import {
  Cloud,
  Coins,
  Menu,
  Moon,
  Plus,
  Radio,
  Sun,
  Wallet,
  X,
} from 'lucide-react'
import { CURRENCIES } from '../data/categories'
import type { CurrencyCode } from '../types/finance'
import { useFinance } from '../context/FinanceContext'

interface NavbarProps {
  onOpenRecordModal: () => void
  isMobileMenuOpen: boolean
  setIsMobileMenuOpen: (open: boolean) => void
  onNavigateSettings?: () => void
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenRecordModal,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  onNavigateSettings,
}) => {
  const { settings, updateSettings, toggleTheme, supabaseStatus } = useFinance()

  const currencyOptions = Object.keys(CURRENCIES) as CurrencyCode[]

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition cursor-pointer"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                FinanceFlow
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Business
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Cloud Database Sync Pill */}
          {supabaseStatus === 'connected' && (
            <button
              type="button"
              onClick={onNavigateSettings}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/20 transition cursor-pointer"
              title="Real-time multi-user sync is active with your business partner. Click to view settings."
            >
              <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
              <span>Team Sync</span>
            </button>
          )}

          {supabaseStatus === 'offline' && (
            <button
              type="button"
              onClick={onNavigateSettings}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25 hover:bg-rose-500/20 transition cursor-pointer"
              title="Supabase is offline. Click to check connection settings."
            >
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Cloud Offline</span>
            </button>
          )}

          {supabaseStatus === 'unconfigured' && (
            <button
              type="button"
              onClick={onNavigateSettings}
              className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 transition cursor-pointer"
              title="Working locally. Click to connect Supabase for live partner collaboration."
            >
              <Cloud className="w-3 h-3 text-slate-400" />
              <span>Local Mode</span>
            </button>
          )}

          {/* Currency Switcher */}
          <div className="relative hidden sm:block">
            <select
              value={settings.currency}
              onChange={(e) => updateSettings({ currency: e.target.value as CurrencyCode })}
              className="py-1.5 pl-3 pr-7 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition cursor-pointer appearance-none"
            >
              {currencyOptions.map((code) => (
                <option key={code} value={code} className="dark:bg-slate-900">
                  {CURRENCIES[code].symbol} {code}
                </option>
              ))}
            </select>
            <Coins className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition border border-transparent hover:border-slate-200 dark:hover:border-slate-800 cursor-pointer"
            title={`Switch to ${settings.theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {settings.theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* Quick Record CTA */}
          <button
            onClick={onOpenRecordModal}
            className="flex items-center gap-1.5 py-2 px-3.5 sm:px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline">New</span> Transaction
          </button>
        </div>
      </div>
    </header>
  )
}
