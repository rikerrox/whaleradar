'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  ScanSearch, Search, Filter, TrendingUp, TrendingDown,
  Shield, AlertTriangle, Eye, Star, ArrowUpRight, ArrowDownRight,
  LayoutGrid, List, Clock, Users, Volume2, DollarSign,
  Zap, ShieldCheck, ChevronRight, BarChart3, Activity,
  Layers, Flame,
} from 'lucide-react';
import { shortAddress } from '@/lib/mock-data';
import type { MemeToken } from '@/lib/types';

// ─── Helpers ──────────────────────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function formatPrice(p: number): string {
  if (p >= 1) return `$${p.toFixed(2)}`;
  if (p >= 0.01) return `$${p.toFixed(4)}`;
  if (p >= 0.0001) return `$${p.toFixed(6)}`;
  return `$${p.toFixed(10)}`;
}

function tokenInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Deterministic color from token symbol
function tokenColor(symbol: string): string {
  const colors = [
    'from-purple-500 to-fuchsia-500',
    'from-cyan-500 to-blue-500',
    'from-green-500 to-emerald-500',
    'from-orange-500 to-amber-500',
    'from-pink-500 to-rose-500',
    'from-violet-500 to-indigo-500',
    'from-teal-500 to-cyan-500',
    'from-red-500 to-orange-500',
    'from-lime-500 to-green-500',
    'from-sky-500 to-indigo-500',
  ];
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function rugRiskColor(risk: number): { bar: string; text: string; bg: string } {
  if (risk <= 25) return { bar: 'bg-green-500', text: 'text-green-400', bg: 'bg-green-500/15' };
  if (risk <= 50) return { bar: 'bg-yellow-500', text: 'text-yellow-400', bg: 'bg-yellow-500/15' };
  if (risk <= 75) return { bar: 'bg-orange-500', text: 'text-orange-400', bg: 'bg-orange-500/15' };
  return { bar: 'bg-red-500', text: 'text-red-400', bg: 'bg-red-500/15' };
}

function trustScoreBadge(score: number): { text: string; bg: string; border: string; label: string } {
  if (score >= 80) return { text: 'text-green-400', bg: 'bg-green-500/15', border: 'border-green-500/30', label: 'High Trust' };
  if (score >= 60) return { text: 'text-cyan-400', bg: 'bg-cyan-500/15', border: 'border-cyan-500/30', label: 'Moderate' };
  if (score >= 40) return { text: 'text-yellow-400', bg: 'bg-yellow-500/15', border: 'border-yellow-500/30', label: 'Caution' };
  return { text: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/30', label: 'Low Trust' };
}

// Generate sparkline data from a token
function generateSparkline(token: MemeToken): number[] {
  const points: number[] = [];
  let val = token.price * (1 - token.priceChange24h / 100);
  for (let i = 0; i < 20; i++) {
    val *= 1 + (Math.random() - 0.45) * 0.05;
    val = Math.max(val, 0);
    points.push(val);
  }
  return points;
}

// Age to hours for sorting
function ageToHours(age: string): number {
  if (age.includes('m')) return parseInt(age) / 60;
  if (age.includes('h')) return parseInt(age);
  if (age.includes('d')) return parseInt(age) * 24;
  if (age.includes('w')) return parseInt(age) * 168;
  if (age.includes('M') || age.includes('mo')) return parseInt(age) * 720;
  return 9999;
}

// Sort type
type SortKey = 'volume' | 'marketCap' | 'priceChange' | 'whaleCount' | 'trustScore';

const AGE_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: '<1h', label: '< 1h' },
  { value: '<6h', label: '< 6h' },
  { value: '<12h', label: '< 12h' },
  { value: '<1d', label: '< 1d' },
  { value: '<3d', label: '< 3d' },
  { value: '<1w', label: '< 1w' },
  { value: '<1m', label: '< 1m' },
] as const;

