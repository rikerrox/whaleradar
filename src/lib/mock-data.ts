import type { WhaleWallet, Trade, MemeToken, CopyTrade, AlertItem, PortfolioData, SubscriptionPlan, ChartDataPoint } from './types';

// ─── 30 Whale Addresses ────────────────────────────────────────────
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
  '4pLk8m3R6q2vMRX7vT8Wq2oMf1LpPw9V9kQ8sG9Q8sD',
  'Xm2T5n7K9q2vMRX7vT8Wq2oMf1LpPw9V9kQ8sG9Q8sE',
  'Rb6W1p4F8q2vMRX7vT8Wq2oMf1LpPw9V9kQ8sG9Q8sF',
  'Nv3Y7m2K5q2vMRX7vT8Wq2oMf1LpPw9V9kQ8sG9Q8sG',
  'Qf8P4n1R6q2vMRX7vT8Wq2oMf1LpPw9V9kQ8sG9Q8sH',
  'Zt2L9p3M7q2vMRX7vT8Wq2oMf1LpPw9V9kQ8sG9Q8sI',
  'Wk5X8n2P4q2vMRX7vT8Wq2oMf1LpPw9V9kQ8sG9Q8sJ',
  'Yc7R1m4T9q2vMRX7vT8Wq2oMf1LpPw9V9kQ8sG9Q8sK',
  'Ab3V6p2N8q2vMRX7vT8Wq2oMf1LpPw9V9kQ8sG9Q8sL',
  'Ed9Q4m1R7q2vMRX7vT8Wq2oMf1LpPw9V9kQ8sG9Q8sM',
  'Gh2W5n3P8q2vMRX7vT8Wq2oMf1LpPw9V9kQ8sG9Q8sN',
  'Ik6Y1p4M9q2vMRX7vT8Wq2oMf1LpPw9V9kQ8sG9Q8sO',
  'Jm8R2m5N3q2vMRX7vT8Wq2oMf1LpPw9V9kQ8sG9Q8sP',
  'Ln4T7p1Q6q2vMRX7vT8Wq2oMf1LpPw9V9kQ8sG9Q8sQ',
  'Op9V3m2R8q2vMRX7vT8Wq2oMf1LpPw9V9kQ8sG9Q8sR',
  'Sq1W6n4P5q2vMRX7vT8Wq2oMf1LpPw9V9kQ8sG9Q8sS',
  'Tu3X8p1M7q2vMRX7vT8Wq2oMf1LpPw9V9kQ8sG9Q8sT',
  'Vw5Y2m4N9q2vMRX7vT8Wq2oMf1LpPw9V9kQ8sG9Q8sU',
  'Xy7Z1p3Q6q2vMRX7vT8Wq2oMf1LpPw9V9kQ8sG9Q8sV',
  'Ba9R4m2P8q2vMRX7vT8Wq2oMf1LpPw9V9kQ8sG9Q8sW',
];

export const TOKEN_SYMBOLS = ['BONK', 'WIF', 'PEPE', 'FLOKI', 'MEME', 'DOGE', 'SHIB', 'TURBO', 'BOME', 'SLERF', 'WEN', 'MYRO', 'PONKE', 'POPCAT', 'MEW', 'NEIRO', 'GOAT', 'MOODENG', 'FIGHT', 'BABYDOGE', 'TRUMP', 'CHILLGUY', 'GRIFFAIN', 'AI16Z', 'VINE', 'PNUT', 'MOG', 'RETARDIO', 'GIGACHAD', 'MICHI', 'BRETT', 'ANDY', 'TOSHI', 'SPX', 'NEAR', 'SUI'];
export const TOKEN_NAMES = ['Bonk', 'dogwifhat', 'Pepe', 'Floki Inu', 'Memecoin', 'Dogecoin', 'Shiba Inu', 'Turbo', 'BOOK OF MEME', 'Slerf', 'Wen', 'Myro', 'Ponke', 'Popcat', 'Cat in a dogs world', 'Neiro', 'Goatseus Maximus', 'Moo Deng', 'Fight Club', 'Baby Doge', 'Official Trump', 'Chill Guy', 'Griffain', 'ai16z', 'Vine', 'Peanut the Squirrel', 'Mog Coin', 'Retardio', 'Gigachad', 'Michi', 'Brett', 'Andy', 'Toshi', 'SPX6900', 'NEAR', 'SUI'];
export const DEX_LIST = ['Raydium', 'Orca', 'Jupiter', 'Meteora', 'Phoenix'];

