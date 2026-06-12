'use client';

import React, { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

const RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.mainnet-beta.solana.com';

/**
 * Reads real SOL balance from Solana blockchain when wallet is connected.
 * Polls every 15 seconds to keep balance current.
 */
export function BlockchainBalanceSync() {
  const { walletConnected, walletAddress, isDemoMode, setWalletBalance } = useAppStore();

  useEffect(() => {
    if (!walletConnected || !walletAddress || isDemoMode) return;

    const fetchBalance = async () => {
      try {
        const connection = new Connection(RPC_ENDPOINT, 'confirmed');
        const pubKey = new PublicKey(walletAddress);
        const lamports = await connection.getBalance(pubKey);
        const sol = lamports / LAMPORTS_PER_SOL;
        setWalletBalance(Number(sol.toFixed(4)));
      } catch (err) {
        console.error('Failed to fetch SOL balance:', err);
      }
    };

    fetchBalance();
    const id = setInterval(fetchBalance, 15000);
    return () => clearInterval(id);
  }, [walletConnected, walletAddress, isDemoMode, setWalletBalance]);

  return null;
}
