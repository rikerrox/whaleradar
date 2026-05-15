import { NextResponse } from 'next/server';

// Cache SOL price for 60 seconds to avoid rate-limiting
let cachedPrice: { price: number; change24h: number; updatedAt: number } | null = null;
const CACHE_TTL = 300_000; // 5 minutes (avoid CoinGecko rate limits)

export async function GET() {
  const now = Date.now();

  // Return cached price if still fresh
  if (cachedPrice && now - cachedPrice.updatedAt < CACHE_TTL) {
    return NextResponse.json({
      price: cachedPrice.price,
      change24h: cachedPrice.change24h,
      source: 'cache',
    });
  }

  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true',
      { next: { revalidate: 60 } }
    );

    if (!res.ok) {
      throw new Error(`CoinGecko responded ${res.status}`);
    }

    const data = await res.json();
    const price = data?.solana?.usd;
    const change24h = data?.solana?.usd_24h_change;

    if (typeof price !== 'number' || price <= 0) {
      throw new Error('Invalid price data');
    }

    cachedPrice = { price, change24h: change24h ?? 0, updatedAt: now };

    return NextResponse.json({
      price,
      change24h: change24h ?? 0,
      source: 'coingecko',
    });
  } catch (error) {
    console.error('SOL price fetch failed:', error);

    // Return stale cache if available, otherwise fallback
    if (cachedPrice) {
      return NextResponse.json({
        price: cachedPrice.price,
        change24h: cachedPrice.change24h,
        source: 'stale-cache',
      });
    }

    return NextResponse.json({
      price: 86, // conservative fallback
      change24h: 0,
      source: 'fallback',
    });
  }
}
