import type { WhaleWallet, Trade, MemeToken, CopyTrade, AlertItem, PortfolioData, SubscriptionPlan, ChartDataPoint } from './types';

const WHALE_ADDRESSES = [
  '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
  'DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy',
  '9WzDX2BQ2vMRX7vT8Wq2oMf1LpPw9V9kQ8sG9Q8sG9Q8',
  'BbFD3p3F6q2vMRX7vT8Wq2oMf1LpPw9V9kQ8sG9Q8sG9',
  '5QNT4n2vMRX7vT8Wq2oMf1LpPw9V9kQ8sG9Q8sG9Q8sG',
  '3nFP4t2vMRX7vT8Wq2oMf1LpPw9V9kQ8sG9Q8sG9Q8sA',
  'Ht5K3p3F6q2vMRX7vT8Wq2oMf1LpPw9V9kQ8sG9Q8sG2',
  '8vBN4n2vMRX7vT8Wq2oMf1LpPw9V9kQ8sG9Q8sG9Q8sB',
  'Ck7M2p3F6q2vMRX7vT8Wq2oMf1LpPw9V9kQ8sG9Q8sG3',
  'Jw9R1n2vMRX7vT8Wq2oMf1LpPw9V9kQ8sG9Q8sG9Q8sC',
];

const TOKEN_SYMBOLS = ['BONK', 'WIF', 'PEPE', 'FLOKI', 'MEME', 'DOGE', 'SHIB', 'TURBO', 'BOME', 'SLERF', 'WEN', 'MYRO', 'PONKE', 'POPCAT', 'MEW', 'NEIRO', 'GOAT', 'MOODENG', 'FIGHT', 'BABYDOGE'];
const TOKEN_NAMES = ['Bonk', 'dogwifhat', 'Pepe', 'Floki Inu', 'Memecoin', 'Dogecoin', 'Shiba Inu', 'Turbo', 'BOOK OF MEME', 'Slerf', 'Wen', 'Myro', 'Ponke', 'Popcat', 'Cat in a dogs world', 'Neiro', 'Goatseus Maximus', 'Moo Deng', 'Fight Club', 'Baby Doge'];
const DEX_LIST = ['Raydium', 'Orca', 'Jupiter', 'Meteora', 'Phoenix'];

