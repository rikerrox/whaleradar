'use client';

import React, { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Shield, Zap, Target, Activity, Brain, Gauge,
  StopCircle, RefreshCw, X, Copy, AlertTriangle,
  DollarSign, Percent, BarChart3,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { generateTokenChartData, randomBetween } from '@/lib/mock-data';
import { useAppStore } from '@/lib/store';
import type { CopyTrade } from '@/lib/types';

interface TradeDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trade: CopyTrade | null;
  position?: {
    symbol: string;
    name: string;
    amount: number;
    value: number;
    pnl: number;
    pnlPercent: number;
    allocation: number;
  };
  onClosePosition?: (position: TradeDetailModalProps['position']) => void;
  onCancelTrade?: (tradeId: string) => void;
  onRetryTrade?: (tradeId: string) => void;
}

function CircularProgress({ value, size = 64, strokeWidth = 5 }: { value: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  const color = value >= 80 ? '#22c55e' : value >= 60 ? '#a855f7' : value >= 40 ? '#eab308' : '#ef4444';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold" style={{ color }}>{value}%</span>
      </div>
    </div>
  );
}

export function TradeDetailModal({ open, onOpenChange, trade, position, onClosePosition, onCancelTrade, onRetryTrade }: TradeDetailModalProps) {
  const { solPrice } = useAppStore();
  const solPriceUsd = solPrice > 0 ? solPrice : 86;
  const chartData = useMemo(() => generateTokenChartData(), [open]);

  // Determine data source: trade or position
  const symbol = trade?.tokenSymbol || position?.symbol || '';
  const name = trade?.tokenName || position?.name || '';
  const type = trade?.type || 'buy';
  const status = trade?.status || 'executed';
  const pnl = trade?.pnl ?? position?.pnl ?? 0;
  const pnlPercent = position?.pnlPercent ?? (pnl > 0 ? ((pnl / (trade?.amount ?? 1)) * 100) : 0);

  // Simulated metrics
  const entryPrice = useMemo(() => randomBetween(0.0001, 0.5, 6), [open]);
  const currentPrice = useMemo(() => {
    const change = randomBetween(-0.3, 0.5);
    return Number((entryPrice * (1 + change)).toFixed(6));
  }, [open, entryPrice]);
  const amount = trade?.amount || (position?.value ? Number((position.value / currentPrice).toFixed(0)) : 0);
  const value = position?.value || Number((amount * currentPrice * solPriceUsd).toFixed(2));
  const allocation = position?.allocation || randomBetween(5, 40, 0);

  // AI analysis metrics
  const aiConfidence = useMemo(() => Math.floor(randomBetween(45, 95)), [open]);
  const riskLevel = useMemo(() => {
    const r = Math.random();
    return r > 0.6 ? 'low' as const : r > 0.3 ? 'medium' as const : 'high' as const;
  }, [open]);
  const momentum = useMemo(() => {
    const r = Math.random();
    return r > 0.5 ? 'bullish' as const : r > 0.2 ? 'neutral' as const : 'bearish' as const;
  }, [open]);

  // Whale info
  const whaleName = trade?.whaleLabel || 'Unknown Whale';
  const whaleWinRate = useMemo(() => Math.floor(randomBetween(55, 92)), [open]);
  const whaleRoi = useMemo(() => Math.floor(randomBetween(20, 350)), [open]);

  // Risk management
  const stopLoss = useMemo(() => randomBetween(5, 25, 1), [open]);
  const takeProfit = useMemo(() => randomBetween(30, 100, 1), [open]);
  const maxPosition = trade?.amount ? trade.amount * 2 : randomBetween(5, 20, 1);
  const slippageTolerance = randomBetween(0.5, 3, 1);

  const riskConfig = {
    low: { color: 'text-green-400', bg: 'bg-green-500/20 border-green-500/30', icon: Shield },
    medium: { color: 'text-yellow-400', bg: 'bg-yellow-500/20 border-yellow-500/30', icon: AlertTriangle },
    high: { color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/30', icon: AlertTriangle },
  };
  const risk = riskConfig[riskLevel];
  const RiskIcon = risk.icon;

  const momentumConfig = {
    bullish: { color: 'text-green-400', bg: 'bg-green-500/20', icon: TrendingUp },
    neutral: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: Activity },
    bearish: { color: 'text-red-400', bg: 'bg-red-500/20', icon: TrendingDown },
  };
  const mom = momentumConfig[momentum];
  const MomIcon = mom.icon;

  const statusConfig: Record<string, { color: string; bg: string }> = {
    executed: { color: 'text-green-400', bg: 'bg-green-500/20 border-green-500/30' },
    pending: { color: 'text-yellow-400', bg: 'bg-yellow-500/20 border-yellow-500/30' },
    failed: { color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/30' },
    cancelled: { color: 'text-gray-400', bg: 'bg-gray-500/20 border-gray-500/30' },
    closed: { color: 'text-cyan-400', bg: 'bg-cyan-500/20 border-cyan-500/30' },
  };
  const sc = statusConfig[status] || statusConfig.pending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#12121a] border-white/10 text-foreground sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/30 to-cyan-500/30 flex items-center justify-center text-lg font-bold">
                {symbol.slice(0, 2)}
              </div>
              <div>
                <DialogTitle className="text-xl flex items-center gap-2">
                  {symbol}
                  <Badge className={`text-[10px] h-5 ${
                    type === 'buy'
                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : 'bg-red-500/20 text-red-400 border-red-500/30'
                  } border`}>
                    {type === 'buy' ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                    {type.toUpperCase()}
                  </Badge>
                  <Badge className={`text-[10px] h-5 ${sc.bg} ${sc.color} border`}>
                    {status.toUpperCase()}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-0.5">{name}</DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Price Chart */}
        <div className="rounded-lg bg-white/5 border border-white/5 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-purple-400" />
              Price Movement
            </span>
            <span className="text-xs text-muted-foreground">24h</span>
          </div>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="detailChartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={pnl >= 0 ? '#22c55e' : '#ef4444'} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={pnl >= 0 ? '#22c55e' : '#ef4444'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" fontSize={9} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={9} tickLine={false} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }}
                  labelStyle={{ color: '#71717a' }}
                  itemStyle={{ color: pnl >= 0 ? '#22c55e' : '#ef4444' }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={pnl >= 0 ? '#22c55e' : '#ef4444'}
                  fill="url(#detailChartGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-white/5 border border-white/5 p-3">
            <p className="text-[10px] text-muted-foreground mb-1">Entry Price</p>
            <p className="text-sm font-bold">${entryPrice}</p>
          </div>
          <div className="rounded-lg bg-white/5 border border-white/5 p-3">
            <p className="text-[10px] text-muted-foreground mb-1">Current Price</p>
            <p className="text-sm font-bold">${currentPrice}</p>
          </div>
          <div className="rounded-lg bg-white/5 border border-white/5 p-3">
            <p className="text-[10px] text-muted-foreground mb-1">PnL</p>
            <p className={`text-sm font-bold ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
            </p>
            <p className={`text-[10px] ${pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(1)}%
            </p>
          </div>
          <div className="rounded-lg bg-white/5 border border-white/5 p-3">
            <p className="text-[10px] text-muted-foreground mb-1">Amount</p>
            <p className="text-sm font-bold">{amount.toLocaleString()}</p>
          </div>
          <div className="rounded-lg bg-white/5 border border-white/5 p-3">
            <p className="text-[10px] text-muted-foreground mb-1">Value</p>
            <p className="text-sm font-bold">${value.toLocaleString()}</p>
          </div>
          <div className="rounded-lg bg-white/5 border border-white/5 p-3">
            <p className="text-[10px] text-muted-foreground mb-1">Allocation</p>
            <p className="text-sm font-bold">{allocation}%</p>
            <Progress value={allocation} className="h-1 mt-1" />
          </div>
        </div>

        <Separator className="bg-white/10" />

        {/* Trade Analysis Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <Brain className="w-4 h-4 text-purple-400" />
            AI Trade Analysis
          </h3>

          <div className="grid grid-cols-3 gap-4">
            {/* AI Confidence */}
            <div className="flex flex-col items-center gap-2 rounded-lg bg-white/5 border border-white/5 p-4">
              <CircularProgress value={aiConfidence} />
              <div className="text-center">
                <p className="text-xs text-muted-foreground">AI Confidence</p>
                <p className={`text-xs font-medium ${aiConfidence >= 70 ? 'text-green-400' : aiConfidence >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {aiConfidence >= 70 ? 'Strong Signal' : aiConfidence >= 50 ? 'Moderate' : 'Weak'}
                </p>
              </div>
            </div>

            {/* Risk Level */}
            <div className="flex flex-col items-center gap-2 rounded-lg bg-white/5 border border-white/5 p-4">
              <div className={`w-16 h-16 rounded-full ${risk.bg.split(' ')[0]} border flex items-center justify-center`}>
                <RiskIcon className={`w-7 h-7 ${risk.color}`} />
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Risk Level</p>
                <Badge className={`text-[10px] ${risk.bg} ${risk.color} border`}>
                  {riskLevel.toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* Momentum */}
            <div className="flex flex-col items-center gap-2 rounded-lg bg-white/5 border border-white/5 p-4">
              <div className={`w-16 h-16 rounded-full ${mom.bg} flex items-center justify-center`}>
                <MomIcon className={`w-7 h-7 ${mom.color}`} />
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Momentum</p>
                <Badge className={`text-[10px] ${mom.bg} ${mom.color} border-0`}>
                  {momentum.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <Separator className="bg-white/10" />

        {/* Whale Info */}
        <div className="rounded-lg bg-white/5 border border-white/5 p-4">
          <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-3">
            <Copy className="w-4 h-4 text-cyan-400" />
            Copied From Whale
          </h3>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 flex items-center justify-center">
              <Zap className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{whaleName}</p>
              <p className="text-xs text-muted-foreground">Followed whale • Top performer</p>
            </div>
            <div className="flex gap-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Win Rate</p>
                <p className="text-sm font-bold text-green-400">{whaleWinRate}%</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">ROI</p>
                <p className="text-sm font-bold text-cyan-400">+{whaleRoi}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Management */}
        <div className="rounded-lg bg-white/5 border border-white/5 p-4">
          <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-3">
            <Shield className="w-4 h-4 text-yellow-400" />
            Risk Management
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <StopCircle className="w-4 h-4 text-red-400 shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground">Stop Loss</p>
                <p className="text-xs font-medium text-red-400">-{stopLoss}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-green-400 shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground">Take Profit</p>
                <p className="text-xs font-medium text-green-400">+{takeProfit}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-purple-400 shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground">Max Position</p>
                <p className="text-xs font-medium">{maxPosition.toFixed(1)} SOL</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground">Slippage</p>
                <p className="text-xs font-medium">{slippageTolerance}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          {(status === 'executed' || position) && (
            <Button
              className="flex-1 bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 hover:text-red-300"
              onClick={() => {
                if (position && onClosePosition) {
                  onClosePosition(position);
                } else if (trade) {
                  onCancelTrade?.(trade.id);
                }
                onOpenChange(false);
              }}
            >
              <X className="w-4 h-4 mr-1.5" />
              {position ? 'Close Position' : 'Close Position'}
            </Button>
          )}
          {status === 'pending' && trade && (
            <Button
              className="flex-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/30 hover:text-yellow-300"
              onClick={() => {
                onCancelTrade?.(trade.id);
                onOpenChange(false);
              }}
            >
              <StopCircle className="w-4 h-4 mr-1.5" />
              Cancel Trade
            </Button>
          )}
          {status === 'failed' && trade && (
            <Button
              className="flex-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/30 hover:text-yellow-300"
              onClick={() => {
                onRetryTrade?.(trade.id);
                onOpenChange(false);
              }}
            >
              <RefreshCw className="w-4 h-4 mr-1.5" />
              Retry Trade
            </Button>
          )}
          {status === 'cancelled' && trade && (
            <Button
              className="flex-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30 hover:text-purple-300"
              onClick={() => {
                onRetryTrade?.(trade.id);
                onOpenChange(false);
              }}
            >
              <RefreshCw className="w-4 h-4 mr-1.5" />
              Restart Trade
            </Button>
          )}
          <Button
            variant="ghost"
            className="flex-1 border border-white/10 hover:bg-white/5"
            onClick={() => onOpenChange(false)}
          >
            Dismiss
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
