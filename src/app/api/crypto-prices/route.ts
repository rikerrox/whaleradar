import { NextResponse } from 'next/server';

// In-memory cache for crypto prices (60 second TTL)
let cachedPrices: { prices: Record<string, { price: number; change24h: number }>; timestamp: number } | null = null;
const CACHE_TTL = 60_000; // 60 seconds

const COIN_IDS = [
  'solana', 'dogwifhat', 'bonk', 'pepe', 'floki', 'dogecoin',
  'shiba-inu', 'book-of-meme', 'goatseus-maximus', 'neiro'
];

const SYMBOL_MAP: Record<string, string> = {
  'SOL': 'solana',
  'WIF': 'dogwifhat',
  'BONK': 'bonk',
  'PEPE': 'pepe',
  'FLOKI': 'floki',
  'DOGE': 'dogecoin',
  'SHIB': 'shiba-inu',
  'BOME': 'book-of-meme',
  'GOAT': 'goatseus-maximus',
  'NEIRO': 'neiro',
};

// Fallback prices in case API fails (updated from CoinGecko, March 2025)
const FALLBACK_PRICES: Record<string, { price: number; change24h: number }> = {
  'SOL': { price: 86, change24h: 1.7 },
  'WIF': { price: 0.45, change24h: 3.5 },
  'BONK': { price: 0.0000061, change24h: 2.6 },
  'PEPE': { price: 0.00000364, change24h: 0.8 },
  'FLOKI': { price: 0.00002998, change24h: 3.6 },
  'DOGE': { price: 0.103, change24h: 1.5 },
  'SHIB': { price: 0.00000567, change24h: -0.01 },
  'BOME': { price: 0.000547, change24h: -2.1 },
  'GOAT': { price: 0.01739, change24h: 1.7 },
  'NEIRO': { price: 0.0000976, change24h: 4.5 },
};

async function fetchCryptoPrices() {
  const ids = COIN_IDS.join(',');
  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
    { next: { revalidate: 60 } }
  );
  if (!res.ok) throw new Error('CoinGecko API failed');
  const data = await res.json();

  const prices: Record<string, { price: number; change24h: number }> = {};

  for (const [symbol, coinId] of Object.entries(SYMBOL_MAP)) {
    if (data[coinId]) {
      prices[symbol] = {
        price: data[coinId].usd,
        change24h: data[coinId].usd_24h_change || 0,
      };
    }
  }

  return prices;
}

export async function GET() {
  try {
    // Return cached prices if still valid
    if (cachedPrices && Date.now() - cachedPrices.timestamp < CACHE_TTL) {
      return NextResponse.json({
        prices: cachedPrices.prices,
        source: 'cache',
      });
    }

    try {
      const prices = await fetchCryptoPrices();
      cachedPrices = { prices, timestamp: Date.now() };
      return NextResponse.json({
        prices,
        source: 'coingecko',
      });
    } catch {
      // Return cached prices even if expired, or fallback
      if (cachedPrices) {
        return NextResponse.json({
          prices: cachedPrices.prices,
          source: 'cache-expired',
        });
      }
      return NextResponse.json({
        prices: FALLBACK_PRICES,
        source: 'fallback',
      });
    }
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch crypto prices' },
      { status: 500 }
    );
  }
}