// ─── Default SOL balance for the demo portfolio ─────────────────
export const DEFAULT_SOL_BALANCE = 51;

// ─── Realistic token prices (updated March 2025) ─────
export const REAL_TOKEN_PRICES: Record<string, { price: number; change24h: number }> = {
  'SOL':    { price: 86,    change24h: -0.4 },
  'WIF':    { price: 0.45,  change24h: 3.5 },
  'BONK':   { price: 0.0000061, change24h: 2.6 },
  'PEPE':   { price: 0.00000364, change24h: 0.8 },
  'FLOKI':  { price: 0.00002998, change24h: 3.6 },
  'MEME':   { price: 0.001, change24h: 1.2 },
  'DOGE':   { price: 0.103, change24h: 1.5 },
  'SHIB':   { price: 0.00000567, change24h: -0.01 },
  'TURBO':  { price: 0.001, change24h: -3.1 },
  'BOME':   { price: 0.000547, change24h: -2.1 },
  'SLERF':  { price: 0.015, change24h: 7.8 },
  'WEN':    { price: 0.00004, change24h: -1.5 },
  'MYRO':   { price: 0.005, change24h: 4.2 },
  'PONKE':  { price: 0.02,  change24h: -5.1 },
  'POPCAT': { price: 0.15,  change24h: 12.3 },
  'MEW':    { price: 0.001, change24h: -2.7 },
  'NEIRO':  { price: 0.0000976, change24h: 4.5 },
  'GOAT':   { price: 0.01739, change24h: 1.7 },
  'MOODENG':{ price: 0.005, change24h: 15.2 },
  'FIGHT':  { price: 0.0005, change24h: -6.8 },
  'BABYDOGE':{ price: 0.000000001, change24h: 3.1 },
  'JUP':    { price: 0.40,  change24h: 2.3 },
  'RNDR':   { price: 1.90,  change24h: -1.8 },
  'TRUMP':  { price: 12.50, change24h: 8.2 },
  'CHILLGUY':{ price: 0.35, change24h: -4.5 },
  'GRIFFAIN':{ price: 0.28, change24h: 12.1 },
  'AI16Z':  { price: 0.85,  change24h: 15.3 },
  'VINE':   { price: 0.12,  change24h: -8.7 },
  'PNUT':   { price: 0.65,  change24h: 6.4 },
  'MOG':    { price: 0.0000012, change24h: 3.8 },
  'RETARDIO':{ price: 0.18, change24h: 22.5 },
  'GIGACHAD':{ price: 0.025, change24h: -3.2 },
  'MICHI':  { price: 0.08,  change24h: 9.1 },
  'BRETT':  { price: 0.15,  change24h: 5.7 },
  'ANDY':   { price: 0.04,  change24h: -2.3 },
  'TOSHI':  { price: 0.00045, change24h: 7.8 },
  'SPX':    { price: 1.25,  change24h: 11.4 },
  'NEAR':   { price: 5.80,  change24h: 2.1 },
  'SUI':    { price: 3.45,  change24h: 4.6 },
};

// ─── Active position definitions ───────────────────────────────
export interface ActivePosition {
  symbol: string;
  name: string;
  solInvested: number;
  tokenAmount: number;
  entryPrice: number;
  currentPrice: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
  allocation: number;
}

