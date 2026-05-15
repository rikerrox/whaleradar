'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft, Wallet, Star, Copy, Eye, TrendingUp,
  TrendingDown, Shield, Clock, Users, ExternalLink,
  BarChart3, Target, Award, Zap, Check, Plus,
  ChevronRight, Activity, Globe, Hash, Loader2,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { shortAddress, generateTokenChartData, randomBetween } from '@/lib/mock-data';
import { toast } from 'sonner';
import type { CopyTrade, AlertItem } from '@/lib/types';

export function WalletProfileView() {
  const { whales, selectedWhaleId, setCurrentPage, toggleWhaleFollow, addCopyTrade, addAlert, walletBalance } = useAppStore();
  const [isCopyTrading, setIsCopyTrading] = useState(false);

  const whale = useMemo(() => 
    whales.find(w => w.id === selectedWhaleId) || whales[0]
  , [whales, selectedWhaleId]);

  const pnlData = useMemo(() => {
    let value = 0;
    return Array.from({ length: 30 }).map((_, i) => {
      value += randomBetween(-500, 700);
      return {
        day: new Date(Date.now() - (29 - i) * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        pnl: Number(value.toFixed(2)),
      };
    });
  }, []);

  if (!whale) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <Wallet className="w-12 h-12 mx-auto mb-3 opacity-20" />
        <p>Wallet not found</p>
        <Button variant="ghost" className="mt-4" onClick={() => setCurrentPage('whale-tracker')}>
          Back to Tracker
        </Button>
      </div>
    );
  }

  const handleFollowToggle = () => {
    toggleWhaleFollow(whale.id);
    if (whale.isFollowed) {
      toast.info(`Unfollowed ${whale.label}`, { description: 'You will no longer receive alerts for this wallet.' });
    } else {
      toast.success(`Now following ${whale.label}!`, { description: 'You\'ll get alerts when this whale makes moves.' });
      addAlert({
        id: `alert-${Date.now()}`,
        type: 'whale_buy',
        title: 'New Whale Followed',
        message: `You are now following ${whale.label}. You'll be notified of their trades.`,
        token: null,
        isRead: false,
        channel: 'browser',
        timestamp: new Date(),
      });
    }
  };

  const handleCopyTrade = async () => {
    setIsCopyTrading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Pick a token from the whale's recent trades
    const recentToken = whale.recentTrades[0];
    const tokenSymbol = recentToken?.tokenSymbol || 'WIF';
    const tokenName = recentToken?.tokenName || 'dogwifhat';
    const tradeType = recentToken?.type || 'buy';

    const newTrade: CopyTrade = {
      id: `ct-${Date.now()}`,
      whaleWalletId: whale.id,
      whaleLabel: whale.label,
      tokenSymbol,
      tokenName,
      type: tradeType,
      amount: Number((Math.min(5, walletBalance * 0.1)).toFixed(2)),
      copyPercent: 50,
      status: 'pending',
      pnl: null,
      txHash: null,
      createdAt: new Date(),
    };

    addCopyTrade(newTrade);
    toast.success('Copy trade created!', {
      description: `Copying ${whale.label}'s ${tokenSymbol} trades. Go to Copy Trading to manage.`,
    });

    // Simulate execution
    setTimeout(() => {
      const pnl = randomBetween(-100, 300);
      const success = Math.random() > 0.15;
      const { updateCopyTradeStatus, addAlert: addAlertFn } = useAppStore.getState();
      if (success) {
        updateCopyTradeStatus(newTrade.id, 'executed', pnl);
        addAlertFn({
          id: `alert-${Date.now()}`,
          type: 'copy_trade',
          title: 'Copy Trade Executed',
          message: `Copied ${whale.label}: ${tradeType === 'buy' ? 'Bought' : 'Sold'} ${tokenSymbol} worth ${newTrade.amount} SOL`,
          token: tokenSymbol,
          isRead: false,
          channel: 'browser',
          timestamp: new Date(),
        });
        toast.success('Trade executed!', { description: `PnL: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}` });
      } else {
        updateCopyTradeStatus(newTrade.id, 'failed');
        toast.error('Trade failed', { description: 'Could not execute. Try retrying from Copy Trading.' });
      }
    }, 3000);

    setIsCopyTrading(false);
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(whale.address).then(() => {
      toast.success('Address copied!', { description: shortAddress(whale.address) });
    }).catch(() => {
      toast.info('Wallet address', { description: whale.address });
    });
  };

  return (
    <div className="space-y-4">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground"
        onClick={() => setCurrentPage('whale-tracker')}
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Tracker
      </Button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start gap-4">
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500/40 to-cyan-500/40 flex items-center justify-center text-2xl font-bold shrink-0">
          {whale.label.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold">{whale.label}</h1>
            {whale.isFollowed && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <Check className="w-3 h-3 mr-1" /> Following
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm text-muted-foreground font-mono">{shortAddress(whale.address)}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopyAddress}>
              <Copy className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {whale.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px] bg-purple-500/10 text-purple-400 border-purple-500/20">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={whale.isFollowed ? 'outline' : 'default'}
            size="sm"
            className={whale.isFollowed ? 'border-white/20' : 'bg-gradient-to-r from-purple-600 to-purple-500 text-white'}
            onClick={handleFollowToggle}
          >
            {whale.isFollowed ? (
              <><Star className="w-3.5 h-3.5 mr-1 fill-current" /> Following</>
            ) : (
              <><Star className="w-3.5 h-3.5 mr-1" /> Follow</>
            )}
          </Button>
          <Button 
            size="sm" 
            className="bg-gradient-to-r from-cyan-600 to-cyan-500 text-white"
            onClick={handleCopyTrade}
            disabled={isCopyTrading}
          >
            {isCopyTrading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
            {isCopyTrading ? 'Setting up...' : 'Copy Trade'}
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: 'Confidence', value: `${whale.confidence.toFixed(0)}/100`, color: whale.confidence >= 80 ? 'text-green-400' : whale.confidence >= 60 ? 'text-yellow-400' : 'text-red-400', icon: Shield },
          { label: 'ROI', value: `${whale.roi >= 0 ? '+' : ''}${whale.roi.toFixed(1)}%`, color: whale.roi >= 0 ? 'text-green-400' : 'text-red-400', icon: TrendingUp },
          { label: 'Win Rate', value: `${whale.winRate.toFixed(0)}%`, color: whale.winRate >= 60 ? 'text-green-400' : 'text-yellow-400', icon: Target },
          { label: 'Total P&L', value: `$${whale.totalPnl.toFixed(0)}`, color: whale.totalPnl >= 0 ? 'text-green-400' : 'text-red-400', icon: BarChart3 },
          { label: 'Total Trades', value: whale.totalTrades.toString(), color: 'text-cyan-400', icon: Activity },
          { label: 'Followers', value: whale.followersCount.toString(), color: 'text-purple-400', icon: Users },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="glass-card">
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
                  <span className="text-[10px] text-muted-foreground">{stat.label}</span>
                </div>
                <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* PnL Chart */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-purple-400" />
            30-Day P&L History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={pnlData}>
                <defs>
                  <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={pnlData[pnlData.length - 1].pnl >= 0 ? "#22c55e" : "#ef4444"} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={pnlData[pnlData.length - 1].pnl >= 0 ? "#22c55e" : "#ef4444"} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ color: '#71717a' }}
                />
                <Area
                  type="monotone"
                  dataKey="pnl"
                  stroke={pnlData[pnlData.length - 1].pnl >= 0 ? "#22c55e" : "#ef4444"}
                  fill="url(#pnlGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Confidence Breakdown */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            Confidence Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: 'Track Record', value: whale.confidence * 0.95, color: 'bg-green-500' },
            { label: 'Consistency', value: whale.confidence * 0.85, color: 'bg-cyan-500' },
            { label: 'Risk Management', value: whale.confidence * 0.9, color: 'bg-purple-500' },
            { label: 'Market Timing', value: whale.confidence * 0.88, color: 'bg-yellow-500' },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">{item.label}</span>
                <span className="text-xs font-medium">{item.value.toFixed(0)}/100</span>
              </div>
              <Progress value={item.value} className="h-1.5" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recent Trades */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-green-400" />
            Recent Trades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-72">
            <div className="space-y-2">
              {whale.recentTrades.map((trade) => (
                <div key={trade.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => {
                    useAppStore.getState().setSelectedTokenAddress(trade.tokenAddress);
                    useAppStore.getState().setCurrentPage('coin-details');
                  }}
                >
                  <Badge className={`text-[10px] h-5 ${
                    trade.type === 'buy'
                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : 'bg-red-500/20 text-red-400 border-red-500/30'
                  } border`}>
                    {trade.type.toUpperCase()}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{trade.tokenSymbol}</span>
                      <span className="text-xs text-muted-foreground">{trade.tokenName}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{trade.dex} • {new Date(trade.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{trade.amount.toLocaleString()} tokens</p>
                    <p className={`text-xs ${trade.type === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                      ${trade.totalValue.toLocaleString()}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <div className="text-center py-2">
        <p className="text-[10px] text-muted-foreground/50">
          This is not financial advice. Past performance does not guarantee future results.
        </p>
      </div>
    </div>
  );
}