const AGE_HOUR_MAP: Record<string, number> = {
  '<1h': 1,
  '<6h': 6,
  '<12h': 12,
  '<1d': 24,
  '<3d': 72,
  '<1w': 168,
  '<1m': 720,
};

// ─── Mini Sparkline ───────────────────────────────────────────────
function MiniSparkline({ data, positive, width = 80, height = 28 }: { data: number[]; positive: boolean; width?: number; height?: number }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });
  const color = positive ? '#22c55e' : '#ef4444';
  return (
    <svg width={width} height={height} className="flex-shrink-0">
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Trending Banner ──────────────────────────────────────────────
function TrendingBanner({ tokens, onTokenClick }: { tokens: MemeToken[]; onTokenClick: (t: MemeToken) => void }) {
  const trending = useMemo(() => tokens.filter((t) => t.isTrending).slice(0, 5), [tokens]);
  const sparklines = useMemo(() => {
    const map = new Map<string, number[]>();
    trending.forEach((t) => map.set(t.id, generateSparkline(t)));
    return map;
  }, [trending]);

  if (trending.length === 0) return null;

  return (
    <div className="relative">
      <div className="flex items-center gap-2 mb-2">
        <Flame className="w-4 h-4 text-orange-400" />
        <span className="text-xs font-semibold text-orange-400 uppercase tracking-wider">Trending Now</span>
      </div>
      <ScrollArea className="w-full">
        <div className="flex gap-3 pb-2" style={{ minWidth: 0 }}>
          {trending.map((token, idx) => {
            const isPositive = token.priceChange24h >= 0;
            const spark = sparklines.get(token.id) || [];
            return (
              <motion.div
                key={token.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.08, duration: 0.3 }}
              >
                <Card
                  className="glass-card glass-card-hover cursor-pointer min-w-[200px] max-w-[240px] flex-shrink-0 transition-all duration-300 hover:scale-[1.02]"
                  onClick={() => onTokenClick(token)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${tokenColor(token.symbol)} flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0`}>
                        {tokenInitials(token.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold truncate">{token.symbol}</span>
                          <Flame className="w-3 h-3 text-orange-400 flex-shrink-0" />
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">{token.name}</p>
                      </div>
                      <div className={`flex items-center gap-0.5 text-xs font-bold flex-shrink-0 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {isPositive ? '+' : ''}{token.priceChange24h.toFixed(1)}%
                      </div>
                    </div>
                    <div className="flex items-end justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold">{formatPrice(token.price)}</p>
                        <p className="text-[10px] text-muted-foreground">Vol {formatNumber(token.volume24h)}</p>
                      </div>
                      <MiniSparkline data={spark} positive={isPositive} width={72} height={24} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

// ─── Quick Stats Bar ──────────────────────────────────────────────
function QuickStatsBar({ tokens }: { tokens: MemeToken[] }) {
  const stats = useMemo(() => {
    const total = tokens.length;
    const newLastHour = tokens.filter((t) => ageToHours(t.age) <= 1).length;
    const whaleEntriesToday = tokens.reduce((s, t) => s + t.whaleCount, 0);
    const avgTrust = total > 0 ? tokens.reduce((s, t) => s + t.trustScore, 0) / total : 0;
    return { total, newLastHour, whaleEntriesToday, avgTrust };
  }, [tokens]);

  const items = [
    { icon: Layers, label: 'Total Scanned', value: stats.total.toLocaleString(), color: 'text-purple-400', iconColor: 'text-purple-400' },
    { icon: Zap, label: 'New (1h)', value: stats.newLastHour.toLocaleString(), color: 'text-cyan-400', iconColor: 'text-cyan-400' },
    { icon: Users, label: 'Whale Entries', value: formatCount(stats.whaleEntriesToday), color: 'text-green-400', iconColor: 'text-green-400' },
    { icon: ShieldCheck, label: 'Avg Trust', value: `${stats.avgTrust.toFixed(0)}%`, color: 'text-yellow-400', iconColor: 'text-yellow-400' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map((item) => (
        <Card key={item.label} className="glass-card">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
              <item.icon className={`w-4.5 h-4.5 ${item.iconColor}`} />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">{item.label}</p>
              <p className={`text-sm font-bold ${item.color}`}>{item.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Filters Panel ────────────────────────────────────────────────
function FiltersPanel({
  minLiquidity,
  setMinLiquidity,
  minVolume,
  setMinVolume,
  maxAge,
  setMaxAge,
  minHolders,
  setMinHolders,
  minWhales,
  setMinWhales,
  maxRugRisk,
  setMaxRugRisk,
  verifiedOnly,
  setVerifiedOnly,
  sortBy,
  setSortBy,
  showFilters,
}: {
  minLiquidity: number;
  setMinLiquidity: (v: number) => void;
  minVolume: number;
  setMinVolume: (v: number) => void;
  maxAge: string;
  setMaxAge: (v: string) => void;
  minHolders: number;
  setMinHolders: (v: number) => void;
  minWhales: number;
  setMinWhales: (v: number) => void;
  maxRugRisk: number;
  setMaxRugRisk: (v: number) => void;
  verifiedOnly: boolean;
  setVerifiedOnly: (v: boolean) => void;
  sortBy: SortKey;
  setSortBy: (v: SortKey) => void;
  showFilters: boolean;
}) {
  return (
    <AnimatePresence>
      {showFilters && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {/* Min Liquidity */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <DollarSign className="w-3 h-3 text-green-400" />
                      Min Liquidity
                    </label>
                    <span className="text-xs font-medium text-green-400">{formatNumber(minLiquidity)}</span>
                  </div>
                  <Slider
                    value={[minLiquidity]}
                    onValueChange={([v]) => setMinLiquidity(v)}
                    min={0}
                    max={10000000}
                    step={50000}
                    className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:bg-green-400 [&_[role=slider]]:border-0"
                  />
                </div>

                {/* Min Volume 24h */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Volume2 className="w-3 h-3 text-cyan-400" />
                      Min Volume 24h
                    </label>
                    <span className="text-xs font-medium text-cyan-400">{formatNumber(minVolume)}</span>
                  </div>
                  <Slider
                    value={[minVolume]}
                    onValueChange={([v]) => setMinVolume(v)}
                    min={0}
                    max={50000000}
                    step={100000}
                    className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:bg-cyan-400 [&_[role=slider]]:border-0"
                  />
                </div>

                {/* Max Age */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-purple-400" />
                      Max Age
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {AGE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setMaxAge(opt.value)}
                        className={`text-[10px] px-2 py-1 rounded-md border transition-all duration-200 ${
                          maxAge === opt.value
                            ? 'bg-purple-500/20 text-purple-400 border-purple-500/40'
                            : 'bg-white/5 text-muted-foreground border-white/5 hover:bg-white/10 hover:border-white/10'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Min Holders */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Users className="w-3 h-3 text-amber-400" />
                      Min Holders
                    </label>
                    <span className="text-xs font-medium text-amber-400">{formatCount(minHolders)}</span>
                  </div>
                  <Slider
                    value={[minHolders]}
                    onValueChange={([v]) => setMinHolders(v)}
                    min={0}
                    max={100000}
                    step={500}
                    className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:bg-amber-400 [&_[role=slider]]:border-0"
                  />
                </div>

                {/* Min Whales */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Activity className="w-3 h-3 text-fuchsia-400" />
                      Min Whales
                    </label>
                    <span className="text-xs font-medium text-fuchsia-400">{minWhales}</span>
                  </div>
                  <Slider
                    value={[minWhales]}
                    onValueChange={([v]) => setMinWhales(v)}
                    min={0}
                    max={50}
                    step={1}
                    className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:bg-fuchsia-400 [&_[role=slider]]:border-0"
                  />
                </div>

                {/* Max Rug Risk */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <AlertTriangle className="w-3 h-3 text-red-400" />
                      Max Rug Risk
                    </label>
                    <span className="text-xs font-medium text-red-400">{maxRugRisk}</span>
                  </div>
                  <Slider
                    value={[maxRugRisk]}
                    onValueChange={([v]) => setMaxRugRisk(v)}
                    min={0}
                    max={100}
                    step={5}
                    className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:bg-red-400 [&_[role=slider]]:border-0"
                  />
                </div>

                {/* Verified Only */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <ShieldCheck className="w-3 h-3 text-green-400" />
                      Verified Only
                    </label>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Switch
                      checked={verifiedOnly}
                      onCheckedChange={setVerifiedOnly}
                    />
                    <span className={`text-xs ${verifiedOnly ? 'text-green-400' : 'text-muted-foreground'}`}>
                      {verifiedOnly ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>

                {/* Sort By */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <BarChart3 className="w-3 h-3 text-purple-400" />
                      Sort By
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(
                      [
                        { key: 'volume', label: 'Volume' },
                        { key: 'marketCap', label: 'Mkt Cap' },
                        { key: 'priceChange', label: 'Price Chg' },
                        { key: 'whaleCount', label: 'Whales' },
                        { key: 'trustScore', label: 'Trust' },
                      ] as { key: SortKey; label: string }[]
                    ).map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => setSortBy(key)}
                        className={`text-[10px] px-2 py-1 rounded-md border transition-all duration-200 ${
                          sortBy === key
                            ? 'bg-purple-500/20 text-purple-400 border-purple-500/40'
                            : 'bg-white/5 text-muted-foreground border-white/5 hover:bg-white/10 hover:border-white/10'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Token Card (Grid View) ───────────────────────────────────────
function TokenCard({
  token,
  onViewDetails,
}: {
  token: MemeToken;
  onViewDetails: (t: MemeToken) => void;
}) {
  const isPositive = token.priceChange24h >= 0;
  const risk = rugRiskColor(token.rugRisk);
  const trust = trustScoreBadge(token.trustScore);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
    >
      <Card className="glass-card glass-card-hover transition-all duration-300 h-full flex flex-col">
        <CardContent className="p-4 flex flex-col flex-1">
          {/* Header: Avatar + Name + Badges */}
          <div className="flex items-start gap-2.5 mb-3">
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${tokenColor(token.symbol)} flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}>
              {tokenInitials(token.name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-sm font-bold truncate">{token.symbol}</span>
                {token.isVerified && (
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                )}
                {token.isTrending && (
                  <Flame className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                )}
              </div>
              <p className="text-[10px] text-muted-foreground truncate">{token.name}</p>
            </div>
            {/* Price + Change */}
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold">{formatPrice(token.price)}</p>
              <p className={`text-xs font-semibold flex items-center justify-end gap-0.5 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {isPositive ? '+' : ''}{token.priceChange24h.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 mb-3">
            <div>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Volume2 className="w-2.5 h-2.5" />Volume 24h</p>
              <p className="text-xs font-semibold">{formatNumber(token.volume24h)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1"><BarChart3 className="w-2.5 h-2.5" />Market Cap</p>
              <p className="text-xs font-semibold">{formatNumber(token.marketCap)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1"><DollarSign className="w-2.5 h-2.5" />Liquidity</p>
              <p className="text-xs font-semibold">{formatNumber(token.liquidity)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Users className="w-2.5 h-2.5" />Holders</p>
              <p className="text-xs font-semibold">{formatCount(token.holderCount)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Activity className="w-2.5 h-2.5" />Whales</p>
              <p className="text-xs font-semibold text-fuchsia-400">{token.whaleCount}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="w-2.5 h-2.5" />Age</p>
              <p className="text-xs font-semibold">{token.age}</p>
            </div>
          </div>

          {/* Rug Risk */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="w-2.5 h-2.5" /> Rug Risk
              </span>
              <span className={`text-[10px] font-bold ${risk.text}`}>{token.rugRisk}/100</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${token.rugRisk}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className={`h-full rounded-full ${risk.bar}`}
              />
            </div>
          </div>

          {/* Badges Row */}
          <div className="flex flex-wrap gap-1 mb-3">
            {/* Trust Score Badge */}
            <span className={`text-[9px] px-1.5 py-0.5 rounded-md border font-semibold ${trust.bg} ${trust.text} ${trust.border}`}>
              <Shield className="w-2.5 h-2.5 inline mr-0.5" />
              {token.trustScore}% {trust.label}
            </span>
            {/* Age Badge */}
            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-white/5 text-muted-foreground border border-white/5">
              <Clock className="w-2.5 h-2.5 inline mr-0.5" />
              {token.age}
            </span>
            {token.isVerified && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-blue-500/15 text-blue-400 border border-blue-500/30">
                <ShieldCheck className="w-2.5 h-2.5 inline mr-0.5" />
                Verified
              </span>
            )}
            {token.isTrending && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-orange-500/15 text-orange-400 border border-orange-500/30">
                <Flame className="w-2.5 h-2.5 inline mr-0.5" />
                Trending
              </span>
            )}
          </div>

          {/* DEX + Chain */}
          <div className="flex items-center gap-2 mb-3 text-[10px] text-muted-foreground">
            <span className="px-1.5 py-0.5 rounded bg-white/5">{token.dex}</span>
            <span className="px-1.5 py-0.5 rounded bg-white/5 capitalize">{token.chain}</span>
          </div>

          {/* Action Button */}
          <div className="mt-auto">
            <Button
              className="w-full gap-1.5 text-xs bg-purple-600 hover:bg-purple-700 text-white h-8"
              onClick={() => onViewDetails(token)}
            >
              <Eye className="w-3.5 h-3.5" />
              View Details
              <ChevronRight className="w-3 h-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Token Row (List View) ────────────────────────────────────────
function TokenRow({
  token,
  onViewDetails,
}: {
  token: MemeToken;
  onViewDetails: (t: MemeToken) => void;
}) {
  const isPositive = token.priceChange24h >= 0;
  const risk = rugRiskColor(token.rugRisk);
  const trust = trustScoreBadge(token.trustScore);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="glass-card glass-card-hover transition-all duration-300 cursor-pointer"
        onClick={() => onViewDetails(token)}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${tokenColor(token.symbol)} flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0`}>
              {tokenInitials(token.name)}
            </div>

            {/* Name + Symbol + Badges */}
            <div className="min-w-0 w-[140px] flex-shrink-0">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold truncate">{token.symbol}</span>
                {token.isVerified && <ShieldCheck className="w-3 h-3 text-blue-400 flex-shrink-0" />}
                {token.isTrending && <Flame className="w-3 h-3 text-orange-400 flex-shrink-0" />}
              </div>
              <p className="text-[10px] text-muted-foreground truncate">{token.name}</p>
            </div>

            {/* Price + Change */}
            <div className="w-[100px] flex-shrink-0">
              <p className="text-xs font-bold">{formatPrice(token.price)}</p>
              <p className={`text-[10px] font-semibold flex items-center gap-0.5 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {isPositive ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                {isPositive ? '+' : ''}{token.priceChange24h.toFixed(1)}%
              </p>
            </div>

            {/* Volume */}
            <div className="w-[80px] flex-shrink-0 hidden md:block">
              <p className="text-[10px] text-muted-foreground">Vol 24h</p>
              <p className="text-xs font-semibold">{formatNumber(token.volume24h)}</p>
            </div>

            {/* Market Cap */}
            <div className="w-[80px] flex-shrink-0 hidden md:block">
              <p className="text-[10px] text-muted-foreground">Mkt Cap</p>
              <p className="text-xs font-semibold">{formatNumber(token.marketCap)}</p>
            </div>

            {/* Liquidity */}
            <div className="w-[70px] flex-shrink-0 hidden lg:block">
              <p className="text-[10px] text-muted-foreground">Liquidity</p>
              <p className="text-xs font-semibold">{formatNumber(token.liquidity)}</p>
            </div>

            {/* Holders */}
            <div className="w-[60px] flex-shrink-0 hidden lg:block">
              <p className="text-[10px] text-muted-foreground">Holders</p>
              <p className="text-xs font-semibold">{formatCount(token.holderCount)}</p>
            </div>

            {/* Whales */}
            <div className="w-[50px] flex-shrink-0 hidden xl:block">
              <p className="text-[10px] text-muted-foreground">Whales</p>
              <p className="text-xs font-semibold text-fuchsia-400">{token.whaleCount}</p>
            </div>

            {/* Rug Risk mini bar */}
            <div className="w-[60px] flex-shrink-0 hidden sm:block">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[9px] text-muted-foreground">Risk</span>
                <span className={`text-[9px] font-bold ${risk.text}`}>{token.rugRisk}</span>
              </div>
              <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${token.rugRisk}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className={`h-full rounded-full ${risk.bar}`}
                />
              </div>
            </div>

            {/* Trust Badge */}
            <div className="w-[70px] flex-shrink-0 hidden xl:block">
              <span className={`text-[9px] px-1.5 py-0.5 rounded-md border font-semibold ${trust.bg} ${trust.text} ${trust.border}`}>
                {token.trustScore}%
              </span>
            </div>

            {/* Age */}
            <div className="w-[40px] flex-shrink-0 hidden sm:block">
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground">
                {token.age}
              </span>
            </div>

            {/* Action */}
            <div className="ml-auto flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails(token);
                }}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Main Scanner View ────────────────────────────────────────────
export function ScannerView() {
  const { tokens, setCurrentPage, setSelectedTokenAddress } = useAppStore();

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [minLiquidity, setMinLiquidity] = useState(0);
  const [minVolume, setMinVolume] = useState(0);
  const [maxAge, setMaxAge] = useState('all');
  const [minHolders, setMinHolders] = useState(0);
  const [minWhales, setMinWhales] = useState(0);
  const [maxRugRisk, setMaxRugRisk] = useState(100);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>('volume');

  // View mode
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Handle token click -> navigate to coin-details
  const handleViewDetails = (token: MemeToken) => {
    setSelectedTokenAddress(token.address);
    setCurrentPage('coin-details');
  };

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (minLiquidity > 0) count++;
    if (minVolume > 0) count++;
    if (maxAge !== 'all') count++;
    if (minHolders > 0) count++;
    if (minWhales > 0) count++;
    if (maxRugRisk < 100) count++;
    if (verifiedOnly) count++;
    return count;
  }, [minLiquidity, minVolume, maxAge, minHolders, minWhales, maxRugRisk, verifiedOnly]);

  // Apply filters + sort
  const filteredTokens = useMemo(() => {
    let result = [...tokens];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.symbol.toLowerCase().includes(q) ||
          t.name.toLowerCase().includes(q) ||
          t.address.toLowerCase().includes(q)
      );
    }

    // Min Liquidity
    if (minLiquidity > 0) {
      result = result.filter((t) => t.liquidity >= minLiquidity);
    }

    // Min Volume
    if (minVolume > 0) {
      result = result.filter((t) => t.volume24h >= minVolume);
    }

    // Max Age
    if (maxAge !== 'all') {
      const maxHours = AGE_HOUR_MAP[maxAge] ?? 9999;
      result = result.filter((t) => ageToHours(t.age) <= maxHours);
    }

    // Min Holders
    if (minHolders > 0) {
      result = result.filter((t) => t.holderCount >= minHolders);
    }

    // Min Whales
    if (minWhales > 0) {
      result = result.filter((t) => t.whaleCount >= minWhales);
    }

    // Max Rug Risk
    if (maxRugRisk < 100) {
      result = result.filter((t) => t.rugRisk <= maxRugRisk);
    }

    // Verified Only
    if (verifiedOnly) {
      result = result.filter((t) => t.isVerified);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'volume':
          return b.volume24h - a.volume24h;
        case 'marketCap':
          return b.marketCap - a.marketCap;
        case 'priceChange':
          return b.priceChange24h - a.priceChange24h;
        case 'whaleCount':
          return b.whaleCount - a.whaleCount;
        case 'trustScore':
          return b.trustScore - a.trustScore;
        default:
          return 0;
      }
    });

    return result;
  }, [tokens, searchQuery, minLiquidity, minVolume, maxAge, minHolders, minWhales, maxRugRisk, verifiedOnly, sortBy]);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setMinLiquidity(0);
    setMinVolume(0);
    setMaxAge('all');
    setMinHolders(0);
    setMinWhales(0);
    setMaxRugRisk(100);
    setVerifiedOnly(false);
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <ScanSearch className="w-5 h-5 text-purple-400" />
            Meme Coin Scanner
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Discover and analyze meme tokens across Solana DEXes
          </p>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <QuickStatsBar tokens={tokens} />

      {/* Trending Banner */}
      <TrendingBanner tokens={tokens} onTokenClick={handleViewDetails} />

      {/* Search + Filter Toggle + View Toggle */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by token name, symbol, or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-white/5 border-white/10 text-sm placeholder:text-muted-foreground/50 focus:border-purple-500/50"
              />
            </div>

            {/* Filter Button */}
            <Button
              variant={showFilters ? 'default' : 'outline'}
              size="sm"
              className={`h-9 gap-1.5 text-xs flex-shrink-0 ${
                showFilters
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'border-white/10 hover:border-purple-500/50 hover:bg-purple-500/10'
              }`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-3.5 h-3.5" />
              Filters
              {activeFilterCount > 0 && (
                <Badge className="ml-1 h-4 min-w-4 text-[9px] p-0 flex items-center justify-center bg-purple-500 text-white">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>

            {/* View Toggle */}
            <div className="flex items-center gap-0.5 p-0.5 rounded-md bg-white/5 flex-shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'list'
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expandable Filters */}
      <FiltersPanel
        minLiquidity={minLiquidity}
        setMinLiquidity={setMinLiquidity}
        minVolume={minVolume}
        setMinVolume={setMinVolume}
        maxAge={maxAge}
        setMaxAge={setMaxAge}
        minHolders={minHolders}
        setMinHolders={setMinHolders}
        minWhales={minWhales}
        setMinWhales={setMinWhales}
        maxRugRisk={maxRugRisk}
        setMaxRugRisk={setMaxRugRisk}
        verifiedOnly={verifiedOnly}
        setVerifiedOnly={setVerifiedOnly}
        sortBy={sortBy}
        setSortBy={setSortBy}
        showFilters={showFilters}
      />

      {/* Results count */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {filteredTokens.length} token{filteredTokens.length !== 1 ? 's' : ''} found
        </span>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[10px] text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
            onClick={clearFilters}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Token Grid / List */}
      {filteredTokens.length > 0 ? (
        viewMode === 'grid' ? (
          <ScrollArea className="h-[calc(100vh-520px)]">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pr-1 pb-4">
              <AnimatePresence mode="popLayout">
                {filteredTokens.map((token) => (
                  <TokenCard
                    key={token.id}
                    token={token}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
        ) : (
          <ScrollArea className="h-[calc(100vh-520px)]">
            <div className="space-y-2 pr-1 pb-4">
              <AnimatePresence mode="popLayout">
                {filteredTokens.map((token) => (
                  <TokenRow
                    key={token.id}
                    token={token}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
        )
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <ScanSearch className="w-12 h-12 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No tokens match your filters</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Try adjusting your search or filter criteria</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 text-xs border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
            onClick={clearFilters}
          >
            Clear All Filters
          </Button>
        </motion.div>
      )}
    </div>
  );
}
