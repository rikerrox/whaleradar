'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Trophy, Medal, Crown, Star, TrendingUp, TrendingDown,
  Search, Users, Copy, Eye, ArrowUpRight, ArrowDownRight,
  Wallet, BarChart3, Zap, Filter, ChevronRight, Flame,
  Target, Award,
} from 'lucide-react';
import { shortAddress, randomBetween } from '@/lib/mock-data';

function LeaderboardTable() {
  const { whales, setCurrentPage, setSelectedWhaleId } = useAppStore();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'roi' | 'winRate' | 'totalPnl' | 'confidence'>('roi');
  const [timeFrame, setTimeFrame] = useState('7d');

  const filteredWhales = useMemo(() => {
    let list = [...whales];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(w =>
        w.label.toLowerCase().includes(q) ||
        w.address.toLowerCase().includes(q) ||
        w.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case 'roi': return b.roi - a.roi;
        case 'winRate': return b.winRate - a.winRate;
        case 'totalPnl': return b.totalPnl - a.totalPnl;
        case 'confidence': return b.confidence - a.confidence;
        default: return 0;
      }
    });
    return list;
  }, [whales, search, sortBy]);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="text-sm font-bold text-muted-foreground w-5 text-center">#{rank}</span>;
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search whales..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 bg-white/5 border-white/10 text-sm"
          />
        </div>
        <div className="flex gap-2">
          {(['roi', 'winRate', 'totalPnl', 'confidence'] as const).map((s) => (
            <Button
              key={s}
              variant={sortBy === s ? 'default' : 'ghost'}
              size="sm"
              className={`h-8 text-xs ${
                sortBy === s
                  ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                  : 'bg-white/5 text-muted-foreground hover:text-foreground'
              } border`}
              onClick={() => setSortBy(s)}
            >
              {s === 'winRate' ? 'Win Rate' : s === 'totalPnl' ? 'P&L' : s.charAt(0).toUpperCase() + s.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-3 gap-3">
        {filteredWhales.slice(0, 3).map((whale, i) => (
          <motion.div
            key={whale.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className={`glass-card text-center ${
              i === 0 ? 'neon-glow-purple border-yellow-500/30' : i === 1 ? 'border-gray-400/20' : 'border-amber-600/20'
            }`}>
              <CardContent className="p-4">
                <div className="flex justify-center mb-2">
                  {i === 0 ? <Crown className="w-8 h-8 text-yellow-400" /> : i === 1 ? <Medal className="w-7 h-7 text-gray-300" /> : <Medal className="w-7 h-7 text-amber-600" />}
                </div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/40 to-cyan-500/40 flex items-center justify-center mx-auto mb-2 text-lg font-bold">
                  {whale.label.charAt(0)}
                </div>
                <p className="text-sm font-semibold truncate">{whale.label}</p>
                <p className="text-[10px] text-muted-foreground font-mono">{shortAddress(whale.address)}</p>
                <div className="mt-2 space-y-1">
                  <p className={`text-lg font-bold ${whale.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {whale.roi >= 0 ? '+' : ''}{whale.roi.toFixed(1)}%
                  </p>
                  <p className="text-[10px] text-muted-foreground">ROI</p>
                </div>
                <div className="flex justify-center gap-1 mt-2">
                  {whale.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-[9px] h-4 bg-purple-500/10 text-purple-400">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs mt-3 w-full"
                  onClick={() => {
                    setSelectedWhaleId(whale.id);
                    setCurrentPage('wallet-profile');
                  }}
                >
                  <Eye className="w-3 h-3 mr-1" /> View Profile
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Full Table */}
      <Card className="glass-card">
        <CardContent className="p-0">
          <ScrollArea className="max-h-[500px]">
            <div className="divide-y divide-white/5">
              {filteredWhales.map((whale, i) => (
                <motion.div
                  key={whale.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedWhaleId(whale.id);
                    setCurrentPage('wallet-profile');
                  }}
                >
                  {/* Rank */}
                  <div className="w-8 flex justify-center">
                    {getRankBadge(i + 1)}
                  </div>

                  {/* Avatar & Info */}
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500/30 to-cyan-500/30 flex items-center justify-center text-sm font-bold shrink-0">
                    {whale.label.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{whale.label}</span>
                      <div className="flex gap-1">
                        {whale.tags.slice(0, 1).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[9px] h-4 bg-purple-500/10 text-purple-400">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-mono">{shortAddress(whale.address)}</p>
                  </div>

                  {/* Stats */}
                  <div className="hidden sm:flex items-center gap-6 text-sm">
                    <div className="text-right w-20">
                      <p className={`font-medium ${whale.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {whale.roi >= 0 ? '+' : ''}{whale.roi.toFixed(1)}%
                      </p>
                      <p className="text-[10px] text-muted-foreground">ROI</p>
                    </div>
                    <div className="text-right w-16">
                      <p className="font-medium">{whale.winRate.toFixed(0)}%</p>
                      <p className="text-[10px] text-muted-foreground">Win Rate</p>
                    </div>
                    <div className="text-right w-20">
                      <p className={`font-medium ${whale.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${whale.totalPnl >= 0 ? '+' : ''}{whale.totalPnl.toFixed(0)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">P&L</p>
                    </div>
                    <div className="text-right w-14">
                      <p className="font-medium text-cyan-400">{whale.confidence.toFixed(0)}</p>
                      <p className="text-[10px] text-muted-foreground">Score</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Copy className="w-3.5 h-3.5 text-cyan-400" />
                    </Button>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

export function LeaderboardView() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-400" />
            Whale Leaderboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Top performing wallets ranked by ROI, win rate, and reputation
          </p>
        </div>
        <Badge variant="secondary" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
          <Flame className="w-3 h-3 mr-1" /> Updated Live
        </Badge>
      </div>

      <LeaderboardTable />
    </div>
  );
}
