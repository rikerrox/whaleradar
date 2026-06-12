'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Copy, Zap, Shield, TrendingUp, TrendingDown, Settings2,
  Play, Pause, Trash2, RefreshCw, AlertTriangle, Check,
  X, Wallet, ArrowUpRight, ArrowDownRight, Clock,
  DollarSign, Percent, Activity, Eye, ChevronRight,
  Plus, StopCircle, Gauge, Loader2,
} from 'lucide-react';
import { shortAddress, randomBetween, TOKEN_SYMBOLS, TOKEN_NAMES } from '@/lib/mock-data';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import type { CopyTrade, AlertItem } from '@/lib/types';

function CopyTradeCard({ trade }: { trade: CopyTrade }) {
  const { updateCopyTradeStatus, addAlert } = useAppStore();

  const statusConfig: Record<string, { color: string; bg: string; icon: any }> = {
    executed: { color: 'text-green-400', bg: 'bg-green-500/20 border-green-500/30', icon: Check },
    pending: { color: 'text-yellow-400', bg: 'bg-yellow-500/20 border-yellow-500/30', icon: Clock },
    failed: { color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/30', icon: X },
    cancelled: { color: 'text-gray-400', bg: 'bg-gray-500/20 border-gray-500/30', icon: StopCircle },
  };
  const config = statusConfig[trade.status] || statusConfig.pending;
  const StatusIcon = config.icon;

  const handleCancel = () => {
    updateCopyTradeStatus(trade.id, 'cancelled');
    toast.info('Copy trade cancelled', { description: `${trade.tokenSymbol} copy trade has been cancelled.` });
  };

  const handleRetry = () => {
    updateCopyTradeStatus(trade.id, 'pending');
    toast.info('Retrying copy trade...', { description: `Re-attempting ${trade.tokenSymbol} copy trade.` });
    // Simulate execution after 2 seconds
    setTimeout(() => {
      const pnl = randomBetween(-50, 200);
      updateCopyTradeStatus(trade.id, 'executed', pnl);
      addAlert({
        id: `alert-${Date.now()}`,
        type: 'copy_trade',
        title: 'Copy Trade Executed',
        message: `Copied ${trade.whaleLabel}: ${trade.type === 'buy' ? 'Bought' : 'Sold'} ${trade.tokenSymbol} worth ${trade.amount} SOL`,
        token: trade.tokenSymbol,
        isRead: false,
        channel: 'browser',
        timestamp: new Date(),
      });
      toast.success('Copy trade executed!', { description: `${trade.tokenSymbol} - PnL: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}` });
    }, 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card glass-card-hover rounded-xl p-4 transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/30 to-cyan-500/30 flex items-center justify-center">
            <Copy className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{trade.tokenSymbol}</span>
              <Badge className={`text-[10px] h-5 ${config.bg} ${config.color} border`}>
                {trade.status === 'pending' ? <Loader2 className="w-3 h-3 mr-0.5 animate-spin" /> : <StatusIcon className="w-3 h-3 mr-0.5" />}
                {trade.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">From {trade.whaleLabel} • {trade.copyPercent}% copy</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold">{trade.amount} SOL</p>
          {trade.pnl !== null && (
            <p className={`text-xs font-medium ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {trade.pnl >= 0 ? '+' : ''}${trade.pnl}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="secondary" className={`text-[10px] h-5 ${
          trade.type === 'buy' 
            ? 'bg-green-500/20 text-green-400 border-green-500/30' 
            : 'bg-red-500/20 text-red-400 border-red-500/30'
        } border`}>
          {trade.type.toUpperCase()}
        </Badge>
        {trade.txHash && (
          <span className="font-mono">{trade.txHash}</span>
        )}
        <span className="ml-auto">{new Date(trade.createdAt).toLocaleTimeString()}</span>
      </div>

      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
        <Button variant="ghost" size="sm" className="h-7 text-xs flex-1" onClick={() => {
          toast.info(`${trade.tokenSymbol} Trade Details`, {
            description: `Whale: ${trade.whaleLabel} | Type: ${trade.type.toUpperCase()} | Amount: ${trade.amount} SOL | Copy: ${trade.copyPercent}% | Status: ${trade.status}${trade.pnl !== null ? ` | PnL: $${trade.pnl}` : ''}${trade.txHash ? ` | Tx: ${trade.txHash}` : ''}`,
            duration: 5000,
          });
        }}>
          <Eye className="w-3 h-3 mr-1" /> View
        </Button>
        {trade.status === 'pending' && (
          <Button variant="ghost" size="sm" className="h-7 text-xs text-red-400 hover:text-red-300" onClick={handleCancel}>
            <Trash2 className="w-3 h-3 mr-1" /> Cancel
          </Button>
        )}
        {trade.status === 'failed' && (
          <Button variant="ghost" size="sm" className="h-7 text-xs text-yellow-400 hover:text-yellow-300" onClick={handleRetry}>
            <RefreshCw className="w-3 h-3 mr-1" /> Retry
          </Button>
        )}
        {trade.status === 'executed' && trade.pnl !== null && trade.pnl > 0 && (
          <Badge className="text-[9px] bg-green-500/20 text-green-400 border-green-500/30">Profitable</Badge>
        )}
      </div>
    </motion.div>
  );
}

function NewCopyTradeForm() {
  const { whales, addCopyTrade, addAlert, walletBalance, solPrice } = useAppStore();
  const [selectedWhaleId, setSelectedWhaleId] = useState('');
  const [copyPercent, setCopyPercent] = useState([50]);
  const [stopLoss, setStopLoss] = useState([15]);
  const [takeProfit, setTakeProfit] = useState([50]);
  const [maxPosition, setMaxPosition] = useState([10]);
  const [slippage, setSlippage] = useState([1]);
  const [gasPriority, setGasPriority] = useState('medium');
  const [isCreating, setIsCreating] = useState(false);
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');

  const handleStartCopyTrade = async () => {
    if (!selectedWhaleId) {
      toast.error('Select a whale wallet', { description: 'Please select a whale to copy trade from.' });
      return;
    }
    if (!tokenSymbol.trim()) {
      toast.error('Enter a token symbol', { description: 'Please enter the token symbol you want to trade.' });
      return;
    }

    const whale = whales.find(w => w.id === selectedWhaleId);
    if (!whale) return;

    setIsCreating(true);

    try {
      // Try backend API first
      if (apiClient.isAuthenticated()) {
        const result = await apiClient.executeCopyTrade({
          whaleWalletId: whale.id,
          whaleLabel: whale.label,
          tokenAddress: `token-${tokenSymbol.toLowerCase()}`,
          tokenSymbol: tokenSymbol.toUpperCase(),
          tokenName: TOKEN_NAMES[TOKEN_SYMBOLS.indexOf(tokenSymbol.toUpperCase())] || tokenSymbol.toUpperCase(),
          type: tradeType,
          amount: Number((maxPosition[0] * (copyPercent[0] / 100)).toFixed(2)),
          copyPercent: copyPercent[0],
          stopLoss: stopLoss[0],
          takeProfit: takeProfit[0],
          maxPosition: maxPosition[0],
          slippage: slippage[0],
        });

        if (result.error) {
          toast.error('Trade failed', { description: result.error });
          setIsCreating(false);
          return;
        }

        const amount = Number((maxPosition[0] * (copyPercent[0] / 100)).toFixed(2));
        const newTrade: CopyTrade = {
          id: result.data?.copyTrade?.id as string || `ct-${Date.now()}`,
          whaleWalletId: whale.id,
          whaleLabel: whale.label,
          tokenSymbol: tokenSymbol.toUpperCase(),
          tokenName: TOKEN_NAMES[TOKEN_SYMBOLS.indexOf(tokenSymbol.toUpperCase())] || tokenSymbol.toUpperCase(),
          type: tradeType,
          amount: Number(amount.toFixed(2)),
          copyPercent: copyPercent[0],
          status: 'pending',
          pnl: null,
          txHash: null,
          createdAt: new Date(),
        };

        addCopyTrade(newTrade);
        
        // Deduct from local balance
        if (tradeType === 'buy') {
          useAppStore.getState().setWalletBalance(useAppStore.getState().walletBalance - amount);
        }

        toast.success('Copy trade created!', {
          description: `${tradeType === 'buy' ? 'Buying' : 'Selling'} ${tokenSymbol.toUpperCase()} — copying ${whale.label} at ${copyPercent[0]}%`
        });

        // Refresh wallet balance from backend
        useAppStore.getState().refreshUser();

        // Simulate execution
        setTimeout(() => {
          const pnl = randomBetween(-80, 250);
          const success = Math.random() > 0.12;
          if (success) {
            updateCopyTradeStatusSim(newTrade.id, pnl);
          } else {
            const { updateCopyTradeStatus } = useAppStore.getState();
            updateCopyTradeStatus(newTrade.id, 'failed');
            toast.error('Trade failed', { description: 'The copy trade could not be executed. Try retrying.' });
          }
        }, 3000);
      } else {
        // Fallback to local simulation for demo mode
        const amount = Math.min(maxPosition[0] * (copyPercent[0] / 100), walletBalance * 0.5);
        const newTrade: CopyTrade = {
          id: `ct-${Date.now()}`,
          whaleWalletId: whale.id,
          whaleLabel: whale.label,
          tokenSymbol: tokenSymbol.toUpperCase(),
          tokenName: TOKEN_NAMES[TOKEN_SYMBOLS.indexOf(tokenSymbol.toUpperCase())] || tokenSymbol.toUpperCase(),
          type: tradeType,
          amount: Number(amount.toFixed(2)),
          copyPercent: copyPercent[0],
          status: 'pending',
          pnl: null,
          txHash: null,
          createdAt: new Date(),
        };

        addCopyTrade(newTrade);
        toast.success('Copy trade created!', {
          description: `${tradeType === 'buy' ? 'Buying' : 'Selling'} ${tokenSymbol.toUpperCase()} — copying ${whale.label} at ${copyPercent[0]}%`
        });

        setTimeout(() => {
          const pnl = randomBetween(-80, 250);
          updateCopyTradeStatusSim(newTrade.id, pnl);
        }, 3000);
      }
    } catch {
      toast.error('Trade failed', { description: 'An unexpected error occurred.' });
    }

    setIsCreating(false);
    setTokenSymbol('');
  };

  const updateCopyTradeStatusSim = (id: string, pnl: number) => {
    const { updateCopyTradeStatus, addAlert } = useAppStore.getState();
    const success = Math.random() > 0.15; // 85% success rate
    if (success) {
      updateCopyTradeStatus(id, 'executed', pnl);
      const trade = useAppStore.getState().copyTrades.find(t => t.id === id);
      if (trade) {
        addAlert({
          id: `alert-${Date.now()}`,
          type: 'copy_trade',
          title: 'Copy Trade Executed',
          message: `Copied ${trade.whaleLabel}: ${trade.type === 'buy' ? 'Bought' : 'Sold'} ${trade.tokenSymbol} worth ${trade.amount} SOL`,
          token: trade.tokenSymbol,
          isRead: false,
          channel: 'browser',
          timestamp: new Date(),
        });
        toast.success('Trade executed!', { 
          description: `${trade.tokenSymbol} copy trade filled. PnL: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}` 
        });
      }
    } else {
      updateCopyTradeStatus(id, 'failed');
      toast.error('Trade failed', { description: 'The copy trade could not be executed. Try retrying.' });
    }
  };

  const followedWhales = whales.filter(w => w.isFollowed);

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Plus className="w-4 h-4 text-purple-400" />
          New Copy Trade Setup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Whale Selection */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Whale Wallet</label>
          {followedWhales.length > 0 ? (
            <div className="space-y-1.5">
              <select 
                value={selectedWhaleId}
                onChange={(e) => setSelectedWhaleId(e.target.value)}
                className="w-full h-9 bg-white/5 border border-white/10 rounded-md px-3 text-sm text-foreground focus:border-purple-500/50 focus:outline-none"
              >
                <option value="" className="bg-[#12121a]">Select a followed whale...</option>
                {followedWhales.map(whale => (
                  <option key={whale.id} value={whale.id} className="bg-[#12121a]">
                    {whale.label} ({shortAddress(whale.address)}) — {whale.roi >= 0 ? '+' : ''}{whale.roi}% ROI
                  </option>
                ))}
              </select>
              {followedWhales.length < whales.length && (
                <p className="text-[10px] text-muted-foreground">
                  Follow more whales from the <button onClick={() => useAppStore.getState().setCurrentPage('whale-tracker')} className="text-purple-400 hover:underline">Whale Tracker</button> to copy trade from them
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Input
                placeholder="Enter wallet address or select from tracker"
                className="bg-white/5 border-white/10 text-sm h-9"
                value={selectedWhaleId}
                onChange={(e) => setSelectedWhaleId(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground">
                No followed whales yet. Follow whales from the <button onClick={() => useAppStore.getState().setCurrentPage('whale-tracker')} className="text-purple-400 hover:underline">Whale Tracker</button> to copy trade from them.
              </p>
            </div>
          )}
        </div>

        {/* Token Symbol */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Token Symbol</label>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. WIF, BONK, PEPE"
              value={tokenSymbol}
              onChange={(e) => setTokenSymbol(e.target.value.toUpperCase())}
              className="bg-white/5 border-white/10 text-sm h-9 flex-1"
            />
            <div className="flex gap-1">
              {['buy', 'sell'].map((t) => (
                <Button
                  key={t}
                  variant={tradeType === t ? 'default' : 'ghost'}
                  size="sm"
                  className={`h-9 text-xs px-3 ${
                    tradeType === t
                      ? t === 'buy' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'
                      : 'bg-white/5 text-muted-foreground'
                  } border`}
                  onClick={() => setTradeType(t as 'buy' | 'sell')}
                >
                  {t.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>
          {/* Quick select popular tokens */}
          <div className="flex gap-1 mt-2">
            {['WIF', 'BONK', 'PEPE', 'FLOKI', 'BOME', 'GOAT'].map(sym => (
              <button
                key={sym}
                onClick={() => setTokenSymbol(sym)}
                className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors ${
                  tokenSymbol === sym
                    ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                    : 'bg-white/5 text-muted-foreground border-white/5 hover:bg-white/10'
                }`}
              >
                {sym}
              </button>
            ))}
          </div>
        </div>

        {/* Copy Percentage */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-muted-foreground">Copy Amount</label>
            <span className="text-xs font-medium text-purple-400">{copyPercent[0]}%</span>
          </div>
          <Slider value={copyPercent} onValueChange={setCopyPercent} max={100} step={5} className="py-1" />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>5%</span><span>100%</span>
          </div>
        </div>

        {/* Risk Management */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-muted-foreground">Stop Loss</label>
              <span className="text-xs font-medium text-red-400">{stopLoss[0]}%</span>
            </div>
            <Slider value={stopLoss} onValueChange={setStopLoss} max={50} step={1} className="py-1" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-muted-foreground">Take Profit</label>
              <span className="text-xs font-medium text-green-400">{takeProfit[0]}%</span>
            </div>
            <Slider value={takeProfit} onValueChange={setTakeProfit} max={200} step={5} className="py-1" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-muted-foreground">Max Position</label>
              <span className="text-xs font-medium">{maxPosition[0]} SOL</span>
            </div>
            <Slider value={maxPosition} onValueChange={setMaxPosition} max={50} step={1} className="py-1" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-muted-foreground">Slippage</label>
              <span className="text-xs font-medium">{slippage[0]}%</span>
            </div>
            <Slider value={slippage} onValueChange={setSlippage} max={10} step={0.5} className="py-1" />
          </div>
        </div>

        {/* Gas Priority */}
        <div>
          <label className="text-xs text-muted-foreground mb-2 block">Gas Priority</label>
          <div className="flex gap-2">
            {['low', 'medium', 'high'].map((p) => (
              <Button
                key={p}
                variant={gasPriority === p ? 'default' : 'ghost'}
                size="sm"
                className={`h-8 text-xs flex-1 ${
                  gasPriority === p
                    ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                    : 'bg-white/5 hover:bg-white/10 text-muted-foreground'
                } border`}
                onClick={() => setGasPriority(p)}
              >
                <Gauge className="w-3 h-3 mr-1" />
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Estimated Cost */}
        <div className="p-3 rounded-lg bg-white/5 border border-white/5">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Estimated Cost</span>
            <span className="font-medium">{(maxPosition[0] * copyPercent[0] / 100).toFixed(2)} SOL (~${(maxPosition[0] * copyPercent[0] / 100 * solPrice).toFixed(2)})</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Your Balance</span>
            <span className="font-medium">{walletBalance.toFixed(2)} SOL</span>
          </div>
        </div>

        {/* Warning */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-200/70">
            Copy trading involves significant risk. Only invest what you can afford to lose. 
            Past performance does not guarantee future results.
          </p>
        </div>

        {/* Submit */}
        <Button 
          className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white"
          onClick={handleStartCopyTrade}
          disabled={isCreating}
        >
          {isCreating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating Copy Trade...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Start Copy Trading
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

function CopyTradeStats() {
  const { copyTrades } = useAppStore();

  const executed = copyTrades.filter(t => t.status === 'executed');
  const totalPnl = executed.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const winCount = executed.filter(t => (t.pnl || 0) > 0).length;
  const winRate = executed.length > 0 ? (winCount / executed.length) * 100 : 0;
  const activeCount = copyTrades.filter(t => t.status === 'pending').length;

  const stats = [
    { label: 'Total Copy Trades', value: copyTrades.length.toString(), color: 'text-purple-400', icon: Copy },
    { label: 'Active', value: activeCount.toString(), color: 'text-yellow-400', icon: Activity },
    { label: 'Win Rate', value: `${winRate.toFixed(0)}%`, color: 'text-cyan-400', icon: Percent },
    { label: 'Total P&L', value: `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)}`, color: totalPnl >= 0 ? 'text-green-400' : 'text-red-400', icon: DollarSign },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

export function CopyTradingView() {
  const { copyTrades } = useAppStore();
  const [tab, setTab] = useState('active');

  const activeTrades = copyTrades.filter(t => t.status === 'pending');
  const completedTrades = copyTrades.filter(t => t.status === 'executed' || t.status === 'failed' || t.status === 'cancelled');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Copy className="w-6 h-6 text-purple-400" />
            Copy Trading
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Mirror profitable whale trades automatically with risk management
          </p>
        </div>
        <Badge variant="secondary" className="bg-green-500/10 text-green-400 border-green-500/30">
          <Activity className="w-3 h-3 mr-1" /> Active
        </Badge>
      </div>

      {/* Stats */}
      <CopyTradeStats />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trade List */}
        <div className="lg:col-span-2 space-y-3">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="bg-white/5 border border-white/10">
              <TabsTrigger value="active" className="text-xs">
                Active ({activeTrades.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="text-xs">
                History ({completedTrades.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="mt-3">
              <ScrollArea className="max-h-[600px]">
                <div className="space-y-3">
                  {activeTrades.length > 0 ? activeTrades.map((trade) => (
                    <CopyTradeCard key={trade.id} trade={trade} />
                  )) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Copy className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No active copy trades</p>
                      <p className="text-xs mt-1">Set up a new copy trade to get started</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="completed" className="mt-3">
              <ScrollArea className="max-h-[600px]">
                <div className="space-y-3">
                  {completedTrades.length > 0 ? completedTrades.map((trade) => (
                    <CopyTradeCard key={trade.id} trade={trade} />
                  )) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No completed trades yet</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* New Copy Trade Form */}
        <div>
          <NewCopyTradeForm />
        </div>
      </div>
    </div>
  );
}
