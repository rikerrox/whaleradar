'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppStore } from '@/lib/store';
import type { Trade, AlertItem } from '@/lib/types';

export function useRealtime() {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [clientCount, setClientCount] = useState(0);
  const { addLiveTrade, addAlert } = useAppStore();

  useEffect(() => {
    // Connect to the WebSocket service through the Caddy gateway
    const socket = io("/?XTransformPort=3003", {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 3000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[WhaleRadar] Real-time connected');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('[WhaleRadar] Real-time disconnected');
      setConnected(false);
    });

    socket.on('connected', (data: { message: string; clientCount: number }) => {
      setClientCount(data.clientCount);
    });

    // Handle whale trades
    socket.on('whale-trade', (trade: any) => {
      addLiveTrade({
        ...trade,
        timestamp: new Date(trade.timestamp),
      });
    });

    // Handle alerts
    socket.on('alert', (alert: any) => {
      addAlert({
        ...alert,
        timestamp: new Date(alert.timestamp),
      } as AlertItem);
    });

    // Handle price updates (can be used for token list updates)
    socket.on('price-update', (update: any) => {
      // Could update token prices in the store
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [addLiveTrade, addAlert]);

  const subscribeToWhale = useCallback((whaleId: string) => {
    socketRef.current?.emit('subscribe-whale', whaleId);
  }, []);

  const unsubscribeFromWhale = useCallback((whaleId: string) => {
    socketRef.current?.emit('unsubscribe-whale', whaleId);
  }, []);

  const subscribeToToken = useCallback((tokenAddress: string) => {
    socketRef.current?.emit('subscribe-token', tokenAddress);
  }, []);

  const unsubscribeFromToken = useCallback((tokenAddress: string) => {
    socketRef.current?.emit('unsubscribe-token', tokenAddress);
  }, []);

  return {
    connected,
    clientCount,
    subscribeToWhale,
    unsubscribeFromWhale,
    subscribeToToken,
    unsubscribeFromToken,
  };
}
