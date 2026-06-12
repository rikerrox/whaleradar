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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Radar, Search, Filter, Star, Copy, Eye, TrendingUp,
  TrendingDown, Wallet, Users, Shield, Zap, ExternalLink,
  ChevronRight, ArrowUpRight, ArrowDownRight, Clock,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { shortAddress, randomBetween, generateTokenChartData } from '@/lib/mock-data';
import type { WhaleWallet } from '@/lib/types';

// ─── Tag color map ───────────────────────────────────────────────
const TAG_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'early-buyer':     { bg: 'bg-yellow-500/15',  text: 'text-yellow-400',  border: 'border-yellow-500/30' },
  'degen':           { bg: 'bg-red-500/15',      text: 'text-red-400',     border: 'border-red-500/30' },
  'memecoin-whale':  { bg: 'bg-purple-500/15',   text: 'text-purple-400',  border: 'border-purple-500/30' },
  'smart-money':     { bg: 'bg-cyan-500/15',     text: 'text-cyan-400',    border: 'border-cyan-500/30' },
  'sniper':          { bg: 'bg-orange-500/15',   text: 'text-orange-400',  border: 'border-orange-500/30' },
  'diamond-hands':   { bg: 'bg-green-500/15',    text: 'text-green-400',   border: 'border-green-500/30' },
  'high-frequency':  { bg: 'bg-blue-500/15',     text: 'text-blue-400',    border: 'border-blue-500/30' },
  'new-launches':    { bg: 'bg-pink-500/15',     text: 'text-pink-400',    border: 'border-pink-500/30' },
  'whale':           { bg: 'bg-indigo-500/15',   text: 'text-indigo-400',  border: 'border-indigo-500/30' },
  'low-risk':        { bg: 'bg-emerald-500/15',  text: 'text-emerald-400', border: 'border-emerald-500/30' },
  'long-term':       { bg: 'bg-teal-500/15',     text: 'text-teal-400',    border: 'border-teal-500/30' },
  'ape':             { bg: 'bg-rose-500/15',     text: 'text-rose-400',    border: 'border-rose-500/30' },
  'high-volume':     { bg: 'bg-amber-500/15',    text: 'text-amber-400',   border: 'border-amber-500/30' },
  'scalper':         { bg: 'bg-lime-500/15',     text: 'text-lime-400',    border: 'border-lime-500/30' },
  'fast-exits':      { bg: 'bg-fuchsia-500/15',  text: 'text-fuchsia-400', border: 'border-fuchsia-500/30' },
  'analytical':      { bg: 'bg-sky-500/15',      text: 'text-sky-400',     border: 'border-sky-500/30' },
  'insider':         { bg: 'bg-red-500/15',      text: 'text-red-300',     border: 'border-red-400/30' },
};

const DEFAULT_TAG_STYLE = { bg: 'bg-gray-500/15', text: 'text-gray-400', border: 'border-gray-500/30' };

function tagStyle(tag: string) {
  return TAG_COLORS[tag] ?? DEFAULT_TAG_STYLE;
}

// ─── Confidence color helper ─────────────────────────────────────
function confidenceColor(score: number) {
  if (score >= 85) return 'text-green-400';
  if (score >= 70) return 'text-cyan-400';
  if (score >= 55) return 'text-yellow-400';
  return 'text-red-400';
}

function confidenceBg(score: number) {
  if (score >= 85) return 'bg-green-500/15 border-green-500/30';
  if (score >= 70) return 'bg-cyan-500/15 border-cyan-500/30';
  if (score >= 55) return 'bg-yellow-500/15 border-yellow-500/30';
  return 'bg-red-500/15 border-red-500/30';
}

function confidenceProgressColor(score: number) {
  if (score >= 85) return '[&>div]:bg-green-500';
  if (score >= 70) return '[&>div]:bg-cyan-500';
  if (score >= 55) return '[&>div]:bg-yellow-500';
  return '[&>div]:bg-red-500';
}

