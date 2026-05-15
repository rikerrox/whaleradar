/**
 * Server-side Solana wallet utilities
 * Used by API routes for on-chain transaction verification
 * This file does NOT use any browser APIs (no window, no Phantom)
 */

import { 
  Connection, 
  PublicKey, 
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';

// Solana RPC endpoints
const SOLANA_RPC_ENDPOINT = 'https://api.mainnet-beta.solana.com';
const SOLANA_DEVNET_ENDPOINT = 'https://api.devnet.solana.com';

const RPC_ENDPOINT = process.env.SOLANA_NETWORK === 'devnet'
  ? SOLANA_DEVNET_ENDPOINT
  : SOLANA_RPC_ENDPOINT;

/**
 * WhaleRadar platform deposit wallet address
 * IMPORTANT: Replace with your actual platform wallet address
 */
export const WHALE_RADAR_DEPOSIT_WALLET = process.env.DEPOSIT_WALLET || '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';

/**
 * Create a Solana connection with retry logic
 */
function createConnection(): Connection {
  return new Connection(RPC_ENDPOINT, {
    commitment: 'confirmed',
    confirmTransactionInitialTimeout: 60000,
  });
}

/**
 * Verify a Solana transaction on-chain
 * Checks that the transaction exists, is confirmed, and matches the expected transfer
 */
export async function verifySolanaTransaction(
  signature: string,
  expectedFrom?: string,
  expectedTo?: string,
  expectedAmountLamports?: number
): Promise<{
  verified: boolean;
  slot: number;
  from: string;
  to: string;
  lamports: number;
  solAmount: number;
  blockTime: number | null;
  error?: string;
}> {
  try {
    const connection = createConnection();

    // Fetch transaction details
    const tx = await connection.getTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });

    if (!tx) {
      return {
        verified: false,
        slot: 0,
        from: '',
        to: '',
        lamports: 0,
        solAmount: 0,
        blockTime: null,
        error: 'Transaction not found on-chain. It may still be processing.',
      };
    }

    // Parse the transaction to find the SOL transfer instruction
    const { message } = tx.transaction;
    
    // Get account keys from the transaction
    let accountKeys: string[];
    try {
      if ('staticAccountKeys' in message) {
        accountKeys = (message.staticAccountKeys as PublicKey[]).map((k: PublicKey) => k.toString());
      } else {
        accountKeys = (message as any).accountKeys?.map((k: any) => 
          typeof k === 'string' ? k : k.toString?.() || ''
        ) || [];
      }
    } catch {
      accountKeys = [];
    }

    // Look for SystemProgram Transfer instruction
    const SYSTEM_PROGRAM_ID = '11111111111111111111111111111111';
    let transferFrom = '';
    let transferTo = '';
    let transferLamports = 0;

    const instructions = (message as any).instructions || [];
    for (const ix of instructions) {
      const programIdIdx = ix.programIdIndex;
      const programId = accountKeys[programIdIdx];
      
      if (programId === SYSTEM_PROGRAM_ID) {
        // Decode transfer instruction
        const keys = (ix.accounts as number[]).map((idx: number) => accountKeys[idx]);
        transferFrom = keys[0] || '';
        transferTo = keys[1] || '';
        
        // Decode the instruction data for SystemProgram.transfer
        const dataBuffer = Buffer.from(ix.data, 'base64');
        // Transfer instruction: 4 bytes instruction index (should be 2) + 8 bytes lamports
        if (dataBuffer.length >= 12) {
          const instructionIndex = dataBuffer.readUInt32LE(0);
          if (instructionIndex === 2) { // Transfer instruction index
            transferLamports = Number(dataBuffer.readBigUInt64LE(4));
          }
        }
        break;
      }
    }

    const solAmount = transferLamports / LAMPORTS_PER_SOL;

    // If no transfer instruction found, try to parse from inner instructions or meta
    if (transferLamports === 0 && tx.meta) {
      // Check pre/post balances to determine transfer amount
      const preBalances = tx.meta.preBalances;
      const postBalances = tx.meta.postBalances;
      
      // Find the account that lost SOL (sender) and the one that gained (receiver)
      for (let i = 0; i < preBalances.length; i++) {
        const diff = postBalances[i] - preBalances[i];
        if (diff < 0 && Math.abs(diff) > 5000) {
          // This account lost SOL - likely the sender
          // The actual transferred amount includes the fee, so we look at the receiver
        } else if (diff > 0 && diff > 5000) {
          // This account gained SOL - likely the receiver
          if (accountKeys[i] === WHALE_RADAR_DEPOSIT_WALLET || 
              (expectedTo && accountKeys[i] === expectedTo)) {
            transferLamports = diff;
            transferTo = accountKeys[i];
          }
        }
      }

      // Find sender from balance changes
      if (transferLamports > 0 && !transferFrom) {
        for (let i = 0; i < preBalances.length; i++) {
          const diff = postBalances[i] - preBalances[i];
          if (diff < 0) {
            transferFrom = accountKeys[i];
            break;
          }
        }
      }
    }

    const finalSolAmount = transferLamports / LAMPORTS_PER_SOL;

    // Verify the transaction matches expectations
    let verified = true;
    const errors: string[] = [];

    if (expectedFrom && transferFrom !== expectedFrom) {
      verified = false;
      errors.push(`Sender mismatch: expected ${expectedFrom}, got ${transferFrom}`);
    }
    
    // Check recipient - must be our deposit wallet
    if (expectedTo && transferTo !== expectedTo) {
      verified = false;
      errors.push(`Recipient mismatch: expected ${expectedTo}, got ${transferTo}`);
    }
    
    // Check that funds went to our deposit wallet
    if (!transferTo || transferTo !== WHALE_RADAR_DEPOSIT_WALLET) {
      verified = false;
      errors.push('Funds were not sent to the WhaleRadar deposit wallet');
    }

    // Check amount (allow 1% tolerance for rounding and fees)
    if (expectedAmountLamports && transferLamports > 0) {
      const tolerance = expectedAmountLamports * 0.01;
      if (Math.abs(transferLamports - expectedAmountLamports) > tolerance) {
        verified = false;
        errors.push(`Amount mismatch: expected ~${expectedAmountLamports} lamports, got ${transferLamports}`);
      }
    }

    return {
      verified,
      slot: tx.slot,
      from: transferFrom,
      to: transferTo,
      lamports: transferLamports,
      solAmount: finalSolAmount,
      blockTime: tx.blockTime,
      error: errors.length > 0 ? errors.join('; ') : undefined,
    };
  } catch (error) {
    console.error('Failed to verify transaction:', error);
    return {
      verified: false,
      slot: 0,
      from: '',
      to: '',
      lamports: 0,
      solAmount: 0,
      blockTime: null,
      error: `Verification error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Check if a transaction exists on-chain (lightweight check)
 */
export async function checkTransactionExists(signature: string): Promise<boolean> {
  try {
    const connection = createConnection();
    const status = await connection.getSignatureStatus(signature);
    return status?.value !== null && status?.value !== undefined;
  } catch {
    return false;
  }
}