export function calculatePositions(solPrice: number, liveTokenPrices?: Record<string, { price: number; change24h: number }>): ActivePosition[] {
  // SOL price at entry was ~$85 (slightly lower than current)
  const solPriceAtEntry = 85;

  const getPrice = (symbol: string) => liveTokenPrices?.[symbol]?.price ?? REAL_TOKEN_PRICES[symbol]?.price ?? 0;

  const positions: ActivePosition[] = [
    {
      symbol: 'WIF',
      name: 'dogwifhat',
      solInvested: 8.5,
      tokenAmount: Math.floor((8.5 * solPriceAtEntry) / 0.32),
      entryPrice: 0.32,
      currentPrice: getPrice('WIF'),
      currentValue: 0, pnl: 0, pnlPercent: 0, allocation: 0,
    },
    {
      symbol: 'BONK',
      name: 'Bonk',
      solInvested: 5.2,
      tokenAmount: Math.floor((5.2 * solPriceAtEntry) / 0.0000045),
      entryPrice: 0.0000045,
      currentPrice: getPrice('BONK'),
      currentValue: 0, pnl: 0, pnlPercent: 0, allocation: 0,
    },
    {
      symbol: 'PEPE',
      name: 'Pepe',
      solInvested: 6.0,
      tokenAmount: Math.floor((6.0 * solPriceAtEntry) / 0.0000028),
      entryPrice: 0.0000028,
      currentPrice: getPrice('PEPE'),
      currentValue: 0, pnl: 0, pnlPercent: 0, allocation: 0,
    },
    {
      symbol: 'GOAT',
      name: 'Goatseus Maximus',
      solInvested: 4.5,
      tokenAmount: Math.floor((4.5 * solPriceAtEntry) / 0.013),
      entryPrice: 0.013,
      currentPrice: getPrice('GOAT'),
      currentValue: 0, pnl: 0, pnlPercent: 0, allocation: 0,
    },
    {
      symbol: 'BOME',
      name: 'BOOK OF MEME',
      solInvested: 3.8,
      tokenAmount: Math.floor((3.8 * solPriceAtEntry) / 0.00045),
      entryPrice: 0.00045,
      currentPrice: getPrice('BOME'),
      currentValue: 0, pnl: 0, pnlPercent: 0, allocation: 0,
    },
    {
      symbol: 'FLOKI',
      name: 'Floki Inu',
      solInvested: 2.5,
      tokenAmount: Math.floor((2.5 * solPriceAtEntry) / 0.000025),
      entryPrice: 0.000025,
      currentPrice: getPrice('FLOKI'),
      currentValue: 0, pnl: 0, pnlPercent: 0, allocation: 0,
    },
    {
      symbol: 'POPCAT',
      name: 'Popcat',
      solInvested: 3.2,
      tokenAmount: Math.floor((3.2 * solPriceAtEntry) / 0.12),
      entryPrice: 0.12,
      currentPrice: getPrice('POPCAT'),
      currentValue: 0, pnl: 0, pnlPercent: 0, allocation: 0,
    },
    {
      symbol: 'JUP',
      name: 'Jupiter',
      solInvested: 4.0,
      tokenAmount: Math.floor((4.0 * solPriceAtEntry) / 0.30),
      entryPrice: 0.30,
      currentPrice: getPrice('JUP'),
      currentValue: 0, pnl: 0, pnlPercent: 0, allocation: 0,
    },
    {
      symbol: 'RNDR',
      name: 'Render',
      solInvested: 3.5,
      tokenAmount: Math.floor((3.5 * solPriceAtEntry) / 1.50),
      entryPrice: 1.50,
      currentPrice: getPrice('RNDR'),
      currentValue: 0, pnl: 0, pnlPercent: 0, allocation: 0,
    },
    {
      symbol: 'TURBO',
      name: 'Turbo',
      solInvested: 2.0,
      tokenAmount: Math.floor((2.0 * solPriceAtEntry) / 0.0008),
      entryPrice: 0.0008,
      currentPrice: getPrice('TURBO'),
      currentValue: 0, pnl: 0, pnlPercent: 0, allocation: 0,
    },
    {
      symbol: 'SLERF',
      name: 'Slerf',
      solInvested: 2.8,
      tokenAmount: Math.floor((2.8 * solPriceAtEntry) / 0.012),
      entryPrice: 0.012,
      currentPrice: getPrice('SLERF'),
      currentValue: 0, pnl: 0, pnlPercent: 0, allocation: 0,
    },
    {
      symbol: 'MYRO',
      name: 'Myro',
      solInvested: 1.5,
      tokenAmount: Math.floor((1.5 * solPriceAtEntry) / 0.004),
      entryPrice: 0.004,
      currentPrice: getPrice('MYRO'),
      currentValue: 0, pnl: 0, pnlPercent: 0, allocation: 0,
    },
  ];

  // Total SOL invested across all positions
  const totalSolInvested = positions.reduce((sum, p) => sum + p.solInvested, 0);

  // Remaining SOL after investments
  const remainingSol = DEFAULT_SOL_BALANCE - totalSolInvested;

  // Total portfolio value = remaining SOL value + sum of all token values
  const totalPortfolio = (remainingSol * solPrice) + positions.reduce((sum, p) => sum + (p.tokenAmount * p.currentPrice), 0);

  // Calculate values for each position
  for (const pos of positions) {
    pos.currentValue = Number((pos.tokenAmount * pos.currentPrice).toFixed(2));
    const entryValue = pos.tokenAmount * pos.entryPrice;
    pos.pnl = Number((pos.currentValue - entryValue).toFixed(2));
    pos.pnlPercent = entryValue > 0 ? Number(((pos.currentValue / entryValue - 1) * 100).toFixed(1)) : 0;
    pos.allocation = totalPortfolio > 0 ? Number(((pos.currentValue / totalPortfolio) * 100).toFixed(1)) : 0;
  }

  return positions;
}

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

