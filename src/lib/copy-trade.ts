/**
 * Copy trade execution service
 * Monitors whale wallets and auto-executes copy trades via Jupiter
 */

import { executeSwap, TOKEN_MINTS } from './jupiter';
import { getWalletTrades, type WhaleTrade } from './birdeye';

export interface CopyTradeConfig {
  userId: string;
  walletAddress: string;      // User's wallet
  whaleAddress: string;       // Whale being followed
  copyPercent: number;        // % of whale's trade to copy (e.g., 50)
  maxPositionSol: number;     // Max SOL per trade
  stopLossPercent: number;    // e.g., 10 = exit at -10%
  takeProfitPercent: number;  // e.g., 30 = exit at +30%
  slippageBps: number;        // Slippage tolerance (50 = 0.5%)
  isActive: boolean;
}

export interface CopyTradeResult {
  success: boolean;
  signature?: string;
  inputAmount: number;
  outputAmount: number;
  inputToken: string;
  outputToken: string;
  error?: string;
}

/**
 * Check if a whale made a new trade and copy it
 */
export async function checkAndCopyTrade(
  config: CopyTradeConfig,
  wallet: { signTransaction: (tx: any) => Promise<any> }
): Promise<CopyTradeResult | null> {
  if (!config.isActive) return null;

  try {
    // Get recent trades for the whale
    const trades = await getWalletTrades(config.whaleAddress, 5);
    if (!trades.length) return null;

    // Find the most recent buy trade
    const lastBuy = trades.find((t) => t.type === 'buy' && t.usdValue >= 1000);
    if (!lastBuy) return null;

    // Calculate copy amount (in SOL)
    const solAmount = Math.min(
      (lastBuy.usdValue * config.copyPercent) / 100,
      config.maxPositionSol
    );

    if (solAmount < 0.1) return null; // Too small to trade

    // Get SOL mint for the input
    const solMint = TOKEN_MINTS.SOL;
    const tokenMint = lastBuy.tokenAddress;

    if (!tokenMint) return null;

    // Execute the swap via Jupiter
    const lamports = solAmount * 1_000_000_000;
    const result = await executeSwap(
      solMint,
      tokenMint,
      lamports,
      config.walletAddress,
      wallet
    );

    if (!result) {
      return {
        success: false,
        inputAmount: solAmount,
        outputAmount: 0,
        inputToken: 'SOL',
        outputToken: lastBuy.tokenSymbol,
        error: 'Swap execution failed',
      };
    }

    return {
      success: true,
      signature: result.signature,
      inputAmount: solAmount,
      outputAmount: result.outputAmount,
      inputToken: 'SOL',
      outputToken: lastBuy.tokenSymbol,
    };
  } catch (err) {
    console.error('Copy trade error:', err);
    return {
      success: false,
      inputAmount: 0,
      outputAmount: 0,
      inputToken: 'SOL',
      outputToken: '',
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Get quote for a copy trade (preview without executing)
 */
export async function getCopyTradeQuote(
  inputToken: string,
  outputToken: string,
  amountSol: number
) {
  const inputMint = TOKEN_MINTS[inputToken.toUpperCase()] || inputToken;
  const outputMint = TOKEN_MINTS[outputToken.toUpperCase()] || outputToken;
  const lamports = amountSol * 1_000_000_000;

  const { getSwapQuote } = await import('./jupiter');
  return getSwapQuote(inputMint, outputMint, lamports);
}
