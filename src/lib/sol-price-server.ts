/**
 * Server-side SOL price helper.
 * Fetches from CoinGecko with 60s in-memory cache.
 * Used by API routes that need a real-time SOL/USD price.
 */

let cached: { price: number; updatedAt: number } | null = null;
const CACHE_TTL = 300_000; // 5 minutes

export async function getSolPrice(): Promise<number> {
  const now = Date.now();

  if (cached && now - cached.updatedAt < CACHE_TTL) {
    return cached.price;
  }

  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd',
      { next: { revalidate: 60 } }
    );

    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);

    const data = await res.json();
    const price = data?.solana?.usd;

    if (typeof price !== 'number' || price <= 0) {
      throw new Error('Invalid price data');
    }

    cached = { price, updatedAt: now };
    return price;
  } catch (err) {
    console.error('Server SOL price fetch failed:', err);
    // Return stale cache or conservative fallback
    return cached?.price ?? 86;
  }
}
