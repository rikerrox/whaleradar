/**
 * Helius API client for enhanced Solana data
 * Docs: https://docs.helius.dev/
 */

import { Connection, PublicKey } from '@solana/web3.js';

const HELIUS_API = 'https://api.helius.xyz/v0';
const API_KEY = process.env.HELIUS_API_KEY || '';
const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.mainnet-beta.solana.com';

export interface HeliusWebhookData {
  transactions: Array<{
    signature: string;
    type: string;
    timestamp: number;
    tokenTransfers: Array<{
      fromTokenAccount: string;
      toTokenAccount: string;
      fromUserAccount: string;
      toUserAccount: string;
      tokenAmount: number;
      mint: string;
    }>;
    nativeTransfers: Array<{
      fromUserAccount: string;
      toUserAccount: string;
      amount: number;
    }>;
  }>;
}

/**
 * Parse enriched transaction data from Helius
 */
export function parseHeliusTransaction(tx: HeliusWebhookData['transactions'][0]) {
  const swaps = tx.tokenTransfers.map((transfer) => ({
    from: transfer.fromUserAccount,
    to: transfer.toUserAccount,
    mint: transfer.mint,
    amount: transfer.tokenAmount,
  }));

  const nativeSwaps = tx.nativeTransfers.map((transfer) => ({
    from: transfer.fromUserAccount,
    to: transfer.toUserAccount,
    lamports: transfer.amount,
    sol: transfer.amount / 1_000_000_000,
  }));

  return {
    signature: tx.signature,
    type: tx.type,
    timestamp: tx.timestamp,
    swaps,
    nativeSwaps,
  };
}

/**
 * Get recent transactions for a wallet using Helius enhanced API
 */
export async function getWalletTransactions(
  walletAddress: string,
  limit = 10
): Promise<any[]> {
  if (!API_KEY) {
    // Fallback to basic Solana RPC
    try {
      const connection = new Connection(RPC_URL, 'confirmed');
      const pubKey = new PublicKey(walletAddress);
      const signatures = await connection.getConfirmedSignaturesForAddress2(pubKey, { limit });
      return signatures.map((sig) => ({
        signature: sig.signature,
        timestamp: sig.blockTime ? new Date(sig.blockTime * 1000) : new Date(),
        err: sig.err,
      }));
    } catch {
      return [];
    }
  }

  try {
    const res = await fetch(`${HELIUS_API}/addresses/${walletAddress}/transactions?api-key=${API_KEY}&limit=${limit}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data || [];
  } catch {
    return [];
  }
}

/**
 * Get token balances for a wallet
 */
export async function getTokenBalances(walletAddress: string) {
  if (!API_KEY) return [];
  try {
    const res = await fetch(`${HELIUS_API}/token-metadata?api-key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mintAccounts: [],
        includeDrips: false,
        includeTokenMetadata: true,
      }),
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

/**
 * Create a Helius webhook for real-time whale monitoring
 */
export async function createWebhook(
  walletAddresses: string[],
  webhookUrl: string
): Promise<string | null> {
  if (!API_KEY) return null;
  try {
    const res = await fetch(`${HELIUS_API}/webhooks?api-key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        webhookURL: webhookUrl,
        transactionTypes: ['SWAP', 'TRANSFER'],
        accountAddresses: walletAddresses,
        webhookType: 'enhanced',
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.webhookID || null;
  } catch {
    return null;
  }
}
