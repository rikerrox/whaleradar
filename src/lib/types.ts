export type PageView = 
  | 'landing'
  | 'dashboard'
  | 'whale-tracker'
  | 'scanner'
  | 'copy-trading'
  | 'leaderboard'
  | 'pricing'
  | 'settings'
  | 'alerts'
  | 'wallet-profile'
  | 'coin-details'
  | 'admin';

export interface WhaleWallet {
  id: string;
  address: string;
  label: string;
  confidence: number;
  reputation: number;
  roi: number;
  winRate: number;
  totalTrades: number;
  totalPnl: number;
  avgHoldingTime: string;
  tags: string[];
  followersCount: number;
  recentTrades: Trade[];
  isFollowed: boolean;
}

export interface Trade {
  id: string;
  walletAddress: string;
  walletLabel?: string;
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  totalValue: number;
  txHash: string;
  dex: string;
  timestamp: Date;
  pnl?: number;
}

export interface MemeToken {
  id: string;
  address: string;
  symbol: string;
  name: string;
  image: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  liquidity: number;
  holderCount: number;
  age: string;
  whaleCount: number;
  rugRisk: number;
  trustScore: number;
  isTrending: boolean;
  isVerified: boolean;
  chain: string;
  dex: string;
  pairAddress: string;
}

export interface CopyTradeConfig {
  whaleWalletId: string;
  copyPercent: number;
  stopLoss: number;
  takeProfit: number;
  maxPosition: number;
  slippage: number;
  gasPriority: 'low' | 'medium' | 'high';
  isActive: boolean;
}

export interface CopyTrade {
  id: string;
  whaleWalletId: string;
  whaleLabel: string;
  tokenSymbol: string;
  tokenName: string;
  type: 'buy' | 'sell';
  amount: number;
  copyPercent: number;
  status: 'pending' | 'executed' | 'failed' | 'cancelled';
  pnl: number | null;
  txHash: string | null;
  createdAt: Date;
}

export interface AlertItem {
  id: string;
  type: 'whale_buy' | 'whale_sell' | 'volume_spike' | 'new_token' | 'copy_trade';
  title: string;
  message: string;
  token: string | null;
  isRead: boolean;
  channel: 'browser' | 'telegram' | 'discord' | 'email';
  timestamp: Date;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  features: string[];
  highlighted: boolean;
  cta: string;
}

export interface PortfolioData {
  totalValue: number;
  totalPnl: number;
  totalPnlPercent: number;
  solBalance: number;
  activePositions: number;
  activeCopyTrades: number;
  todayPnl: number;
  todayPnlPercent: number;
}

export interface ChartDataPoint {
  time: string;
  value: number;
  volume?: number;
}

export interface WalletProfile {
  address: string;
  label: string;
  solBalance: number;
  totalPnl: number;
  roi: number;
  winRate: number;
  totalTrades: number;
  avgHoldingTime: string;
  preferredTokens: string[];
  tags: string[];
  isFollowed: boolean;
  confidence: number;
  reputation: number;
  followersCount: number;
  recentTrades: Trade[];
  pnlHistory: ChartDataPoint[];
}

export interface ScannerFilter {
  minLiquidity: number;
  minVolume: number;
  maxAge: string;
  minHolders: number;
  minWhales: number;
  maxRugRisk: number;
  verifiedOnly: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  timestamp: Date;
}
