import { NextResponse } from 'next/server';

// Server-side cache for SOL price (refresh every 30 seconds)
let cachedSolPrice: number | null = null;
let cachedSolChange24h: number | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 30_000; // 30 seconds

interface CoinGeckoResponse {
  solana?: {
    usd: number;
    usd_24h_change: number;
  };
}

interface BirdeyeResponse {
  data?: {
    price: number;
    priceChange24h: number;
  };
}

async function fetchFromCoinGecko(): Promise<{ price: number; change24h: number } | null> {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true',
      { next: { revalidate: 30 } }
    );
    if (!res.ok) return null;
    const data: CoinGeckoResponse = await res.json();
    if (data.solana?.usd) {
      return {
        price: data.solana.usd,
        change24h: data.solana.usd_24h_change || 0,
      };
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchFromBirdeye(): Promise<{ price: number; change24h: number } | null> {
  try {
    const res = await fetch(
      'https://public-api.birdeye.so/defi/price?address=So11111111111111111111111111111111111111112',
      {
        headers: { 'X-API-KEY': 'public' },
        next: { revalidate: 30 },
      }
    );
    if (!res.ok) return null;
    const data: BirdeyeResponse = await res.json();
    if (data.data?.price) {
      return {
        price: data.data.price,
        change24h: data.data.priceChange24h || 0,
      };
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchFromDexScreener(): Promise<{ price: number; change24h: number } | null> {
  try {
    // DexScreener SOL/USDC pair on Raydium
    const res = await fetch(
      'https://api.dexscreener.com/latest/dex/tokens/So11111111111111111111111111111111111111112',
      { next: { revalidate: 30 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const pair = data.pairs?.[0];
    if (pair?.priceUsd) {
      return {
        price: parseFloat(pair.priceUsd),
        change24h: pair.priceChange?.h24 || 0,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET() {
  const now = Date.now();

  // Return cached price if still fresh
  if (cachedSolPrice !== null && now - lastFetchTime < CACHE_DURATION) {
    return NextResponse.json({
      data: {
        price: cachedSolPrice,
        change24h: cachedSolChange24h,
        source: 'cache',
        lastUpdated: lastFetchTime,
      },
    });
  }

  // Try multiple sources in order of reliability
  let result = await fetchFromCoinGecko();
  if (!result) result = await fetchFromDexScreener();
  if (!result) result = await fetchFromBirdeye();

  if (result) {
    cachedSolPrice = result.price;
    cachedSolChange24h = result.change24h;
    lastFetchTime = now;

    return NextResponse.json({
      data: {
        price: result.price,
        change24h: result.change24h,
        source: 'live',
        lastUpdated: now,
      },
    });
  }

  // If all sources fail, return cached value or fallback
  if (cachedSolPrice !== null) {
    return NextResponse.json({
      data: {
        price: cachedSolPrice,
        change24h: cachedSolChange24h,
        source: 'cache-stale',
        lastUpdated: lastFetchTime,
      },
    });
  }

  // Absolute fallback — clearly mark as estimate
  return NextResponse.json({
    data: {
      price: 85,
      change24h: 0,
      source: 'fallback',
      lastUpdated: 0,
    },
  });
}