function randomBetween(min: number, max: number, decimals = 2): number {
  return Number((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shortAddress(addr: string): string {
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

function hoursAgo(h: number): Date {
  return new Date(Date.now() - h * 60 * 60 * 1000);
}

export function generateMockWhales(): WhaleWallet[] {
  const labels = [
    'Smart Whale Alpha', 'Degen Master', 'Sol Sniper', 'Meme King',
    'Whale Shark', 'Diamond Hands', 'APE Lord', 'Fast Fingers',
    'Crypto Sage', 'Whisper Trader'
  ];
  const tagSets = [
    ['early-buyer', 'memecoin-whale'],
    ['degen', 'high-frequency'],
    ['sniper', 'new-launches'],
    ['memecoin-whale', 'diamond-hands'],
    ['whale', 'low-risk'],
    ['diamond-hands', 'long-term'],
    ['ape', 'high-volume'],
    ['scalper', 'fast-exits'],
    ['smart-money', 'analytical'],
    ['insider', 'early-buyer'],
  ];

  return WHALE_ADDRESSES.map((addr, i) => ({
    id: `whale-${i + 1}`,
    address: addr,
    label: labels[i],
    confidence: randomBetween(60, 99),
    reputation: randomBetween(70, 98),
    roi: randomBetween(-20, 450),
    winRate: randomBetween(45, 92),
    totalTrades: Math.floor(randomBetween(50, 2500, 0)),
    totalPnl: randomBetween(-50, 5000),
    avgHoldingTime: randomFromArray(['2h', '6h', '12h', '1d', '3d', '1w']),
    tags: tagSets[i],
    followersCount: Math.floor(randomBetween(10, 5000, 0)),
    recentTrades: generateMockTrades(5, addr, labels[i]),
    isFollowed: i < 3,
  }));
}

export function generateMockTrades(count: number, walletAddress?: string, walletLabel?: string): Trade[] {
  const trades: Trade[] = [];
  for (let i = 0; i < count; i++) {
    const tokenIdx = Math.floor(Math.random() * TOKEN_SYMBOLS.length);
    const isBuy = Math.random() > 0.35;
    const amount = randomBetween(100, 50000);
    const price = randomBetween(0.0000001, 0.5, 10);
    trades.push({
      id: `trade-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
      walletAddress: walletAddress || randomFromArray(WHALE_ADDRESSES),
      walletLabel: walletLabel || undefined,
      tokenAddress: `token-${TOKEN_SYMBOLS[tokenIdx].toLowerCase()}`,
      tokenSymbol: TOKEN_SYMBOLS[tokenIdx],
      tokenName: TOKEN_NAMES[tokenIdx],
      type: isBuy ? 'buy' : 'sell',
      amount,
      price,
      totalValue: Number((amount * price).toFixed(2)),
      txHash: `${Math.random().toString(36).slice(2, 10)}...${Math.random().toString(36).slice(2, 6)}`,
      dex: randomFromArray(DEX_LIST),
      timestamp: hoursAgo(Math.random() * 48),
    });
  }
  return trades.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

export function generateMockTokens(): MemeToken[] {
  return TOKEN_SYMBOLS.map((symbol, i) => {
    const price = randomBetween(0.0000001, 0.5, 10);
    const marketCap = randomBetween(100000, 500000000);
    const liquidity = marketCap * randomBetween(0.05, 0.3);
    return {
      id: `token-${i + 1}`,
      address: `addr-${symbol.toLowerCase()}`,
      symbol,
      name: TOKEN_NAMES[i],
      image: '',
      price,
      priceChange24h: randomBetween(-80, 300),
      volume24h: randomBetween(50000, 50000000),
      marketCap,
      liquidity,
      holderCount: Math.floor(randomBetween(100, 100000, 0)),
      age: randomFromArray(['<1h', '2h', '6h', '12h', '1d', '3d', '1w', '2w', '1m']),
      whaleCount: Math.floor(randomBetween(0, 50, 0)),
      rugRisk: randomBetween(0, 100),
      trustScore: randomBetween(10, 100),
      isTrending: i < 5,
      isVerified: i < 8,
      chain: 'solana',
      dex: randomFromArray(DEX_LIST),
      pairAddress: `pair-${symbol.toLowerCase()}`,
    };
  });
}

export function generateMockCopyTrades(): CopyTrade[] {
  return [
    {
      id: 'ct-1',
      whaleWalletId: 'whale-1',
      whaleLabel: 'Smart Whale Alpha',
      tokenSymbol: 'WIF',
      tokenName: 'dogwifhat',
      type: 'buy',
      amount: 2.5,
      copyPercent: 50,
      status: 'executed',
      pnl: 125.40,
      txHash: '5Kj7h...mN2p',
      createdAt: hoursAgo(2),
    },
    {
      id: 'ct-2',
      whaleWalletId: 'whale-2',
      whaleLabel: 'Degen Master',
      tokenSymbol: 'BONK',
      tokenName: 'Bonk',
      type: 'buy',
      amount: 1.8,
      copyPercent: 25,
      status: 'executed',
      pnl: -32.10,
      txHash: '8Qm3k...pL5v',
      createdAt: hoursAgo(5),
    },
    {
      id: 'ct-3',
      whaleWalletId: 'whale-3',
      whaleLabel: 'Sol Sniper',
      tokenSymbol: 'PEPE',
      tokenName: 'Pepe',
      type: 'buy',
      amount: 5.0,
      copyPercent: 100,
      status: 'pending',
      pnl: null,
      txHash: null,
      createdAt: hoursAgo(0.1),
    },
    {
      id: 'ct-4',
      whaleWalletId: 'whale-4',
      whaleLabel: 'Meme King',
      tokenSymbol: 'FLOKI',
      tokenName: 'Floki Inu',
      type: 'sell',
      amount: 3.2,
      copyPercent: 75,
      status: 'executed',
      pnl: 89.70,
      txHash: '2Nf8j...kR9w',
      createdAt: hoursAgo(8),
    },
    {
      id: 'ct-5',
      whaleWalletId: 'whale-5',
      whaleLabel: 'Whale Shark',
      tokenSymbol: 'BOME',
      tokenName: 'BOOK OF MEME',
      type: 'buy',
      amount: 4.1,
      copyPercent: 100,
      status: 'failed',
      pnl: null,
      txHash: null,
      createdAt: hoursAgo(1),
    },
  ];
}

export function generateMockAlerts(): AlertItem[] {
  return [
    {
      id: 'alert-1',
      type: 'whale_buy',
      title: 'Whale Buy Detected',
      message: 'Smart Whale Alpha bought 50,000 WIF worth $12,500',
      token: 'WIF',
      isRead: false,
      channel: 'browser',
      timestamp: hoursAgo(0.1),
    },
    {
      id: 'alert-2',
      type: 'volume_spike',
      title: 'Volume Spike',
      message: 'BONK volume up 450% in last hour',
      token: 'BONK',
      isRead: false,
      channel: 'browser',
      timestamp: hoursAgo(0.5),
    },
    {
      id: 'alert-3',
      type: 'copy_trade',
      title: 'Copy Trade Executed',
      message: 'Copied Sol Sniper: Bought PEPE worth 5 SOL',
      token: 'PEPE',
      isRead: true,
      channel: 'browser',
      timestamp: hoursAgo(1),
    },
    {
      id: 'alert-4',
      type: 'new_token',
      title: 'New Trending Token',
      message: 'GOAT is trending with 200+ whale entries',
      token: 'GOAT',
      isRead: true,
      channel: 'browser',
      timestamp: hoursAgo(2),
    },
    {
      id: 'alert-5',
      type: 'whale_sell',
      title: 'Large Sell-off Detected',
      message: 'Degen Master sold 100,000 FLOKI worth $8,200',
      token: 'FLOKI',
      isRead: true,
      channel: 'browser',
      timestamp: hoursAgo(3),
    },
  ];
}

export const mockPortfolio: PortfolioData = {
  totalValue: 48750.30,
  totalPnl: 8342.50,
  totalPnlPercent: 20.65,
  solBalance: 45.8,
  activePositions: 7,
  activeCopyTrades: 3,
  todayPnl: 1250.80,
  todayPnlPercent: 2.64,
};

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'forever',
    features: [
      'Basic whale tracking',
      '5 whale follows',
      'Delayed alerts (15 min)',
      'Community access',
      'Basic dashboard',
    ],
    highlighted: false,
    cta: 'Get Started',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 49,
    period: 'month',
    features: [
      'Real-time whale tracking',
      '50 whale follows',
      'Instant alerts',
      'Auto copy trading (3 whales)',
      'Advanced analytics',
      'Rug detection',
      'Telegram/Discord alerts',
      'Priority support',
    ],
    highlighted: true,
    cta: 'Start Pro Trial',
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 149,
    period: 'month',
    features: [
      'Everything in Pro',
      'Unlimited whale follows',
      'AI trade scoring',
      'Auto copy trading (unlimited)',
      'Smart money patterns',
      'API access',
      'Custom alerts & filters',
      'Dedicated support',
      'Early access features',
      'Referral program',
    ],
    highlighted: false,
    cta: 'Go Elite',
  },
];

export function generatePortfolioChartData(): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  let value = 40000;
  for (let i = 30; i >= 0; i--) {
    value += randomBetween(-1500, 2000);
    value = Math.max(value, 25000);
    data.push({
      time: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      value: Number(value.toFixed(2)),
    });
  }
  return data;
}

export function generateTokenChartData(): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  let value = 0.001;
  for (let i = 24; i >= 0; i--) {
    value *= (1 + randomBetween(-0.1, 0.12));
    value = Math.max(value, 0.0001);
    data.push({
      time: `${24 - i}:00`,
      value: Number(value.toFixed(8)),
      volume: Number(randomBetween(10000, 500000).toFixed(0)),
    });
  }
  return data;
}

export { shortAddress, randomBetween, randomFromArray };
