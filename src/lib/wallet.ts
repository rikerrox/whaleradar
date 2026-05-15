/**
 * Phantom Wallet connection utilities for Solana
 */

interface PhantomProvider {
  isPhantom?: boolean;
  connect: () => Promise<{ publicKey: { toString: () => string } }>;
  disconnect: () => Promise<void>;
  signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
  isConnected: boolean;
  publicKey: { toString: () => string } | null;
}

interface WindowWithSolana extends Window {
  solana?: PhantomProvider;
}

/**
 * Check if Phantom wallet is installed
 */
export function isPhantomInstalled(): boolean {
  const window_ = window as unknown as WindowWithSolana;
  return !!window_.solana?.isPhantom;
}

/**
 * Connect to Phantom wallet and return the public key address
 * Returns null if user rejects or wallet not available
 */
export async function connectPhantomWallet(): Promise<string | null> {
  const window_ = window as unknown as WindowWithSolana;
  
  if (!window_.solana?.isPhantom) {
    return null;
  }

  try {
    const response = await window_.solana.connect();
    return response.publicKey.toString();
  } catch {
    // User rejected the connection
    return null;
  }
}

/**
 * Disconnect from Phantom wallet
 */
export async function disconnectPhantomWallet(): Promise<void> {
  const window_ = window as unknown as WindowWithSolana;
  
  if (window_.solana?.isPhantom) {
    try {
      await window_.solana.disconnect();
    } catch {
      // Ignore disconnect errors
    }
  }
}

/** Demo/mock wallet address used when Phantom is not installed */
export const DEMO_WALLET_ADDRESS = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';
export const DEMO_WALLET_BALANCE = 45.8;
