'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { useRealtime } from '@/hooks/use-realtime';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { LandingPage } from '@/components/views/landing';
import { DashboardView } from '@/components/views/dashboard';
import { WhaleTrackerView } from '@/components/views/whale-tracker';
import { ScannerView } from '@/components/views/scanner';
import { CopyTradingView } from '@/components/views/copy-trading';
import { LeaderboardView } from '@/components/views/leaderboard';
import { PricingView } from '@/components/views/pricing';
import { SettingsView } from '@/components/views/settings';
import { AlertsView } from '@/components/views/alerts';
import { WalletProfileView } from '@/components/views/wallet-profile';
import { CoinDetailsView } from '@/components/views/coin-details';
import { DemoWelcomeGuide } from '@/components/demo-guide';
import { AuthModal } from '@/components/auth-modal';
import { DepositModal } from '@/components/deposit-modal';
import { PaymentModal } from '@/components/payment-modal';
import { generateMockWhales, generateMockTokens, generateMockCopyTrades, generateMockAlerts, mockPortfolio } from '@/lib/mock-data';

export function AppShell() {
  const { currentPage, walletConnected, sidebarOpen, setSidebarOpen } = useAppStore();
  const {
    setWhales, setTokens, setCopyTrades, setAlerts, setPortfolio,
    addLiveTrade, restoreSession,
  } = useAppStore();

  // Initialize mock data for demo/preview
  useEffect(() => {
    setWhales(generateMockWhales());
    setTokens(generateMockTokens());
    setCopyTrades(generateMockCopyTrades());
    setAlerts(generateMockAlerts());
    setPortfolio(mockPortfolio);
  }, [setWhales, setTokens, setCopyTrades, setAlerts, setPortfolio]);

  // Restore session on mount
  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // Connect to real-time WebSocket service
  const { connected: realtimeConnected } = useRealtime();

  // Fallback: simulate live trades if WebSocket not connected
  useEffect(() => {
    if (!walletConnected || realtimeConnected) return;
    const interval = setInterval(() => {
      const whales = generateMockWhales();
      const whale = whales[Math.floor(Math.random() * whales.length)];
      const trades = whale.recentTrades;
      if (trades.length > 0) {
        addLiveTrade({ ...trades[0], id: `live-${Date.now()}` });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [walletConnected, realtimeConnected, addLiveTrade]);

  // Auto-open sidebar on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setSidebarOpen]);

  const showAppShell = walletConnected && currentPage !== 'landing';

  const renderView = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage />;
      case 'dashboard':
        return <DashboardView />;
      case 'whale-tracker':
        return <WhaleTrackerView />;
      case 'scanner':
        return <ScannerView />;
      case 'copy-trading':
        return <CopyTradingView />;
      case 'leaderboard':
        return <LeaderboardView />;
      case 'pricing':
        return <PricingView />;
      case 'settings':
        return <SettingsView />;
      case 'alerts':
        return <AlertsView />;
      case 'wallet-profile':
        return <WalletProfileView />;
      case 'coin-details':
        return <CoinDetailsView />;
      default:
        return <LandingPage />;
    }
  };

  return (
    <>
      {/* Global Modals */}
      <AuthModal />
      <DepositModal />
      <PaymentModal />
      <DemoWelcomeGuide />

      {!showAppShell ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen"
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      ) : (
        <div className="min-h-screen flex bg-background">
          {/* Sidebar - Desktop: always visible, Mobile: toggle */}
          <div className="hidden lg:block">
            <Sidebar />
          </div>

          {/* Mobile Sidebar */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 left-0 z-50 lg:hidden"
              >
                <Sidebar />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Overlay for mobile */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Main content */}
          <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto p-4 lg:p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPage}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderView()}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>
      )}
    </>
  );
}
