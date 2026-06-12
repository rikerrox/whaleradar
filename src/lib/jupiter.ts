/**
 * Jupiter Aggregator API for Solana token swaps
 * Docs: https://docs.jup.ag/docs/apis/swap-api
 */

import {
  Connection,
  PublicKey,
  Transaction,
  VersionedTransaction,
  TransactionMessage,
} from '@solana/web3.js';

const JUPITER_API = 'https://quote-api.jup.ag/v6';
const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.mainnet-beta.solana.com';

// Well-known Solana token mints
export const TOKEN_MINTS: Record<string, string> = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  WIF: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
  PEPE: 'Df6yfrKC8kZE3KNkrHERKzAetSxbrWeniQfyJY4Jpump',
  GOAT: 'CzLSujWBLFsSjncJ1jknaMgnyzEW7BdkYd6gRcEiV24g',
  BOME: 'ukHH6cRDm1R2FbVWKADqZj3wYM7PFLJe4iXz6CkuBdR',
  FLOKI: 'KEoKpLhF5nNwco3TbMHfNPxL9gL3dD6dJQqz5JxZ4vZ',
  POPCAT: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr',
  JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  RNDR: 'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof',
  TURBO: '2qEHjDLDLbuBgRYvsxhc5D6uDWAivNFZGan56P1tpump',
  MYRO: '7BgBvyjrZX1YKz4oh9mjb8ZScatkkwb8DzFx7LoiVkM3',
  SLERF: '7BgBvyjrZX1YKz4oh9mjb8ZScatkkwb8DzFx7LoiVkM3',
};

interface JupiterQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: number;
  routePlan: any[];
}

/**
 * Get a swap quote from Jupiter
 */
export async function getSwapQuote(
  inputMint: string,
  outputMint: string,
  amount: number, // in base units (lamports for SOL)
  slippageBps = 50
): Promise<JupiterQuote | null> {
  try {
    const params = new URLSearchParams({
      inputMint,
      outputMint,
      amount: Math.floor(amount).toString(),
      slippageBps: slippageBps.toString(),
      swapMode: 'ExactIn',
    });

    const res = await fetch(`${JUPITER_API}/quote?${params}`);
    if (!res.ok) {
      console.error('Jupiter quote error:', res.status, await res.text());
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error('Failed to get Jupiter quote:', err);
    return null;
  }
}

/**
 * Get swap transaction from Jupiter
 * Returns a serialized transaction that the user must sign
 */
export async function getSwapTransaction(
  quote: JupiterQuote,
  userPublicKey: string
): Promise<string | null> {
  try {
    const res = await fetch(`${JUPITER_API}/swap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quoteResponse: quote,
        userPublicKey,
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: 'auto',
      }),
    });

    if (!res.ok) {
      console.error('Jupiter swap error:', res.status, await res.text());
      return null;
    }

    const data = await res.json();
    return data.swapTransaction || null;
  } catch (err) {
    console.error('Failed to get swap transaction:', err);
    return null;
  }
}

/**
 * Execute a swap: get quote → get transaction → send to wallet for signing
 * Returns the transaction signature after user signs
 */
export async function executeSwap(
  inputMint: string,
  outputMint: string,
  amountInLamports: number,
  userPublicKey: string,
  wallet: { signTransaction: (tx: VersionedTransaction) => Promise<VersionedTransaction> }
): Promise<{ signature: string; outputAmount: number } | null> {
  // 1. Get quote
  const quote = await getSwapQuote(inputMint, outputMint, amountInLamports);
  if (!quote) return null;

  // 2. Get serialized transaction
  const swapTxB64 = await getSwapTransaction(quote, userPublicKey);
  if (!swapTxB64) return null;

  // 3. Deserialize, sign, and send
  const connection = new Connection(RPC_URL, 'confirmed');
  const txBuf = Buffer.from(swapTxB64, 'base64');
  const tx = VersionedTransaction.deserialize(txBuf);

  // 4. Sign with wallet
  const signedTx = await wallet.signTransaction(tx);

  // 5. Send
  const signature = await connection.sendRawTransaction(signedTx.serialize(), {
    skipPreflight: true,
    maxRetries: 3,
  });

  // 6. Confirm
  const latestBlockhash = await connection.getLatestBlockhash();
  await connection.confirmTransaction(
    {
      signature,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    },
    'confirmed'
  );

  return {
    signature,
    outputAmount: parseInt(quote.outAmount),
  };
}