// ─── Generate PnL chart data for a whale ─────────────────────────
function generateWhalePnlData(whale: WhaleWallet) {
  const data: { time: string; pnl: number }[] = [];
  let pnl = 0;
  for (let i = 30; i >= 0; i--) {
    pnl += randomBetween(-200, whale.roi > 0 ? 350 : 150);
    data.push({
      time: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      pnl: Number(pnl.toFixed(2)),
    });
  }
  return data;
}

// ─── Available tags for filter ────────────────────────────────────
const ALL_TAGS = [
  'early-buyer', 'degen', 'memecoin-whale', 'smart-money', 'sniper',
  'diamond-hands', 'high-frequency', 'new-launches', 'whale',
  'low-risk', 'long-term', 'ape', 'high-volume', 'scalper',
  'fast-exits', 'analytical', 'insider',
];

// ─── Search & Filters ────────────────────────────────────────────
function SearchAndFilters({
  searchQuery,
  setSearchQuery,
  minConfidence,
  setMinConfidence,
  selectedTags,
  toggleTag,
  minRoi,
  setMinRoi,
  minWinRate,
  setMinWinRate,
  showFilters,
  setShowFilters,
}: {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  minConfidence: number;
  setMinConfidence: (v: number) => void;
  selectedTags: string[];
  toggleTag: (tag: string) => void;
  minRoi: number;
  setMinRoi: (v: number) => void;
  minWinRate: number;
  setMinWinRate: (v: number) => void;
  showFilters: boolean;
  setShowFilters: (v: boolean) => void;
}) {
  return (
    <Card className="glass-card">
      <CardContent className="p-4">
        {/* Search Row */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by wallet address or label..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-white/5 border-white/10 text-sm placeholder:text-muted-foreground/50 focus:border-purple-500/50"
            />
          </div>
          <Button
            variant={showFilters ? 'default' : 'outline'}
            size="sm"
            className={`h-9 gap-1.5 text-xs ${
              showFilters
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'border-white/10 hover:border-purple-500/50 hover:bg-purple-500/10'
            }`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-3.5 h-3.5" />
            Filters
            {(minConfidence > 0 || selectedTags.length > 0 || minRoi > -100 || minWinRate > 0) && (
              <Badge className="ml-1 h-4 min-w-4 text-[9px] p-0 flex items-center justify-center bg-purple-500 text-white">
                {(minConfidence > 0 ? 1 : 0) + (selectedTags.length > 0 ? 1 : 0) + (minRoi > -100 ? 1 : 0) + (minWinRate > 0 ? 1 : 0)}
              </Badge>
            )}
          </Button>
        </div>

        {/* Expandable Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-4 pt-4 border-t border-white/5">
                {/* Confidence */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Shield className="w-3 h-3 text-cyan-400" />
                      Min Confidence
                    </label>
                    <span className="text-xs font-medium text-cyan-400">{minConfidence}%</span>
                  </div>
                  <Slider
                    value={[minConfidence]}
                    onValueChange={([v]) => setMinConfidence(v)}
                    min={0}
                    max={100}
                    step={5}
                    className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:bg-cyan-400 [&_[role=slider]]:border-0"
                  />
                </div>

                {/* Min ROI */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <TrendingUp className="w-3 h-3 text-green-400" />
                      Min ROI
                    </label>
                    <span className="text-xs font-medium text-green-400">{minRoi}%</span>
                  </div>
                  <Slider
                    value={[minRoi]}
                    onValueChange={([v]) => setMinRoi(v)}
                    min={-100}
                    max={500}
                    step={10}
                    className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:bg-green-400 [&_[role=slider]]:border-0"
                  />
                </div>

                {/* Win Rate */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Zap className="w-3 h-3 text-purple-400" />
                      Min Win Rate
                    </label>
                    <span className="text-xs font-medium text-purple-400">{minWinRate}%</span>
                  </div>
                  <Slider
                    value={[minWinRate]}
                    onValueChange={([v]) => setMinWinRate(v)}
                    min={0}
                    max={100}
                    step={5}
                    className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:bg-purple-400 [&_[role=slider]]:border-0"
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="mt-4 pt-4 border-t border-white/5">
                <label className="text-xs text-muted-foreground flex items-center gap-1.5 mb-2.5">
                  <Radar className="w-3 h-3 text-purple-400" />
                  Tags
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_TAGS.map((tag) => {
                    const active = selectedTags.includes(tag);
                    const style = tagStyle(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`text-[10px] px-2 py-0.5 rounded-full border transition-all duration-200 ${
                          active
                            ? `${style.bg} ${style.text} ${style.border}`
                            : 'bg-white/5 text-muted-foreground border-transparent hover:bg-white/10'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

// ─── Whale Card (list item) ──────────────────────────────────────
function WhaleCard({
  whale,
  isSelected,
  onSelect,
  onNavigate,
  onFollowToggle,
}: {
  whale: WhaleWallet;
  isSelected: boolean;
  onSelect: (w: WhaleWallet) => void;
  onNavigate: (w: WhaleWallet) => void;
  onFollowToggle: (id: string) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={`glass-card glass-card-hover transition-all duration-300 cursor-pointer ${
          isSelected ? 'ring-1 ring-purple-500/60 neon-glow-purple' : ''
        }`}
        onClick={() => onSelect(whale)}
      >
        <CardContent className="p-4">
          {/* Top row: Address + Label + Confidence */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500/40 to-cyan-500/40 flex items-center justify-center flex-shrink-0">
                <Wallet className="w-4 h-4 text-purple-300" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold truncate max-w-[140px]">{whale.label}</span>
                  {whale.isFollowed && (
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs font-mono text-muted-foreground">
                  {shortAddress(whale.address)}
                </p>
              </div>
            </div>

            {/* Confidence badge */}
            <div className={`px-2 py-1 rounded-md border text-xs font-bold flex items-center gap-1 ${confidenceBg(whale.confidence)}`}>
              <Shield className="w-3 h-3" />
              <span className={confidenceColor(whale.confidence)}>{whale.confidence}%</span>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3 mb-3">
            {/* ROI */}
            <div>
              <p className="text-[10px] text-muted-foreground mb-0.5">ROI</p>
              <p className={`text-sm font-bold flex items-center gap-0.5 ${
                whale.roi >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {whale.roi >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {whale.roi >= 0 ? '+' : ''}{whale.roi}%
              </p>
            </div>
            {/* Win Rate */}
            <div>
              <p className="text-[10px] text-muted-foreground mb-0.5">Win Rate</p>
              <p className="text-sm font-bold">{whale.winRate}%</p>
            </div>
            {/* Total Trades */}
            <div>
              <p className="text-[10px] text-muted-foreground mb-0.5">Trades</p>
              <p className="text-sm font-bold">{whale.totalTrades.toLocaleString()}</p>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-3">
            {whale.tags.map((tag) => {
              const style = tagStyle(tag);
              return (
                <span
                  key={tag}
                  className={`text-[9px] px-1.5 py-0.5 rounded-full border ${style.bg} ${style.text} ${style.border}`}
                >
                  {tag}
                </span>
              );
            })}
          </div>

          {/* Bottom row: Followers + Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="w-3 h-3" />
              <span>{whale.followersCount.toLocaleString()} followers</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 gap-1 text-[10px] px-2 ${
                  whale.isFollowed
                    ? 'text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10'
                    : 'text-muted-foreground hover:text-purple-400 hover:bg-purple-500/10'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onFollowToggle(whale.id);
                }}
              >
                <Star className={`w-3 h-3 ${whale.isFollowed ? 'fill-yellow-400' : ''}`} />
                {whale.isFollowed ? 'Following' : 'Follow'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-[10px] px-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate(whale);
                }}
              >
                <Copy className="w-3 h-3" />
                Copy
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-[10px] px-2 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate(whale);
                }}
              >
                <Eye className="w-3 h-3" />
                View
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Whale Detail Panel ──────────────────────────────────────────
function WhaleDetailPanel({
  whale,
  onClose,
  onNavigate,
  onFollowToggle,
}: {
  whale: WhaleWallet;
  onClose: () => void;
  onNavigate: (w: WhaleWallet) => void;
  onFollowToggle: (id: string) => void;
}) {
  const pnlData = useMemo(() => [], [whale.id]);

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="w-full h-full"
    >
      <Card className="glass-card neon-glow-purple h-full flex flex-col">
        {/* Header */}
        <CardHeader className="pb-3 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/50 to-cyan-500/50 flex items-center justify-center flex-shrink-0">
                <Wallet className="w-5 h-5 text-purple-300" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold truncate">{whale.label}</h3>
                  {whale.isFollowed && (
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs font-mono text-muted-foreground">{shortAddress(whale.address)}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={onClose}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {/* Confidence Score */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Shield className="w-3 h-3 text-cyan-400" /> Confidence Score
                </span>
                <span className={`text-sm font-bold ${confidenceColor(whale.confidence)}`}>
                  {whale.confidence}%
                </span>
              </div>
              <Progress value={whale.confidence} className={`h-2 ${confidenceProgressColor(whale.confidence)}`} />
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-1.5 rounded-md bg-white/5">
                  <p className="text-[9px] text-muted-foreground">Track Record</p>
                  <p className="text-xs font-semibold text-cyan-400">N/A</p>
                </div>
                <div className="p-1.5 rounded-md bg-white/5">
                  <p className="text-[9px] text-muted-foreground">Consistency</p>
                  <p className="text-xs font-semibold text-green-400">N/A</p>
                </div>
                <div className="p-1.5 rounded-md bg-white/5">
                  <p className="text-[9px] text-muted-foreground">Risk Mgmt</p>
                  <p className="text-xs font-semibold text-purple-400">N/A</p>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                <p className="text-[10px] text-muted-foreground">Total PnL</p>
                <p className={`text-sm font-bold ${whale.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {whale.totalPnl >= 0 ? '+' : ''}${whale.totalPnl.toLocaleString()}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                <p className="text-[10px] text-muted-foreground">ROI</p>
                <p className={`text-sm font-bold ${whale.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {whale.roi >= 0 ? '+' : ''}{whale.roi}%
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                <p className="text-[10px] text-muted-foreground">Win Rate</p>
                <p className="text-sm font-bold">{whale.winRate}%</p>
              </div>
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                <p className="text-[10px] text-muted-foreground">Avg Hold</p>
                <p className="text-sm font-bold">{whale.avgHoldingTime}</p>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5">
              {whale.tags.map((tag) => {
                const style = tagStyle(tag);
                return (
                  <span
                    key={tag}
                    className={`text-[10px] px-2 py-0.5 rounded-full border ${style.bg} ${style.text} ${style.border}`}
                  >
                    {tag}
                  </span>
                );
              })}
            </div>

            {/* PnL Chart */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">30-Day PnL</span>
              </div>
              <div className="h-40 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">No PnL data yet</p>
                </div>
              </div>
            </div>

            {/* Recent Trades */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Recent Trades
                </span>
              </div>
              <div className="space-y-1.5">
                {whale.recentTrades.map((trade) => (
                  <div
                    key={trade.id}
                    className={`flex items-center gap-2 p-2 rounded-lg text-xs transition-colors ${
                      trade.type === 'buy'
                        ? 'bg-green-500/5 hover:bg-green-500/10'
                        : 'bg-red-500/5 hover:bg-red-500/10'
                    }`}
                  >
                    <Badge
                      variant="secondary"
                      className={`text-[9px] h-4 px-1.5 font-bold ${
                        trade.type === 'buy'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {trade.type.toUpperCase()}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">{trade.tokenSymbol}</span>
                        <span className="text-[10px] text-muted-foreground truncate">{trade.tokenName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                        <span>{trade.amount.toLocaleString()} tokens</span>
                        <span>•</span>
                        <span>{trade.dex}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold">${trade.totalValue.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {Math.round((Date.now() - trade.timestamp.getTime()) / 3600000)}h ago
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <Button
                className={`w-full gap-2 ${
                  whale.isFollowed
                    ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border border-yellow-500/30'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
                onClick={() => onFollowToggle(whale.id)}
              >
                <Star className={`w-4 h-4 ${whale.isFollowed ? 'fill-yellow-400' : ''}`} />
                {whale.isFollowed ? 'Unfollow Whale' : 'Follow Whale'}
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/50"
                onClick={() => onNavigate(whale)}
              >
                <Copy className="w-4 h-4" />
                Copy Trade with Settings
              </Button>
              <Button
                variant="ghost"
                className="w-full gap-2 text-muted-foreground hover:text-foreground"
                onClick={() => onNavigate(whale)}
              >
                <ExternalLink className="w-4 h-4" />
                View Full Profile
              </Button>
            </div>

            {/* Followers */}
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground pt-1">
              <Users className="w-3 h-3" />
              <span>{whale.followersCount.toLocaleString()} followers</span>
            </div>
          </div>
        </ScrollArea>
      </Card>
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────────────────────────
export function WhaleTrackerView() {
  const { whales, setCurrentPage, setSelectedWhaleId, toggleWhaleFollow } = useAppStore();

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [minConfidence, setMinConfidence] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [minRoi, setMinRoi] = useState(-100);
  const [minWinRate, setMinWinRate] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  // Selected whale for detail panel
  const [selectedWhale, setSelectedWhale] = useState<WhaleWallet | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // Sort state
  const [sortBy, setSortBy] = useState<'confidence' | 'roi' | 'winRate' | 'followers'>('confidence');

  // Followed state (using store)
  const [followedIds, setFollowedIds] = useState<Set<string>>(() => {
    const set = new Set<string>();
    whales.forEach((w) => { if (w.isFollowed) set.add(w.id); });
    return set;
  });

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleFollowToggle = (id: string) => {
    toggleWhaleFollow(id);
    setFollowedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleNavigate = (whale: WhaleWallet) => {
    setSelectedWhaleId(whale.id);
    setCurrentPage('wallet-profile');
  };

  const handleSelectWhale = (whale: WhaleWallet) => {
    setSelectedWhale(whale);
    setShowDetail(true);
  };

  // Merge followed state
  const enrichedWhales = useMemo(() => {
    return whales.map((w) => ({
      ...w,
      isFollowed: followedIds.has(w.id),
    }));
  }, [whales, followedIds]);

  // Apply filters
  const filteredWhales = useMemo(() => {
    let result = enrichedWhales;

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (w) =>
          w.address.toLowerCase().includes(q) ||
          w.label.toLowerCase().includes(q)
      );
    }

    // Confidence
    if (minConfidence > 0) {
      result = result.filter((w) => w.confidence >= minConfidence);
    }

    // Tags
    if (selectedTags.length > 0) {
      result = result.filter((w) =>
        selectedTags.some((tag) => w.tags.includes(tag))
      );
    }

    // Min ROI
    if (minRoi > -100) {
      result = result.filter((w) => w.roi >= minRoi);
    }

    // Win Rate
    if (minWinRate > 0) {
      result = result.filter((w) => w.winRate >= minWinRate);
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'confidence':
          return b.confidence - a.confidence;
        case 'roi':
          return b.roi - a.roi;
        case 'winRate':
          return b.winRate - a.winRate;
        case 'followers':
          return b.followersCount - a.followersCount;
        default:
          return 0;
      }
    });

    return result;
  }, [enrichedWhales, searchQuery, minConfidence, selectedTags, minRoi, minWinRate, sortBy]);

  // Compute stats
  const totalWhales = enrichedWhales.length;
  const followedWhales = enrichedWhales.filter((w) => w.isFollowed).length;
  const avgConfidence = enrichedWhales.length
    ? (enrichedWhales.reduce((s, w) => s + w.confidence, 0) / enrichedWhales.length).toFixed(0)
    : '0';

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Radar className="w-5 h-5 text-purple-400" />
            Whale Tracker
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track and follow the smartest wallets on Solana
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-xs">
            {totalWhales} whales
          </Badge>
          <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30 text-xs">
            <Star className="w-3 h-3 mr-1 fill-yellow-400" />
            {followedWhales} followed
          </Badge>
          <Badge variant="secondary" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 text-xs">
            <Shield className="w-3 h-3 mr-1" />
            Avg {avgConfidence}% confidence
          </Badge>
        </div>
      </div>

      {/* Search & Filters */}
      <SearchAndFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        minConfidence={minConfidence}
        setMinConfidence={setMinConfidence}
        selectedTags={selectedTags}
        toggleTag={toggleTag}
        minRoi={minRoi}
        setMinRoi={setMinRoi}
        minWinRate={minWinRate}
        setMinWinRate={setMinWinRate}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
      />

      {/* Sort Bar */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Sort by:</span>
        {(
          [
            { key: 'confidence', label: 'Confidence', icon: Shield },
            { key: 'roi', label: 'ROI', icon: TrendingUp },
            { key: 'winRate', label: 'Win Rate', icon: Zap },
            { key: 'followers', label: 'Followers', icon: Users },
          ] as const
        ).map(({ key, label, icon: Icon }) => (
          <Button
            key={key}
            variant="ghost"
            size="sm"
            className={`h-7 gap-1 text-xs px-2.5 ${
              sortBy === key
                ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setSortBy(key)}
          >
            <Icon className="w-3 h-3" />
            {label}
          </Button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">
          {filteredWhales.length} result{filteredWhales.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Content Area: Whale List + Detail Panel */}
      <div className="flex gap-4 min-h-0">
        {/* Whale List */}
        <div className={`flex-1 min-w-0 ${showDetail ? 'hidden lg:block lg:w-1/2' : 'w-full'}`}>
          <ScrollArea className="h-[calc(100vh-320px)]">
            {filteredWhales.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-1 pb-4">
                <AnimatePresence mode="popLayout">
                  {filteredWhales.map((whale) => (
                    <WhaleCard
                      key={whale.id}
                      whale={whale}
                      isSelected={selectedWhale?.id === whale.id}
                      onSelect={handleSelectWhale}
                      onNavigate={handleNavigate}
                      onFollowToggle={handleFollowToggle}
                    />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <Radar className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No whales match your filters</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Try adjusting your search or filter criteria</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 text-xs border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                  onClick={() => {
                    setSearchQuery('');
                    setMinConfidence(0);
                    setSelectedTags([]);
                    setMinRoi(-100);
                    setMinWinRate(0);
                  }}
                >
                  Clear All Filters
                </Button>
              </motion.div>
            )}
          </ScrollArea>
        </div>

        {/* Detail Panel */}
        <AnimatePresence>
          {showDetail && selectedWhale && (
            <div className="w-full lg:w-1/2 flex-shrink-0">
              <WhaleDetailPanel
                whale={{
                  ...selectedWhale,
                  isFollowed: followedIds.has(selectedWhale.id),
                }}
                onClose={() => {
                  setShowDetail(false);
                  setSelectedWhale(null);
                }}
                onNavigate={handleNavigate}
                onFollowToggle={handleFollowToggle}
              />
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
