'use client';

import React from 'react';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Radar,
  ScanSearch,
  Copy,
  Trophy,
  CreditCard,
  Settings,
  Bell,
  LogOut,
  Waves,
  X,
  Zap,
  Play,
  Plus,
  Wallet,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { PageView } from '@/lib/types';

const navItems: { icon: React.ElementType; label: string; page: PageView; badge?: string }[] = [
  { icon: LayoutDashboard, label: 'Dashboard', page: 'dashboard' },
  { icon: Radar, label: 'Whale Tracker', page: 'whale-tracker', badge: 'LIVE' },
  { icon: ScanSearch, label: 'Coin Scanner', page: 'scanner' },
  { icon: Copy, label: 'Copy Trading', page: 'copy-trading' },
  { icon: Trophy, label: 'Leaderboard', page: 'leaderboard' },
  { icon: CreditCard, label: 'Pricing', page: 'pricing' },
  { icon: Bell, label: 'Alerts', page: 'alerts' },
  { icon: Settings, label: 'Settings', page: 'settings' },
];

export function Sidebar() {
  const { currentPage, setCurrentPage, walletAddress, walletBalance, userPlan, alerts, setSidebarOpen, isDemoMode, setShowDemoGuide, setDemoGuideStep, isAuthenticated, setShowDepositModal, logout, user } = useAppStore();
  const unreadAlerts = alerts.filter(a => !a.isRead).length;

  const handleDisconnect = () => {
    if (isAuthenticated) {
      logout();
    } else {
      useAppStore.getState().setWalletConnected(false);
      useAppStore.getState().setWalletAddress(null);
      useAppStore.getState().setWalletBalance(0);
      useAppStore.getState().setDemoMode(false);
      useAppStore.getState().setCurrentPage('landing');
    }
  };

  return (
    <div className="w-[280px] h-screen flex flex-col bg-[var(--sidebar)] border-r border-[var(--sidebar-border)]">
      {/* Logo */}
      <div className="p-4 flex items-center justify-between border-b border-[var(--sidebar-border)]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center">
            <Waves className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm neon-text-purple">WhaleRadar</h1>
            <p className="text-[10px] text-muted-foreground">AI-Powered</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-7 w-7"
          onClick={() => setSidebarOpen(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Wallet Info */}
      <div className="p-4 border-b border-[var(--sidebar-border)]">
        <div className="glass-card rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center">
              <Wallet className="w-3 h-3 text-white" />
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              {walletAddress ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` : 'Not Connected'}
            </span>
            {isDemoMode && (
              <Badge variant="secondary" className="text-[8px] h-4 px-1 bg-green-500/20 text-green-400 border-green-500/30 ml-auto">
                DEMO
              </Badge>
            )}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold">{walletBalance.toFixed(2)}</span>
            <span className="text-xs text-muted-foreground">SOL</span>
          </div>
          <div className="mt-2">
            <div className="flex items-center justify-between text-[10px] mb-1">
              <span className="text-muted-foreground">Plan</span>
              <span className="text-purple-400 font-medium uppercase">{userPlan}</span>
            </div>
            {userPlan === 'free' && (
              <Progress value={40} className="h-1" />
            )}
          </div>
          {/* Quick Deposit Button */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 h-7 text-xs bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20"
            onClick={() => setShowDepositModal(true)}
          >
            <Plus className="w-3 h-3 mr-1" />
            Deposit SOL
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = currentPage === item.page;
          const Icon = item.icon;
          return (
            <button
              key={item.page}
              onClick={() => {
                setCurrentPage(item.page);
                setSidebarOpen(false);
              }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200',
                isActive
                  ? 'bg-[var(--sidebar-accent)] text-purple-400 font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              )}
            >
              <Icon className={cn('w-4 h-4', isActive && 'text-purple-400')} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <Badge variant="secondary" className="h-5 text-[10px] bg-green-500/20 text-green-400 border-green-500/30">
                  {item.badge}
                </Badge>
              )}
              {item.page === 'alerts' && unreadAlerts > 0 && (
                <Badge variant="secondary" className="h-5 text-[10px] bg-red-500/20 text-red-400 border-red-500/30">
                  {unreadAlerts}
                </Badge>
              )}
            </button>
          );
        })}
        {user?.role === 'admin' && (
          <button
            onClick={() => {
              setCurrentPage('admin');
              setSidebarOpen(false);
            }}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200',
              currentPage === 'admin'
                ? 'bg-[var(--sidebar-accent)] text-purple-400 font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            )}
          >
            <ShieldCheck className={cn('w-4 h-4', currentPage === 'admin' && 'text-purple-400')} />
            <span className="flex-1 text-left">Admin Panel</span>
          </button>
        )}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-[var(--sidebar-border)]">
        {/* Restart Tour */}
        <button
          onClick={() => {
            setDemoGuideStep(0);
            setShowDemoGuide(true);
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-purple-400 hover:bg-purple-500/10 transition-all duration-200 mb-1"
        >
          <Play className="w-4 h-4" />
          <span>Restart Tour</span>
        </button>
        <button
          onClick={handleDisconnect}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          <span>{isAuthenticated ? 'Logout' : 'Disconnect'}</span>
        </button>
        <p className="text-[9px] text-muted-foreground/50 text-center mt-2 px-2">
          This is not financial advice. Trade at your own risk.
        </p>
      </div>
    </div>
  );
}