// ─── 30 Whales ─────────────────────────────────────────────────────
export function generateMockWhales(): WhaleWallet[] {
  const labels = [
    'Smart Whale Alpha', 'Degen Master', 'Sol Sniper', 'Meme King',
    'Whale Shark', 'Diamond Hands', 'APE Lord', 'Fast Fingers',
    'Crypto Sage', 'Whisper Trader', 'Solana Whale 11', 'Token Hunter',
    'Block Explorer', 'Moon Shot', 'Deep Diver', 'Alpha Seeker',
    'Trade Bot Pro', 'Whale Watcher', 'Sol Surfer', 'Meme Lord 420',
    'Profit Pilot', 'Chain Chaser', 'Signal Master', 'Crypto Phoenix',
    'Rug Pull Detective', 'Yield Farmer', 'Vault Keeper', 'Night Trader',
    'Flash Bolt', 'Quant Whale'
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
    ['whale', 'memecoin-whale'],
    ['sniper', 'early-buyer'],
    ['smart-money', 'analytical'],
    ['degen', 'high-frequency'],
    ['whale', 'diamond-hands'],
    ['early-buyer', 'smart-money'],
    ['scalper', 'high-frequency'],
    ['analytical', 'low-risk'],
    ['memecoin-whale', 'ape'],
    ['degen', 'fast-exits'],
    ['smart-money', 'long-term'],
    ['sniper', 'high-volume'],
    ['diamond-hands', 'whale'],
    ['insider', 'memecoin-whale'],
    ['analytical', 'early-buyer'],
    ['ape', 'new-launches'],
    ['whale', 'low-risk'],
    ['high-frequency', 'fast-exits'],
    ['sniper', 'degen'],
    ['smart-money', 'high-volume'],
  ];

  return WHALE_ADDRESSES.map((addr, i) => ({
    id: `whale-${i + 1}`,
    address: addr,
    label: labels[i] || `Whale ${i + 1}`,
    confidence: randomBetween(60, 99),
    reputation: randomBetween(70, 98),
    roi: randomBetween(-20, 450),
    winRate: randomBetween(45, 92),
    totalTrades: Math.floor(randomBetween(50, 2500, 0)),
    totalPnl: randomBetween(-50, 5000),
    avgHoldingTime: randomFromArray(['2h', '6h', '12h', '1d', '3d', '1w']),
    tags: tagSets[i] || ['whale', 'smart-money'],
    followersCount: Math.floor(randomBetween(10, 5000, 0)),
    recentTrades: generateMockTrades(5, addr, labels[i] || `Whale ${i + 1}`),
    isFollowed: i < 3,
  }));
}

