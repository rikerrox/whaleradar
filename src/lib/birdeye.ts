/**
 * Birdeye API client for whale tracking and market data
 * Docs: https://docs.birdeye.so/
 */

const BIRDEYE_API = 'https://public-api.birdeye.so';
const API_KEY = process.env.BIRDEYE_API_KEY || '';

const headers = {
  'X-API-KEY': API_KEY,
  'x-chain': 'solana',
  'Accept': 'application/json',
};

export interface WhaleTrade {
  txHash: string;
  from: string;
  to: string;
  tokenSymbol: string;
  tokenAddress: string;
  amount: number;
  usdValue: number;
  type: 'buy' | 'sell';
  timestamp: Date;
}

export interface TokenOverview {
  address: string;
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  liquidity: number;
  holderCount: number;
  trade24h: number;
  buy24h: number;
  sell24h: number;
}

/**
 * Get token overview (price, volume, liquidity, holders)
 */
export async function getTokenOverview(tokenAddress: string): Promise<TokenOverview | null> {
  if (!API_KEY) return null;
  try {
    const res = await fetch(`${BIRDEYE_API}/defi/token_overview?address=${tokenAddress}`, { headers });
    if (!res.ok) return null;
    const data = await res.json();
    const d = data?.data;
    if (!d) return null;
    return {
      address: tokenAddress,
      symbol: d.symbol || '',
      name: d.name || '',
      price: d.price || 0,
      priceChange24h: d.priceChange24h || 0,
      volume24h: d.volume24h || 0,
      marketCap: d.mc || 0,
      liquidity: d.liquidity || 0,
      holderCount: d.holder || 0,
      trade24h: d.trade24h || 0,
      buy24h: d.buy24h || 0,
      sell24h: d.sell24h || 0,
    };
  } catch {
    return null;
  }
}

/**
 * Get trending tokens on Solana
 */
export async function getTrendingTokens(): Promise<TokenOverview[]> {
  if (!API_KEY) return [];
  try {
    const res = await fetch(`${BIRDEYE_API}/defi/trending?sort_by=volume24hUSD&sort_type=desc&offset=0&limit=20`, { headers });
    if (!res.ok) return [];
    const data = await res.json();
    const tokens = data?.data?.tokens || data?.data || [];
    return tokens.map((t: any) => ({
      address: t.address || '',
      symbol: t.symbol || '',
      name: t.name || '',
      price: t.price || 0,
      priceChange24h: t.priceChange24h || 0,
      volume24h: t.volume24h || 0,
      marketCap: t.mc || 0,
      liquidity: t.liquidity || 0,
      holderCount: t.holder || 0,
      trade24h: t.trade24h || 0,
      buy24h: t.buy24h || 0,
      sell24h: t.sell2h || 0,
    }));
  } catch {
    return [];
  }
}

/**
 * Get recent large trades for a wallet (whale activity)
 */
export async function getWalletTrades(
  walletAddress: string,
  limit = 20
): Promise<WhaleTrade[]> {
  if (!API_KEY) return [];
  try {
    const res = await fetch(
      `${BIRDEYE_API}/v1/wallet/txs?wallet=${walletAddress}&limit=${limit}&tx_type=swap`,
      { headers }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const txs = data?.data?.items || [];
    return txs.map((tx: any) => ({
      txHash: tx.txHash || '',
      from: tx.from || '',
      to: tx.to || '',
      tokenSymbol: tx.tokenSymbol || '',
      tokenAddress: tx.tokenAddress || '',
      amount: tx.amount || 0,
      usdValue: tx.usdValue || 0,
      type: tx.type === 'buy' ? 'buy' as const : 'sell' as const,
      timestamp: new Date(tx.blockTime * 1000),
    }));
  } catch {
    return [];
  }
}

/**
 * Get large trades across Solana (whale detector)
 * Filters for trades above a minimum USD threshold
 */
export async function getLargeTrades(
  minUsdValue = 10000,
  limit = 50
): Promise<WhaleTrade[]> {
  if (!API_KEY) return [];
  try {
    const res = await fetch(
      `${BIRDEYE_API}/defi/txs/top?limit=${limit}&min_amount=${minUsdValue}`,
      { headers }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const txs = data?.data?.items || [];
    return txs
      .filter((tx: any) => tx && tx.txHash)
      .map((tx: any) => ({
        txHash: tx.txHash,
        from: tx.from || '',
        to: tx.to || '',
        tokenSymbol: tx.tokenSymbol || '',
        tokenAddress: tx.tokenAddress || '',
        amount: tx.amount || 0,
        usdValue: tx.usdValue || 0,
        type: tx.side === 'buy' ? 'buy' as const : 'sell' as const,
        timestamp: new Date((tx.blockTime || Date.now() / 1000) * 1000),
      }));
  } catch {
    return [];
  }
}
