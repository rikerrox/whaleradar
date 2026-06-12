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
  ArrowLeft, TrendingUp, TrendingDown, Shield, AlertTriangle,
  Copy, Star, Eye, BarChart3, Users, DollarSign,
  Volume2, Clock, ExternalLink, Zap, Check,
  Activity, Globe, Layers, Target, Brain,
  ShieldCheck, ShieldAlert, ShieldX, Flame, Loader2,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import { shortAddress, DEX_LIST } from '@/lib/mock-data';
import { toast } from 'sonner';
import type { CopyTrade, AlertItem } from '@/lib/types';

export function CoinDetailsView() {
  const { tokens, selectedTokenAddress, setCurrentPage, addCopyTrade, addAlert, toggleWatchlist, watchlist, walletBalance, whales } = useAppStore();
  const [timeRange, setTimeRange] = useState('24h');
  const [isQuickBuying, setIsQuickBuying] = useState(false);
  const [isCopyTrading, setIsCopyTrading] = useState(false);

  const token = useMemo(() =>
    tokens.find(t => t.address === selectedTokenAddress) || tokens[0]
  , [tokens, selectedTokenAddress]);

  const priceData = useMemo(() => [], []);
  const volumeData = useMemo(() => [], []);

  // Generate holder distribution
  const holderDistribution = useMemo<{ label: string; pct: number }[]>(() => [], []);

  // AI scores
  const aiScores = useMemo(() => ({
    momentum: 'N/A',
    socialHype: 'N/A',
    entryTiming: 'N/A',
    smartMoney: 'N/A',
    safety: 'N/A',
  }), []);

  const isInWatchlist = watchlist.includes(token?.address || '');

  if (!token) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-20" />
        <p>Token not found</p>
        <Button variant="ghost" className="mt-4" onClick={() => setCurrentPage('scanner')}>
          Back to Scanner
        </Button>
      </div>
    );
  }

  const getRugRiskInfo = (risk: number) => {
    if (risk <= 20) return { label: 'Low Risk', color: 'text-green-400', bg: 'bg-green-500/20', icon: ShieldCheck };
    if (risk <= 50) return { label: 'Moderate Risk', color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: Shield };
    if (risk <= 75) return { label: 'High Risk', color: 'text-orange-400', bg: 'bg-orange-500/20', icon: ShieldAlert };
    return { label: 'Extreme Risk', color: 'text-red-400', bg: 'bg-red-500/20', icon: ShieldX };
  };

  const rugRiskInfo = getRugRiskInfo(token.rugRisk);

  const handleQuickBuy = async () => {
    setIsQuickBuying(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    const pnl = 0;
    toast.success(`Quick buy executed!`, { 
      description: `Bought ${token.symbol} worth 2 SOL on ${token.dex}. Estimated PnL: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}` 
    });
    addAlert({
      id: `alert-${Date.now()}`,
      type: 'whale_buy' as const,
      title: 'Quick Buy Executed',
      message: `Bought ${token.symbol} worth 2 SOL on ${token.dex}`,
      token: token.symbol,
      isRead: false,
      channel: 'browser',
      timestamp: new Date(),
    });
    setIsQuickBuying(false);
  };

  const handleCopyWhaleTrades = async () => {
    setIsCopyTrading(true);
    // Find a whale that traded this token
    const relevantWhale = whales.find(w => w.recentTrades.some(t => t.tokenSymbol === token.symbol)) || whales[0];
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newTrade: CopyTrade = {
      id: `ct-${Date.now()}`,
      whaleWalletId: relevantWhale.id,
      whaleLabel: relevantWhale.label,
      tokenSymbol: token.symbol,
      tokenName: token.name,
      type: 'buy',
      amount: Number((Math.min(5, walletBalance * 0.1)).toFixed(2)),
      copyPercent: 50,
      status: 'pending',
      pnl: null,
      txHash: null,
      createdAt: new Date(),
    };
    
    addCopyTrade(newTrade);
    toast.success('Copy trade created!', { 
      description: `Copying ${relevantWhale.label}'s ${token.symbol} trades. Head to Copy Trading to manage.` 
    });

    // Simulate execution
    setTimeout(() => {
      const pnl = 0;
      const success = Math.random() > 0.15;
      const { updateCopyTradeStatus, addAlert } = useAppStore.getState();
      if (success) {
        updateCopyTradeStatus(newTrade.id, 'executed', pnl);
        addAlert({
          id: `alert-${Date.now()}`,
          type: 'copy_trade',
          title: 'Copy Trade Executed',
          message: `Copied ${relevantWhale.label}: Bought ${token.symbol} worth ${newTrade.amount} SOL`,
          token: token.symbol,
          isRead: false,
          channel: 'browser',
          timestamp: new Date(),
        });
        toast.success('Copy trade filled!', { description: `PnL: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}` });
      } else {
        updateCopyTradeStatus(newTrade.id, 'failed');
        toast.error('Copy trade failed', { description: 'Could not execute. Try again from Copy Trading.' });
      }
    }, 3000);

    setIsCopyTrading(false);
  };

  const handleToggleWatchlist = () => {
    toggleWatchlist(token.address);
    if (isInWatchlist) {
      toast.info(`Removed ${token.symbol} from watchlist`);
    } else {
      toast.success(`Added ${token.symbol} to watchlist`, { description: 'You\'ll be notified of price changes.' });
      addAlert({
        id: `alert-${Date.now()}`,
        type: 'new_token',
        title: 'Added to Watchlist',
        message: `${token.symbol} added to your watchlist. You'll get alerts for this token.`,
        token: token.symbol,
        isRead: false,
        channel: 'browser',
        timestamp: new Date(),
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Back */}
      <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setCurrentPage('scanner')}>
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Scanner
      </Button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/40 to-cyan-500/40 flex items-center justify-center text-xl font-bold shrink-0">
          {token.symbol.slice(0, 2)}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold">{token.name}</h1>
            <span className="text-lg text-muted-foreground font-medium">{token.symbol}</span>
            {token.isVerified && <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><ShieldCheck className="w-3 h-3 mr-1" />Verified</Badge>}
            {token.isTrending && <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30"><Flame className="w-3 h-3 mr-1" />Trending</Badge>}
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-muted-foreground">{shortAddress(token.address)}</span>
            <Badge variant="secondary" className="text-[9px] bg-white/5">{token.dex}</Badge>
            <Badge variant="secondary" className="text-[9px] bg-white/5">{token.chain}</Badge>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">${token.price < 0.001 ? token.price.toExponential(2) : token.price.toFixed(token.price < 1 ? 6 : 2)}</span>
          </div>
          <span className={`text-sm font-medium flex items-center gap-0.5 justify-end ${token.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {token.priceChange24h >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: 'Market Cap', value: `$${(token.marketCap / 1e6).toFixed(1)}M`, icon: DollarSign, color: 'text-cyan-400' },
          { label: 'Volume 24h', value: `$${(token.volume24h / 1e6).toFixed(1)}M`, icon: Volume2, color: 'text-purple-400' },
          { label: 'Liquidity', value: `$${(token.liquidity / 1e6).toFixed(1)}M`, icon: Layers, color: 'text-green-400' },
          { label: 'Holders', value: token.holderCount.toLocaleString(), icon: Users, color: 'text-yellow-400' },
          { label: 'Whales', value: token.whaleCount.toString(), icon: Eye, color: 'text-purple-400' },
          { label: 'Age', value: token.age, icon: Clock, color: 'text-muted-foreground' },
        ].map((stat, i) => (
          <Card key={stat.label} className="glass-card">
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
                <span className="text-[10px] text-muted-foreground">{stat.label}</span>
              </div>
              <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Price Chart */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-400" />
              Price Chart
            </CardTitle>
            <div className="flex gap-1">
              {['1h', '24h', '7d', '30d'].map((r) => (
                <Button
                  key={r}
                  variant={timeRange === r ? 'default' : 'ghost'}
                  size="sm"
                  className={`h-7 text-xs ${timeRange === r ? 'bg-purple-500/20 text-purple-400' : 'text-muted-foreground'}`}
                  onClick={() => setTimeRange(r)}
                >
                  {r}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={priceData}>
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ color: '#71717a' }}
                />
                <Area type="monotone" dataKey="value" stroke="#a855f7" fill="url(#priceGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Rug Risk & Safety */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-red-400" />
              Risk Assessment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`flex items-center gap-3 p-3 rounded-lg ${rugRiskInfo.bg}`}>
              <rugRiskInfo.icon className={`w-6 h-6 ${rugRiskInfo.color}`} />
              <div>
                <p className={`text-sm font-medium ${rugRiskInfo.color}`}>{rugRiskInfo.label}</p>
                <p className="text-xs text-muted-foreground">Rug Risk Score: {token.rugRisk.toFixed(0)}/100</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Rug Risk</span>
                <span className={`text-xs font-medium ${rugRiskInfo.color}`}>{token.rugRisk.toFixed(0)}%</span>
              </div>
              <Progress value={token.rugRisk} className="h-2" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Trust Score</span>
                <span className="text-xs font-medium text-green-400">{token.trustScore.toFixed(0)}/100</span>
              </div>
              <Progress value={token.trustScore} className="h-2" />
            </div>

            <Separator className="bg-white/5" />

            <p className="text-xs text-muted-foreground">Holder Distribution</p>
            {holderDistribution.map((h) => (
              <div key={h.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">{h.label}</span>
                  <span className="text-xs font-medium">{h.pct}%</span>
                </div>
                <Progress value={h.pct} className="h-1" />
              </div>
            ))}

            <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-yellow-200/70">
                This is not financial advice. Always do your own research before investing.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* AI Scoring */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-400" />
              AI Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Momentum', value: aiScores.momentum, color: 'bg-purple-500' },
              { label: 'Social Hype', value: aiScores.socialHype, color: 'bg-cyan-500' },
              { label: 'Entry Timing', value: aiScores.entryTiming, color: 'bg-green-500' },
              { label: 'Smart Money', value: aiScores.smartMoney, color: 'bg-yellow-500' },
              { label: 'Safety Score', value: aiScores.safety, color: 'bg-red-500' },
            ].map((item) => {
              const isNA = item.value === 'N/A';
              const numVal = isNA ? 0 : Number(item.value);
              return (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <span className="text-xs font-medium text-muted-foreground">
                    {isNA ? 'N/A' : `${numVal.toFixed(0)}/100`}
                  </span>
                </div>
                {!isNA && <Progress value={numVal} className="h-2" />}
                {isNA && <Progress value={0} className="h-2 opacity-30" />}
              </div>
              );
            })}

            <Separator className="bg-white/5" />

            {/* Overall Score */}
            <div className="text-center py-4">
              <p className="text-xs text-muted-foreground mb-2">Overall AI Score</p>
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border-4 border-purple-500/50 bg-purple-500/10">
                <span className="text-2xl font-bold text-purple-400">
                  N/A
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                No data available
              </p>
            </div>

            {/* Volume Chart */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">24h Volume Distribution</p>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={volumeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="hour" stroke="rgba(255,255,255,0.2)" fontSize={9} tickLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.2)" fontSize={9} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }}
                      labelStyle={{ color: '#71717a' }}
                      formatter={(v: number) => [`$${(v / 1e6).toFixed(2)}M`, 'Volume']}
                    />
                    <Bar dataKey="volume" fill="#a855f7" radius={[2, 2, 0, 0]} opacity={0.7} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button 
          className="flex-1 bg-gradient-to-r from-purple-600 to-purple-500 text-white h-11"
          onClick={handleQuickBuy}
          disabled={isQuickBuying}
        >
          {isQuickBuying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
          {isQuickBuying ? 'Executing...' : 'Quick Buy'}
        </Button>
        <Button 
          className="flex-1 bg-gradient-to-r from-cyan-600 to-cyan-500 text-white h-11"
          onClick={handleCopyWhaleTrades}
          disabled={isCopyTrading}
        >
          {isCopyTrading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Copy className="w-4 h-4 mr-2" />}
          {isCopyTrading ? 'Setting up...' : `Copy Whale Trades on ${token.symbol}`}
        </Button>
        <Button 
          variant="outline" 
          className={`border-white/20 h-11 ${isInWatchlist ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' : ''}`}
          onClick={handleToggleWatchlist}
        >
          <Star className={`w-4 h-4 mr-2 ${isInWatchlist ? 'fill-yellow-400' : ''}`} />
          {isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
        </Button>
      </div>
    </div>
  );
}
