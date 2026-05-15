import { create } from 'zustand';
import type { PageView, WhaleWallet, Trade, MemeToken, CopyTrade, AlertItem, PortfolioData, AppNotification } from './types';

interface AppState {
  // Navigation
  currentPage: PageView;
  setCurrentPage: (page: PageView) => void;
  
  // Wallet
  walletConnected: boolean;
  walletAddress: string | null;
  walletBalance: number;
  isDemoMode: boolean;
  setWalletConnected: (connected: boolean) => void;
  setWalletAddress: (address: string | null) => void;
  setWalletBalance: (balance: number) => void;
  setDemoMode: (demo: boolean) => void;
  
  // User
  userPlan: 'free' | 'pro' | 'elite';
  setUserPlan: (plan: 'free' | 'pro' | 'elite') => void;
  
  // Data
  whales: WhaleWallet[];
  setWhales: (whales: WhaleWallet[]) => void;
  toggleWhaleFollow: (id: string) => void;
  
  liveTrades: Trade[];
  addLiveTrade: (trade: Trade) => void;
  
  tokens: MemeToken[];
  setTokens: (tokens: MemeToken[]) => void;
  
  copyTrades: CopyTrade[];
  setCopyTrades: (trades: CopyTrade[]) => void;
  addCopyTrade: (trade: CopyTrade) => void;
  updateCopyTradeStatus: (id: string, status: CopyTrade['status'], pnl?: number) => void;
  
  alerts: AlertItem[];
  setAlerts: (alerts: AlertItem[]) => void;
  addAlert: (alert: AlertItem) => void;
  markAlertRead: (id: string) => void;
  
  portfolio: PortfolioData;
  setPortfolio: (data: PortfolioData) => void;
  
  // Watchlist
  watchlist: string[]; // token addresses
  toggleWatchlist: (address: string) => void;
  
  // UI
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  
  notifications: AppNotification[];
  addNotification: (notification: AppNotification) => void;
  removeNotification: (id: string) => void;
  
  // Selected items
  selectedWhaleId: string | null;
  setSelectedWhaleId: (id: string | null) => void;
  selectedTokenAddress: string | null;
  setSelectedTokenAddress: (address: string | null) => void;
  
  // Loading
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  
  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // Demo Guide
  showDemoGuide: boolean;
  setShowDemoGuide: (show: boolean) => void;
  demoGuideStep: number;
  setDemoGuideStep: (step: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Navigation
  currentPage: 'landing',
  setCurrentPage: (page) => set({ currentPage: page }),
  
  // Wallet
  walletConnected: false,
  walletAddress: null,
  walletBalance: 0,
  isDemoMode: false,
  setWalletConnected: (connected) => set({ walletConnected: connected }),
  setWalletAddress: (address) => set({ walletAddress: address }),
  setWalletBalance: (balance) => set({ walletBalance: balance }),
  setDemoMode: (demo) => set({ isDemoMode: demo }),
  
  // User
  userPlan: 'free',
  setUserPlan: (plan) => set({ userPlan: plan }),
  
  // Data
  whales: [],
  setWhales: (whales) => set({ whales }),
  toggleWhaleFollow: (id) => set((state) => ({
    whales: state.whales.map(w => 
      w.id === id ? { ...w, isFollowed: !w.isFollowed, followersCount: w.isFollowed ? w.followersCount - 1 : w.followersCount + 1 } : w
    )
  })),
  
  liveTrades: [],
  addLiveTrade: (trade) => set((state) => ({
    liveTrades: [trade, ...state.liveTrades].slice(0, 100)
  })),
  
  tokens: [],
  setTokens: (tokens) => set({ tokens }),
  
  copyTrades: [],
  setCopyTrades: (trades) => set({ copyTrades: trades }),
  addCopyTrade: (trade) => set((state) => ({
    copyTrades: [trade, ...state.copyTrades]
  })),
  updateCopyTradeStatus: (id, status, pnl) => set((state) => ({
    copyTrades: state.copyTrades.map(ct => 
      ct.id === id ? { ...ct, status, pnl: pnl !== undefined ? pnl : ct.pnl, txHash: status === 'executed' ? `${Math.random().toString(36).slice(2, 10)}...${Math.random().toString(36).slice(2, 6)}` : ct.txHash } : ct
    )
  })),
  
  alerts: [],
  setAlerts: (alerts) => set({ alerts }),
  addAlert: (alert) => set((state) => ({
    alerts: [alert, ...state.alerts]
  })),
  markAlertRead: (id) => set((state) => ({
    alerts: state.alerts.map(a => a.id === id ? { ...a, isRead: true } : a)
  })),
  
  portfolio: {
    totalValue: 0,
    totalPnl: 0,
    totalPnlPercent: 0,
    solBalance: 0,
    activePositions: 0,
    activeCopyTrades: 0,
    todayPnl: 0,
    todayPnlPercent: 0,
  },
  setPortfolio: (data) => set({ portfolio: data }),
  
  // Watchlist
  watchlist: [],
  toggleWatchlist: (address) => set((state) => ({
    watchlist: state.watchlist.includes(address) 
      ? state.watchlist.filter(a => a !== address)
      : [...state.watchlist, address]
  })),
  
  // UI
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  
  notifications: [],
  addNotification: (notification) => set((state) => ({
    notifications: [...state.notifications, notification]
  })),
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),
  
  // Selected items
  selectedWhaleId: null,
  setSelectedWhaleId: (id) => set({ selectedWhaleId: id }),
  selectedTokenAddress: null,
  setSelectedTokenAddress: (address) => set({ selectedTokenAddress: address }),
  
  // Loading
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  
  // Search
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  // Demo Guide
  showDemoGuide: false,
  setShowDemoGuide: (show) => set({ showDemoGuide: show }),
  demoGuideStep: 0,
  setDemoGuideStep: (step) => set({ demoGuideStep: step }),
}));
