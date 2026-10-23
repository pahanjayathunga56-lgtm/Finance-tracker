import React, { useState } from 'react'
import { DashboardView } from './components/Dashboard/DashboardView'
import { ConvertModal } from './components/Modals/ConvertModal'
import { TransactionModal } from './components/Modals/TransactionModal'
import { Navbar } from './components/Navbar'
import { Sidebar } from './components/Sidebar'
import type { TabId } from './components/Sidebar'
import { SettingsView } from './components/Settings/SettingsView'
import { SubscriptionsView } from './components/Subscriptions/SubscriptionsView'
import { ToastContainer } from './components/Toast'
import { TransactionsView } from './components/Transactions/TransactionsView'
import { UpcomingView } from './components/Upcoming/UpcomingView'
import { FinanceProvider, useFinance } from './context/FinanceContext'
import type { UpcomingItem } from './types/finance'

const MainApp: React.FC = () => {
  const { upcomingItems } = useFinance()
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false)
  const [convertTargetItem, setConvertTargetItem] = useState<UpcomingItem | null>(null)

  const handleOpenConvertModal = (itemId: string) => {
    const item = upcomingItems.find((i) => i.id === itemId)
    if (item) setConvertTargetItem(item)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Sticky Navbar */}
      <Navbar
        onOpenRecordModal={() => setIsRecordModalOpen(true)}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        onNavigateSettings={() => setActiveTab('settings')}
      />

      {/* Main Container: Sidebar + Content */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />

        {/* Dynamic Content View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {activeTab === 'overview' && (
            <DashboardView
              onOpenRecordModal={() => setIsRecordModalOpen(true)}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenConvertModal={handleOpenConvertModal}
            />
          )}

          {activeTab === 'transactions' && <TransactionsView />}

          {activeTab === 'subscriptions' && <SubscriptionsView />}

          {activeTab === 'upcoming' && <UpcomingView />}

          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Global Modals & Toast System */}
      <TransactionModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
      />

      <ConvertModal
        isOpen={convertTargetItem !== null}
        onClose={() => setConvertTargetItem(null)}
        item={convertTargetItem}
      />

      <ToastContainer />
    </div>
  )
}

export function App() {
  return (
    <FinanceProvider>
      <MainApp />
    </FinanceProvider>
  )
}

export default App