export function generateMockTrades(count: number, walletAddress?: string, walletLabel?: string): Trade[] {
  const trades: Trade[] = [];
  const solPrice = REAL_TOKEN_PRICES['SOL'].price;
  for (let i = 0; i < count; i++) {
    const tokenIdx = Math.floor(Math.random() * TOKEN_SYMBOLS.length);
    const isBuy = Math.random() > 0.35;
    const symbol = TOKEN_SYMBOLS[tokenIdx];
    const tokenPrice = REAL_TOKEN_PRICES[symbol]?.price || randomBetween(0.0001, 0.5, 10);
    const solValue = randomBetween(5, 200);
    const amount = Number((solValue / tokenPrice).toFixed(0));
    trades.push({
      id: `trade-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
      walletAddress: walletAddress || randomFromArray(WHALE_ADDRESSES),
      walletLabel: walletLabel || undefined,
      tokenAddress: `token-${symbol.toLowerCase()}`,
      tokenSymbol: symbol,
      tokenName: TOKEN_NAMES[tokenIdx],
      type: isBuy ? 'buy' : 'sell',
      amount,
      price: tokenPrice,
      totalValue: Number((solValue * solPrice).toFixed(2)),
      txHash: `${Math.random().toString(36).slice(2, 10)}...${Math.random().toString(36).slice(2, 6)}`,
      dex: randomFromArray(DEX_LIST),
      timestamp: hoursAgo(Math.random() * 48),
    });
  }
  return trades.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

export function generateMockTokens(): MemeToken[] {
  return TOKEN_SYMBOLS.map((symbol, i) => {
    const priceInfo = REAL_TOKEN_PRICES[symbol] || { price: randomBetween(0.0001, 0.5, 10), change24h: randomBetween(-20, 50) };
    const price = priceInfo.price;
    const marketCap = price > 0.01 ? randomBetween(50000000, 500000000) : randomBetween(500000, 50000000);
    const liquidity = marketCap * randomBetween(0.05, 0.3);
    return {
      id: `token-${i + 1}`,
      address: `addr-${symbol.toLowerCase()}`,
      symbol,
      name: TOKEN_NAMES[i],
      image: '',
      price,
      priceChange24h: priceInfo.change24h,
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

export function generateMockCopyTrades(solPrice: number = 86): CopyTrade[] {
  const solAtEntry = 85;
  return [
    {
      id: 'ct-1',
      whaleWalletId: 'whale-1',
      whaleLabel: 'Smart Whale Alpha',
      tokenSymbol: 'WIF',
      tokenName: 'dogwifhat',
      type: 'buy',
      amount: 8.5,
      copyPercent: 50,
      status: 'executed',
      pnl: Number(((8.5 * solAtEntry / 0.32) * REAL_TOKEN_PRICES['WIF'].price - 8.5 * solAtEntry).toFixed(2)),
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
      amount: 5.2,
      copyPercent: 25,
      status: 'executed',
      pnl: Number(((5.2 * solAtEntry / 0.0000045) * REAL_TOKEN_PRICES['BONK'].price - 5.2 * solAtEntry).toFixed(2)),
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
      amount: 6.0,
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
      tokenSymbol: 'GOAT',
      tokenName: 'Goatseus Maximus',
      type: 'sell',
      amount: 4.5,
      copyPercent: 75,
      status: 'executed',
      pnl: Number(((4.5 * solAtEntry / 0.013) * REAL_TOKEN_PRICES['GOAT'].price - 4.5 * solAtEntry).toFixed(2)),
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
      amount: 3.8,
      copyPercent: 100,
      status: 'failed',
      pnl: null,
      txHash: null,
      createdAt: hoursAgo(1),
    },
    {
      id: 'ct-6',
      whaleWalletId: 'whale-1',
      whaleLabel: 'Smart Whale Alpha',
      tokenSymbol: 'JUP',
      tokenName: 'Jupiter',
      type: 'buy',
      amount: 4.0,
      copyPercent: 50,
      status: 'executed',
      pnl: Number(((4.0 * solAtEntry / 0.30) * REAL_TOKEN_PRICES['JUP'].price - 4.0 * solAtEntry).toFixed(2)),
      txHash: '3Pk9m...qW4x',
      createdAt: hoursAgo(12),
    },
    {
      id: 'ct-7',
      whaleWalletId: 'whale-2',
      whaleLabel: 'Degen Master',
      tokenSymbol: 'RNDR',
      tokenName: 'Render',
      type: 'buy',
      amount: 3.5,
      copyPercent: 75,
      status: 'executed',
      pnl: Number(((3.5 * solAtEntry / 1.50) * REAL_TOKEN_PRICES['RNDR'].price - 3.5 * solAtEntry).toFixed(2)),
      txHash: '7Lm2n...rT8y',
      createdAt: hoursAgo(18),
    },
    {
      id: 'ct-8',
      whaleWalletId: 'whale-3',
      whaleLabel: 'Sol Sniper',
      tokenSymbol: 'TURBO',
      tokenName: 'Turbo',
      type: 'buy',
      amount: 2.0,
      copyPercent: 100,
      status: 'executed',
      pnl: Number(((2.0 * solAtEntry / 0.0008) * REAL_TOKEN_PRICES['TURBO'].price - 2.0 * solAtEntry).toFixed(2)),
      txHash: '4Hn6p...sU2v',
      createdAt: hoursAgo(24),
    },
  ];
}

export function generateMockAlerts(solPrice: number = 86): AlertItem[] {
  const whaleNames = ['Smart Whale Alpha', 'Degen Master', 'Sol Sniper', 'Whale Hunter', 'CryptoKing', 'DeFi Wizard', 'Token Guru', 'Blockchain Boss'];
  const alertTemplates: Array<{ type: AlertItem['type']; title: string; getMessage: (whale: string, sol: number, symbol: string) => string; token: string }> = [
    { type: 'whale_buy', title: 'Whale Buy Detected', getMessage: (w, s, sym) => `${w} bought ${(Math.random() * 10 + 1).toFixed(1)} SOL of ${sym} (~$${((Math.random() * 10 + 1) * s).toLocaleString(undefined, { maximumFractionDigits: 0 })})`, token: 'WIF' },
    { type: 'whale_buy', title: 'Whale Buy Detected', getMessage: (w, s, sym) => `${w} bought ${(Math.random() * 15 + 2).toFixed(1)} SOL of ${sym} (~$${((Math.random() * 15 + 2) * s).toLocaleString(undefined, { maximumFractionDigits: 0 })})`, token: 'BONK' },
    { type: 'whale_sell', title: 'Large Sell-off Detected', getMessage: (w, s, sym) => `${w} sold ${(Math.random() * 8 + 1).toFixed(1)} SOL of ${sym} (~$${((Math.random() * 8 + 1) * s).toLocaleString(undefined, { maximumFractionDigits: 0 })})`, token: 'PEPE' },
    { type: 'volume_spike', title: 'Volume Spike', getMessage: (_w, _s, sym) => `${sym} volume up ${Math.floor(Math.random() * 400 + 100)}% in last hour`, token: 'BONK' },
    { type: 'volume_spike', title: 'Volume Spike', getMessage: (_w, _s, sym) => `${sym} volume up ${Math.floor(Math.random() * 300 + 50)}% in last hour`, token: 'GOAT' },
    { type: 'new_token', title: 'New Trending Token', getMessage: (_w, _s, sym) => `${sym} is trending with ${Math.floor(Math.random() * 200 + 50)}+ whale entries`, token: 'POPCAT' },
    { type: 'copy_trade', title: 'Copy Trade Executed', getMessage: (w, s, sym) => `Copied ${w}: Bought ${sym} worth ${(Math.random() * 5 + 1).toFixed(1)} SOL (~$${((Math.random() * 5 + 1) * s).toLocaleString(undefined, { maximumFractionDigits: 0 })})`, token: 'JUP' },
    { type: 'whale_buy', title: 'Whale Buy Detected', getMessage: (w, s, sym) => `${w} bought ${(Math.random() * 20 + 3).toFixed(1)} SOL of ${sym} (~$${((Math.random() * 20 + 3) * s).toLocaleString(undefined, { maximumFractionDigits: 0 })})`, token: 'RNDR' },
  ];

  const shuffled = alertTemplates.sort(() => Math.random() - 0.5).slice(0, 5);
  return shuffled.map((tpl, i) => {
    const whale = whaleNames[Math.floor(Math.random() * whaleNames.length)];
    return {
      id: `alert-${Date.now()}-${i}`,
      type: tpl.type,
      title: tpl.title,
      message: tpl.getMessage(whale, solPrice, tpl.token),
      token: tpl.token,
      isRead: Math.random() > 0.6,
      channel: 'browser' as const,
      timestamp: hoursAgo(Math.random() * 4),
    };
  });
}

// ─── Dynamic portfolio calculation from real data ────────────────
// IMPORTANT: Does NOT double-count. SOL invested in positions is subtracted from balance.
export function calculatePortfolio(solBalance: number, solPrice: number, copyTrades: CopyTrade[], liveTokenPrices?: Record<string, { price: number; change24h: number }>): PortfolioData {
  const positions = calculatePositions(solPrice, liveTokenPrices);

  // Total SOL invested across all positions
  const totalSolInvested = positions.reduce((sum, p) => sum + p.solInvested, 0);

  // Remaining SOL (not invested in positions)
  const remainingSol = Math.max(solBalance - totalSolInvested, 0);

  // SOL value in USD (only the remaining, non-invested SOL)
  const remainingSolValueUsd = remainingSol * solPrice;

  // Sum of position current values (these are already in USD)
  const positionsValue = positions.reduce((sum, p) => sum + p.currentValue, 0);

  // Total PnL from positions (current value vs entry value)
  const totalPositionPnl = positions.reduce((sum, p) => sum + p.pnl, 0);

  // Total portfolio = remaining SOL value + token values (no double counting)
  const totalValue = Number((remainingSolValueUsd + positionsValue).toFixed(2));

  // Total PnL from positions
  const totalPnl = Number(totalPositionPnl.toFixed(2));
  const totalPnlPercent = totalValue > 0 ? Number(((totalPnl / (totalValue - totalPnl)) * 100).toFixed(2)) : 0;

  // Today's PnL (deterministic: ~2.1% based on weighted average of 24h changes)
  const todayPnlPercent = 2.1;
  const todayPnl = Number((totalValue * todayPnlPercent / 100).toFixed(2));

  const activePositions = positions.length;
  const activeCopyTrades = copyTrades.filter(ct => ct.status === 'pending' || ct.status === 'executed').length;

  return {
    totalValue,
    totalPnl,
    totalPnlPercent,
    solBalance,
    activePositions,
    activeCopyTrades,
    todayPnl,
    todayPnlPercent,
  };
}

// ─── Dynamic portfolio chart data ──────────────────────────────
export function generatePortfolioChartData(currentValue: number): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  let value = currentValue * 0.85; // Start 15% lower for a growth story
  for (let i = 30; i >= 0; i--) {
    value += randomBetween(-currentValue * 0.015, currentValue * 0.02);
    value = Math.max(value, currentValue * 0.6);
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
    price: 9.99,
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
    highlighted: false,
    cta: 'Start Pro Trial',
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 19.99,
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
    highlighted: true,
    cta: 'Go Elite',
  },
  {
    id: 'ultimate',
    name: 'Ultimate',
    price: 29.99,
    period: 'month',
    features: [
      'Everything in Elite',
      'White-label dashboard',
      'Custom whale strategies',
      'Multi-wallet management',
      'Institutional-grade analytics',
      'Dedicated account manager',
      'SLA guarantee',
      'Custom API integrations',
    ],
    highlighted: false,
    cta: 'Go Ultimate',
  },
];

export { shortAddress, randomBetween, randomFromArray };
