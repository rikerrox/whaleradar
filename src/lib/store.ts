import { create } from 'zustand';
import type { PageView, WhaleWallet, Trade, MemeToken, CopyTrade, AlertItem, PortfolioData, AppNotification } from './types';
import { apiClient } from './api-client';
import { calculatePortfolio, DEFAULT_SOL_BALANCE } from './mock-data';

interface User {
  id: string;
  email: string | null;
  username: string | null;
  walletAddress: string | null;
  plan: 'free' | 'pro' | 'elite' | 'ultimate';
  role: 'user' | 'admin';
  solBalance: number;
  avatar: string | null;
  createdAt: string;
}

interface AppState {
  // Navigation
  currentPage: PageView;
  setCurrentPage: (page: PageView) => void;

  // SOL Price (real-time from CoinGecko)
  solPrice: number;
  solPriceChange24h: number;
  solPriceLoaded: boolean;
  fetchSolPrice: () => Promise<void>;

  // Auth
  user: User | null;
  isAuthenticated: boolean;
  sessionToken: string | null;
  setUser: (user: User | null) => void;
  setAuthenticated: (auth: boolean) => void;
  setSessionToken: (token: string | null) => void;
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithWallet: (walletAddress: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, username: string, password: string, walletAddress?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  restoreSession: () => Promise<void>;
  refreshUser: () => Promise<void>;

  // Wallet
  walletConnected: boolean;
  walletAddress: string | null;
  walletBalance: number;
  isDemoMode: boolean;
  setWalletConnected: (connected: boolean) => void;
  setWalletAddress: (address: string | null) => void;
  setWalletBalance: (balance: number) => void;
  setDemoMode: (demo: boolean) => void;

  // User Plan
  userPlan: 'free' | 'pro' | 'elite' | 'ultimate';
  setUserPlan: (plan: 'free' | 'pro' | 'elite' | 'ultimate') => void;

  // Data
  whales: WhaleWallet[];
  setWhales: (whales: WhaleWallet[]) => void;
  toggleWhaleFollow: (id: string) => void;

  liveTrades: Trade[];
  addLiveTrade: (trade: Trade) => void;

  tokens: MemeToken[];
  setTokens: (tokens: MemeToken[]) => void;
  liveTokenPrices: Record<string, { price: number; change24h: number }>;
  fetchTokenPrices: () => Promise<void>;

  copyTrades: CopyTrade[];
  setCopyTrades: (trades: CopyTrade[]) => void;
  addCopyTrade: (trade: CopyTrade) => void;
  updateCopyTradeStatus: (id: string, status: CopyTrade['status'], pnl?: number) => void;

  alerts: AlertItem[];
  setAlerts: (alerts: AlertItem[]) => void;
  addAlert: (alert: AlertItem) => void;
  removeAlert: (id: string) => void;
  markAlertRead: (id: string) => void;
  markAllAlertsRead: () => void;

  portfolio: PortfolioData;
  setPortfolio: (data: PortfolioData) => void;
  recalculatePortfolio: () => void;

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

  // Auth Modals
  showAuthModal: boolean;
  authModalTab: 'login' | 'register';
  setShowAuthModal: (show: boolean) => void;
  setAuthModalTab: (tab: 'login' | 'register') => void;

  // Deposit Modal
  showDepositModal: boolean;
  setShowDepositModal: (show: boolean) => void;

  // Payment Modal
  showPaymentModal: boolean;
  paymentPlan: string | null;
  setShowPaymentModal: (show: boolean) => void;
  setPaymentPlan: (plan: string | null) => void;
}

// Default SOL price used before API fetch completes
const DEFAULT_SOL_PRICE = 0;

export const useAppStore = create<AppState>((set, get) => ({
  // Navigation
  currentPage: 'landing',
  setCurrentPage: (page) => set({ currentPage: page }),

  // SOL Price
  solPrice: DEFAULT_SOL_PRICE,
  solPriceChange24h: 0,
  solPriceLoaded: false,
  fetchSolPrice: async () => {
    try {
      const res = await fetch('/api/sol-price');
      if (res.ok) {
        const data = await res.json();
        const newPrice = data.price;
        const change24h = data.change24h ?? 0;
        set({ solPrice: newPrice, solPriceChange24h: change24h, solPriceLoaded: true });
        // Recalculate portfolio with new SOL price and live token prices
        const state = get();
        const solBalance = state.walletBalance > 0 ? state.walletBalance : 0;
        const portfolio = calculatePortfolio(solBalance, newPrice, state.copyTrades, state.liveTokenPrices);
        set({ portfolio });
      }
    } catch {
      // Keep fallback price
    }
  },

  // Auth
  user: null,
  isAuthenticated: false,
  sessionToken: null,
  setUser: (user) => set({ user }),
  setAuthenticated: (auth) => set({ isAuthenticated: auth }),
  setSessionToken: (token) => set({ sessionToken: token }),

  loginWithEmail: async (email, password) => {
    try {
      const result = await apiClient.loginWithEmail(email, password);
      if (result.error) {
        return { success: false, error: result.error };
      }
      const userData = result.data as User & { stats: Record<string, unknown> };
      const token = result.sessionToken;
      const isDemo = get().isDemoMode;
      set({
        user: userData,
        isAuthenticated: true,
        sessionToken: token || null,
        walletConnected: true,
        walletAddress: isDemo ? get().walletAddress : userData.walletAddress,
        walletBalance: isDemo ? get().walletBalance : (userData.solBalance || 0),
        userPlan: userData.plan,
        currentPage: 'dashboard',
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Login failed. Please try again.' };
    }
  },

  loginWithWallet: async (walletAddress) => {
    try {
      const result = await apiClient.loginWithWallet(walletAddress);
      const isDemo = get().isDemoMode;
      if (result.error) {
        // If wallet not found, auto-register
        if (result.error.includes('No account found')) {
          const regResult = await apiClient.register(
            `${walletAddress.slice(0, 8)}@whaleradar.io`,
            `whale_${walletAddress.slice(0, 6)}`,
            walletAddress.slice(-12) + 'WhaleRadar!',
            walletAddress
          );
          if (regResult.error) {
            return { success: false, error: regResult.error };
          }
          const userData = regResult.data as User;
          const token = regResult.sessionToken;
          set({
            user: userData,
            isAuthenticated: true,
            sessionToken: token || null,
            walletConnected: true,
            walletAddress: isDemo ? get().walletAddress : (userData.walletAddress || walletAddress),
        walletBalance: isDemo ? get().walletBalance : (userData.solBalance > 0 ? userData.solBalance : get().walletBalance),
            userPlan: userData.plan || 'free',
            currentPage: 'dashboard',
          });
          return { success: true };
        }
        return { success: false, error: result.error };
      }
      const userData = result.data as User;
      const token = result.sessionToken;
      set({
        user: userData,
        isAuthenticated: true,
        sessionToken: token || null,
        walletConnected: true,
        walletAddress: isDemo ? get().walletAddress : (userData.walletAddress || walletAddress),
        walletBalance: isDemo ? get().walletBalance : (userData.solBalance || 0),
        userPlan: userData.plan,
        currentPage: 'dashboard',
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Wallet login failed.' };
    }
  },

  register: async (email, username, password, walletAddress) => {
    try {
      const result = await apiClient.register(email, username, password, walletAddress);
      if (result.error) {
        return { success: false, error: result.error };
      }
      const userData = result.data as User;
      const token = result.sessionToken;
      const isDemo = get().isDemoMode;
      set({
        user: userData,
        isAuthenticated: true,
        sessionToken: token || null,
        walletConnected: true,
        walletAddress: isDemo ? get().walletAddress : (userData.walletAddress || walletAddress || null),
        walletBalance: isDemo ? get().walletBalance : (userData.solBalance || 0),
        userPlan: 'free',
        currentPage: 'dashboard',
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Registration failed. Please try again.' };
    }
  },

  logout: () => {
    apiClient.logout();
    set({
      user: null,
      isAuthenticated: false,
      sessionToken: null,
      walletConnected: false,
      walletAddress: null,
  walletBalance: DEFAULT_SOL_BALANCE,
      userPlan: 'free',
      isDemoMode: false,
      currentPage: 'landing',
      copyTrades: [],
      alerts: [],
    });
  },

  restoreSession: async () => {
    if (!apiClient.isAuthenticated()) return;
    try {
      const result = await apiClient.getCurrentUser();
      if (result.error || !result.data) {
        apiClient.setSessionToken(null);
        return;
      }
      const userData = result.data as User & { stats: Record<string, unknown> };
      const isDemo = get().isDemoMode;
      set({
        user: userData,
        isAuthenticated: true,
        walletConnected: true,
        walletAddress: isDemo ? get().walletAddress : userData.walletAddress,
        walletBalance: isDemo ? get().walletBalance : (userData.solBalance || 0),
        userPlan: userData.plan,
        // Navigate to dashboard on session restore so user doesn't get stuck on landing
        currentPage: get().currentPage === 'landing' ? 'dashboard' : get().currentPage,
      });
    } catch {
      // Session expired
      apiClient.setSessionToken(null);
    }
  },

  refreshUser: async () => {
    if (!apiClient.isAuthenticated()) return;
    const isDemo = get().isDemoMode;
    if (isDemo) return; // Don't override demo state
    try {
      const result = await apiClient.getWalletBalance();
      if (result.data && !result.error) {
        const data = result.data as { solBalance: number; walletAddress: string | null; plan: string; totalPnl: number; activeCopyTrades: number };
        set({
          walletBalance: data.solBalance,
          walletAddress: data.walletAddress,
          userPlan: data.plan as 'free' | 'pro' | 'elite' | 'ultimate',
        });
      }
    } catch {
      // ignore
    }
  },

  // Wallet
  walletConnected: false,
  walletAddress: null,
  walletBalance: 0,
  isDemoMode: false,
  setWalletConnected: (connected) => set({ walletConnected: connected }),
  setWalletAddress: (address) => set({ walletAddress: address }),
  setWalletBalance: (balance) => set({ walletBalance: balance }),
  setDemoMode: (demo) => set({ isDemoMode: demo }),

  // User Plan
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
  liveTokenPrices: {},
  fetchTokenPrices: async () => {
    try {
      const res = await fetch('/api/crypto-prices');
      if (res.ok) {
        const { prices } = await res.json();
        if (!prices) return;
        set({ liveTokenPrices: prices });
        // Populate tokens from live prices if empty
        const state = get();
        if (state.tokens.length === 0 && Object.keys(prices).length > 0) {
          const { generateTokensFromPrices } = await import('./mock-data');
          const tokens = generateTokensFromPrices(prices);
          set({ tokens });
        } else {
          // Update existing token prices
          const updatedTokens = state.tokens.map((token) => {
            const live = prices[token.symbol];
            if (live) {
              return { ...token, price: live.price, priceChange24h: live.change24h };
            }
            return token;
          });
          set({ tokens: updatedTokens });
        }
        // Recalculate portfolio with live token prices
        const solBalance = state.walletBalance > 0 ? state.walletBalance : 0;
        const portfolio = calculatePortfolio(solBalance, state.solPrice, state.copyTrades, prices);
        set({ portfolio });
      }
    } catch {
      // Keep existing prices
    }
  },

  copyTrades: [],
  setCopyTrades: (trades) => {
    set({ copyTrades: trades });
    // Recalculate portfolio when copy trades change
    const state = get();
    const solBalance = state.walletBalance > 0 ? state.walletBalance : 0;
    const portfolio = calculatePortfolio(solBalance, state.solPrice, trades, state.liveTokenPrices);
    set({ portfolio });
  },
  addCopyTrade: (trade) => set((state) => {
    const newTrades = [trade, ...state.copyTrades];
    const solBalance = state.walletBalance > 0 ? state.walletBalance : 0;
    const portfolio = calculatePortfolio(solBalance, state.solPrice, newTrades, state.liveTokenPrices);
    return { copyTrades: newTrades, portfolio };
  }),
  updateCopyTradeStatus: (id, status, pnl) => set((state) => {
    const newTrades = state.copyTrades.map(ct =>
      ct.id === id ? { ...ct, status, pnl: pnl !== undefined ? pnl : ct.pnl, txHash: status === 'executed' ? `${Math.random().toString(36).slice(2, 10)}...${Math.random().toString(36).slice(2, 6)}` : ct.txHash } : ct
    );
    const solBalance = state.walletBalance > 0 ? state.walletBalance : DEFAULT_SOL_BALANCE;
    const portfolio = calculatePortfolio(solBalance, state.solPrice, newTrades, state.liveTokenPrices);
    return { copyTrades: newTrades, portfolio };
  }),

  alerts: [],
  setAlerts: (alerts) => set({ alerts }),
  addAlert: (alert) => set((state) => ({
    alerts: [alert, ...state.alerts]
  })),
  removeAlert: (id) => set((state) => ({
    alerts: state.alerts.filter(a => a.id !== id)
  })),
  markAlertRead: (id) => set((state) => ({
    alerts: state.alerts.map(a => a.id === id ? { ...a, isRead: true } : a)
  })),
  markAllAlertsRead: () => set((state) => ({
    alerts: state.alerts.map(a => ({ ...a, isRead: true }))
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
  recalculatePortfolio: () => {
    const state = get();
    const solBalance = state.walletBalance > 0 ? state.walletBalance : 0;
    const portfolio = calculatePortfolio(solBalance, state.solPrice, state.copyTrades, state.liveTokenPrices);
    set({ portfolio });
  },

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

  // Auth Modals
  showAuthModal: false,
  authModalTab: 'login',
  setShowAuthModal: (show) => set({ showAuthModal: show }),
  setAuthModalTab: (tab) => set({ authModalTab: tab }),

  // Deposit Modal
  showDepositModal: false,
  setShowDepositModal: (show) => set({ showDepositModal: show }),

  // Payment Modal
  showPaymentModal: false,
  paymentPlan: null,
  setShowPaymentModal: (show) => set({ showPaymentModal: show }),
  setPaymentPlan: (plan) => set({ paymentPlan: plan }),
}));
