import { NextResponse } from 'next/server';

// In-memory cache for crypto prices (60 second TTL)
let cachedPrices: { prices: Record<string, { price: number; change24h: number }>; timestamp: number } | null = null;
const CACHE_TTL = 60_000; // 60 seconds

const COIN_IDS = [
  'solana', 'dogwifcoin', 'bonk', 'pepe', 'floki', 'dogecoin',
  'shiba-inu', 'book-of-meme', 'goatseus-maximus', 'neiro',
  'turbo', 'slerf', 'wen-2', 'myro', 'ponke', 'popcat',
  'cat-in-a-dogs-world', 'moo-deng', 'jupiter-exchange-solana', 'render-token',
  'memecoin-5', 'baby-doge-coin', 'fight-2',
];

const SYMBOL_MAP: Record<string, string> = {
  'SOL': 'solana',
  'WIF': 'dogwifcoin',
  'BONK': 'bonk',
  'PEPE': 'pepe',
  'FLOKI': 'floki',
  'DOGE': 'dogecoin',
  'SHIB': 'shiba-inu',
  'BOME': 'book-of-meme',
  'GOAT': 'goatseus-maximus',
  'NEIRO': 'neiro',
  'TURBO': 'turbo',
  'SLERF': 'slerf',
  'WEN': 'wen-2',
  'MYRO': 'myro',
  'PONKE': 'ponke',
  'POPCAT': 'popcat',
  'MEW': 'cat-in-a-dogs-world',
  'MOODENG': 'moo-deng',
  'JUP': 'jupiter-exchange-solana',
  'RNDR': 'render-token',
  'MEME': 'memecoin-5',
  'BABYDOGE': 'baby-doge-coin',
  'FIGHT': 'fight-2',
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
  'TURBO': { price: 0.001, change24h: -3.1 },
  'SLERF': { price: 0.015, change24h: 7.8 },
  'WEN': { price: 0.00004, change24h: -1.5 },
  'MYRO': { price: 0.005, change24h: 4.2 },
  'PONKE': { price: 0.02, change24h: -5.1 },
  'POPCAT': { price: 0.15, change24h: 12.3 },
  'MEW': { price: 0.001, change24h: -2.7 },
  'MOODENG': { price: 0.005, change24h: 15.2 },
  'JUP': { price: 0.40, change24h: 2.3 },
  'RNDR': { price: 1.90, change24h: -1.8 },
  'MEME': { price: 0.001, change24h: 1.2 },
  'BABYDOGE': { price: 0.000000001, change24h: 3.1 },
  'FIGHT': { price: 0.0005, change24h: -6.8 },
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
