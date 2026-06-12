'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  TrendingUp, TrendingDown, Wallet, Activity, Copy,
  ArrowUpRight, ArrowDownRight, Eye, Bell, Zap,
  BarChart3, Coins, Clock, ExternalLink, Star,
  ChevronRight, Radio,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import { shortAddress, calculatePositions } from '@/lib/mock-data';
import type { Trade } from '@/lib/types';

function PortfolioCard() {
  const { portfolio } = useAppStore();
  const chartData = useMemo(() => {
    if (portfolio.totalValue === 0) return [];
    // Generate minimal chart data from portfolio value
    return Array.from({ length: 7 }, (_, i) => ({
      time: `Day ${i + 1}`,
      value: portfolio.totalValue * (0.95 + Math.random() * 0.1),
    }));
  }, [portfolio.totalValue]);

  return (
    <Card className="glass-card neon-glow-purple col-span-full lg:col-span-2">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Portfolio Value</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-3xl font-bold">${portfolio.totalValue.toLocaleString()}</h2>
              <span className={`text-sm font-medium flex items-center gap-0.5 ${portfolio.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {portfolio.totalPnl >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                {portfolio.totalPnl >= 0 ? '+' : ''}${portfolio.totalPnl.toLocaleString()} ({portfolio.totalPnlPercent}%)
              </span>
            </div>
          </div>
          <Badge variant="secondary" className="bg-green-500/10 text-green-400 border-green-500/30">
            <TrendingUp className="w-3 h-3 mr-1" /> +{portfolio.todayPnlPercent}%
          </Badge>
        </div>

        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
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
                itemStyle={{ color: '#a855f7' }}
              />
              <Area type="monotone" dataKey="value" stroke="#a855f7" fill="url(#portfolioGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function StatsCards() {
  const { portfolio, solPrice } = useAppStore();
  const solPriceUsd = solPrice || 86;

  const stats = [
    {
      label: 'SOL Balance',
      value: `${portfolio.solBalance.toFixed(2)} SOL`,
      sub: `~$${(portfolio.solBalance * solPriceUsd).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      icon: Coins,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
    },
    {
      label: 'Active Positions',
      value: portfolio.activePositions.toString(),
      sub: portfolio.activePositions > 0 ? `${portfolio.activePositions} active` : 'No positions yet',
      icon: BarChart3,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
    },
    {
      label: 'Copy Trades',
      value: portfolio.activeCopyTrades.toString(),
      sub: portfolio.activeCopyTrades > 0 ? `${portfolio.activeCopyTrades} running` : 'No copy trades yet',
      icon: Copy,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
    {
      label: "Today's P&L",
      value: `${portfolio.todayPnl >= 0 ? '+' : ''}$${portfolio.todayPnl.toLocaleString()}`,
      sub: `${portfolio.todayPnlPercent >= 0 ? '+' : ''}${portfolio.todayPnlPercent}%`,
      icon: portfolio.todayPnl >= 0 ? TrendingUp : TrendingDown,
      color: portfolio.todayPnl >= 0 ? 'text-green-400' : 'text-red-400',
      bg: portfolio.todayPnl >= 0 ? 'bg-green-500/10' : 'bg-red-500/10',
    },
  ];

  return (
    <>
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <Card className="glass-card glass-card-hover transition-all duration-300 h-full">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </div>
              <p className="text-xl font-bold">{stat.value}</p>
              <p className={`text-xs ${stat.color} mt-1`}>{stat.sub}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </>
  );
}

function ActivePositions() {
  const { solPrice, liveTokenPrices } = useAppStore();
  const solPriceUsd = solPrice || 0;
  const positions = calculatePositions(solPriceUsd, liveTokenPrices);

  return (
    <Card className="glass-card h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-purple-400" />
          Active Positions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {positions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <BarChart3 className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">No positions yet</p>
            <p className="text-xs mt-1">Start trading to see your positions here</p>
          </div>
        ) : (
          <ScrollArea className="max-h-72">
            <div className="space-y-3">
              {positions.map((pos) => (
                <div key={pos.symbol} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/30 to-cyan-500/30 flex items-center justify-center text-xs font-bold">
                    {pos.symbol.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium">{pos.symbol}</span>
                      <span className="text-xs text-muted-foreground">{pos.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Progress value={pos.allocation} className="h-1 w-16" />
                      <span className="text-[10px] text-muted-foreground">{pos.allocation}%</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">${pos.currentValue.toLocaleString()}</p>
                    <p className={`text-xs ${pos.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {pos.pnl >= 0 ? '+' : ''}${pos.pnl.toLocaleString()} ({pos.pnlPercent}%)
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

function LiveTradeFeed() {
  const { liveTrades, setCurrentPage } = useAppStore();

  return (
    <Card className="glass-card h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Radio className="w-4 h-4 text-green-400 animate-pulse" />
            Live Whale Feed
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={() => setCurrentPage('whale-tracker')}
          >
            View All <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <ScrollArea className="max-h-72">
          <div className="space-y-2">
            {liveTrades.length > 0 ? liveTrades.slice(0, 10).map((trade) => (
              <div key={trade.id} className={`flex items-center gap-2 p-2 rounded-lg text-xs transition-colors ${
                trade.type === 'buy' ? 'bg-green-500/5 hover:bg-green-500/10' : 'bg-red-500/5 hover:bg-red-500/10'
              }`}>
                <Badge variant="secondary" className={`text-[9px] h-4 px-1.5 ${
                  trade.type === 'buy' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {trade.type.toUpperCase()}
                </Badge>
                <span className="font-mono text-muted-foreground">
                  {shortAddress(trade.walletAddress)}
                </span>
                <span className="font-medium">{trade.tokenSymbol}</span>
                <span className="ml-auto font-medium">
                  ${trade.totalValue.toLocaleString()}
                </span>
                <span className="text-muted-foreground text-[10px]">{trade.dex}</span>
              </div>
            )) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <Radio className="w-6 h-6 mx-auto mb-2 opacity-50" />
                Waiting for whale trades...
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function CopyTradeOverview() {
  const { copyTrades, setCurrentPage } = useAppStore();

  return (
    <Card className="glass-card h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Copy className="w-4 h-4 text-cyan-400" />
            Active Copy Trades
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={() => setCurrentPage('copy-trading')}
          >
            Manage <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-3">
          {copyTrades.slice(0, 4).map((ct) => (
            <div key={ct.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
              <div className={`w-2 h-2 rounded-full ${
                ct.status === 'executed' ? 'bg-green-500' :
                ct.status === 'pending' ? 'bg-yellow-500 animate-pulse' :
                ct.status === 'failed' ? 'bg-red-500' :
                'bg-gray-500'
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{ct.tokenSymbol}</p>
                <p className="text-[10px] text-muted-foreground">{ct.whaleLabel} • {ct.copyPercent}%</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{ct.amount} SOL</p>
                {ct.pnl !== null && (
                  <p className={`text-xs ${ct.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {ct.pnl >= 0 ? '+' : ''}${ct.pnl}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function VolumeChart() {
  const chartData = useMemo(() => [], []);

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="w-4 h-4 text-yellow-400" />
          24h Volume
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Activity className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">No volume data yet</p>
            <p className="text-xs mt-1">Volume data will appear when trades are executed</p>
          </div>
        ) : (
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ color: '#71717a' }}
                />
                <Bar dataKey="volume" fill="#a855f7" radius={[2, 2, 0, 0]} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardView() {
  return (
    <div className="space-y-4">
      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCards />
      </div>

      {/* Portfolio Chart */}
      <PortfolioCard />

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ActivePositions />
        <LiveTradeFeed />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CopyTradeOverview />
        <VolumeChart />
      </div>
    </div>
  );
}
