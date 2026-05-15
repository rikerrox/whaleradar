'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Users, UserCheck, DollarSign, ArrowLeftRight,
  ShieldCheck, Activity, Zap, HeartPulse,
  UserPlus, ListChecks, RefreshCw, ToggleLeft, ToggleRight,
  Crown, Mail, Wallet, ChevronUp, ChevronDown,
  TrendingUp, Clock,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  totalTransactions: number;
}

interface AdminUser {
  id: string;
  email: string | null;
  username: string | null;
  plan: string;
  role: string;
  solBalance: number;
  isActive: boolean;
  createdAt: string;
}

interface AdminTransaction {
  id: string;
  userId: string;
  type: string;
  amount: number;
  token: string;
  status: string;
  description: string | null;
  createdAt: string;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const mockStats: AdminStats = {
  totalUsers: 1284,
  activeUsers: 847,
  totalRevenue: 48920,
  totalTransactions: 15320,
};

const mockUsers: AdminUser[] = [
  { id: '1', email: 'test@whaleradar.io', username: 'AdminWhale', plan: 'elite', role: 'admin', solBalance: 125.5, isActive: true, createdAt: '2025-01-15T10:30:00Z' },
  { id: '2', email: 'whale1@sol.io', username: 'WhaleAlpha', plan: 'pro', role: 'user', solBalance: 89.2, isActive: true, createdAt: '2025-02-10T14:20:00Z' },
  { id: '3', email: 'degen@memecoin.io', username: 'DegenMaster', plan: 'free', role: 'user', solBalance: 3.4, isActive: true, createdAt: '2025-03-05T08:15:00Z' },
  { id: '4', email: 'sniper@trading.io', username: 'SolSniper', plan: 'pro', role: 'user', solBalance: 56.7, isActive: false, createdAt: '2025-02-28T16:45:00Z' },
  { id: '5', email: 'diamond@hodl.io', username: 'DiamondHands', plan: 'elite', role: 'user', solBalance: 234.8, isActive: true, createdAt: '2025-01-20T11:00:00Z' },
  { id: '6', email: 'gem@hunter.io', username: 'GemHunterX', plan: 'free', role: 'user', solBalance: 1.2, isActive: true, createdAt: '2025-04-01T09:30:00Z' },
  { id: '7', email: 'ape@lord.io', username: 'APELord', plan: 'pro', role: 'user', solBalance: 42.0, isActive: true, createdAt: '2025-03-15T13:10:00Z' },
  { id: '8', email: 'sage@crypto.io', username: 'CryptoSage', plan: 'elite', role: 'user', solBalance: 178.3, isActive: false, createdAt: '2025-01-25T07:20:00Z' },
];

const mockTransactions: AdminTransaction[] = [
  { id: 'tx-1', userId: '1', type: 'deposit', amount: 50, token: 'SOL', status: 'completed', description: 'SOL deposit via Phantom', createdAt: '2025-06-10T14:30:00Z' },
  { id: 'tx-2', userId: '2', type: 'payment', amount: 49, token: 'USDC', status: 'completed', description: 'Pro plan subscription', createdAt: '2025-06-10T12:15:00Z' },
  { id: 'tx-3', userId: '5', type: 'payment', amount: 149, token: 'USDC', status: 'completed', description: 'Elite plan subscription', createdAt: '2025-06-10T10:00:00Z' },
  { id: 'tx-4', userId: '3', type: 'copy_trade', amount: 2.5, token: 'SOL', status: 'completed', description: 'Copy trade: WIF buy', createdAt: '2025-06-09T22:45:00Z' },
  { id: 'tx-5', userId: '7', type: 'deposit', amount: 25, token: 'SOL', status: 'pending', description: 'SOL deposit pending', createdAt: '2025-06-09T20:30:00Z' },
  { id: 'tx-6', userId: '4', type: 'withdrawal', amount: 10, token: 'SOL', status: 'failed', description: 'Withdrawal failed - insufficient balance', createdAt: '2025-06-09T18:10:00Z' },
  { id: 'tx-7', userId: '6', type: 'payment', amount: 49, token: 'USDC', status: 'completed', description: 'Pro plan upgrade', createdAt: '2025-06-09T15:00:00Z' },
  { id: 'tx-8', userId: '8', type: 'copy_trade', amount: 5.0, token: 'SOL', status: 'completed', description: 'Copy trade: BONK sell', createdAt: '2025-06-09T12:20:00Z' },
  { id: 'tx-9', userId: '2', type: 'referral', amount: 10, token: 'SOL', status: 'completed', description: 'Referral bonus', createdAt: '2025-06-08T09:00:00Z' },
  { id: 'tx-10', userId: '1', type: 'deposit', amount: 100, token: 'SOL', status: 'completed', description: 'Large SOL deposit', createdAt: '2025-06-08T07:30:00Z' },
];

const mockRevenueData = [
  { month: 'Jan', revenue: 3200 },
  { month: 'Feb', revenue: 4100 },
  { month: 'Mar', revenue: 3800 },
  { month: 'Apr', revenue: 5200 },
  { month: 'May', revenue: 6800 },
  { month: 'Jun', revenue: 7400 },
  { month: 'Jul', revenue: 6100 },
  { month: 'Aug', revenue: 8200 },
  { month: 'Sep', revenue: 7500 },
  { month: 'Oct', revenue: 9100 },
  { month: 'Nov', revenue: 8800 },
  { month: 'Dec', revenue: 10500 },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatsOverview({ stats, loading }: { stats: AdminStats; loading: boolean }) {
  const statCards = [
    {
      label: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      glow: 'neon-glow-purple',
      change: '+12.5%',
      changeUp: true,
    },
    {
      label: 'Active Users',
      value: stats.activeUsers.toLocaleString(),
      icon: UserCheck,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      glow: 'neon-glow-cyan',
      change: '+8.2%',
      changeUp: true,
    },
    {
      label: 'Total Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
      glow: 'neon-glow-green',
      change: '+23.1%',
      changeUp: true,
    },
    {
      label: 'Total Transactions',
      value: stats.totalTransactions.toLocaleString(),
      icon: ArrowLeftRight,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
      glow: '',
      change: '+5.7%',
      changeUp: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
        >
          <Card className={`glass-card glass-card-hover transition-all duration-300 h-full ${stat.glow}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-4.5 h-4.5 ${stat.color}`} />
                </div>
              </div>
              {loading ? (
                <div className="h-7 w-28 bg-white/5 rounded animate-pulse" />
              ) : (
                <p className="text-2xl font-bold">{stat.value}</p>
              )}
              <div className="flex items-center gap-1 mt-1">
                {stat.changeUp ? (
                  <ChevronUp className="w-3 h-3 text-green-400" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-red-400" />
                )}
                <span className={`text-xs ${stat.changeUp ? 'text-green-400' : 'text-red-400'}`}>
                  {stat.change}
                </span>
                <span className="text-xs text-muted-foreground ml-1">vs last month</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

function UserManagementTable({
  users,
  loading,
  onToggleActive,
  onToggleRole,
}: {
  users: AdminUser[];
  loading: boolean;
  onToggleActive: (userId: string, currentActive: boolean) => void;
  onToggleRole: (userId: string, currentRole: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      u.plan.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  const getPlanBadge = (plan: string) => {
    const styles: Record<string, string> = {
      free: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      pro: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      elite: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    };
    return styles[plan] || styles.free;
  };

  const getRoleBadge = (role: string) => {
    if (role === 'admin') {
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
    return 'bg-white/5 text-muted-foreground border-white/10';
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            User Management
          </CardTitle>
          <div className="relative">
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-full sm:w-48 rounded-md bg-white/5 border border-white/10 text-xs px-3 py-1.5 placeholder:text-muted-foreground focus:outline-none focus:border-purple-500/50 transition-colors"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-white/5 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <ScrollArea className="max-h-96">
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-xs text-muted-foreground">User</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Plan</TableHead>
                  <TableHead className="text-xs text-muted-foreground hidden md:table-cell">Role</TableHead>
                  <TableHead className="text-xs text-muted-foreground hidden sm:table-cell">SOL Balance</TableHead>
                  <TableHead className="text-xs text-muted-foreground hidden lg:table-cell">Status</TableHead>
                  <TableHead className="text-xs text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="border-white/5 hover:bg-white/5 transition-colors">
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm font-medium truncate max-w-[160px]">
                            {user.username || user.email?.split('@')[0] || 'Unknown'}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground truncate max-w-[180px]">
                          {user.email || 'No email'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`text-[9px] h-5 ${getPlanBadge(user.plan)}`}>
                        {user.plan.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="secondary" className={`text-[9px] h-5 ${getRoleBadge(user.role)}`}>
                        {user.role === 'admin' && <Crown className="w-2.5 h-2.5 mr-0.5" />}
                        {user.role.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-1">
                        <Wallet className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm">{user.solBalance.toFixed(2)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-xs text-muted-foreground">
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-7 w-7 p-0 ${user.isActive ? 'text-green-400 hover:text-green-300 hover:bg-green-500/10' : 'text-red-400 hover:text-red-300 hover:bg-red-500/10'}`}
                          onClick={() => onToggleActive(user.id, user.isActive)}
                          title={user.isActive ? 'Deactivate user' : 'Activate user'}
                        >
                          {user.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-7 w-7 p-0 ${user.role === 'admin' ? 'text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10' : 'text-muted-foreground hover:text-purple-400 hover:bg-purple-500/10'}`}
                          onClick={() => onToggleRole(user.id, user.role)}
                          title={user.role === 'admin' ? 'Demote to user' : 'Promote to admin'}
                        >
                          <Crown className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                      No users found matching &quot;{searchQuery}&quot;
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

function RecentTransactionsTable({ transactions, loading }: { transactions: AdminTransaction[]; loading: boolean }) {
  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      deposit: 'bg-green-500/20 text-green-400 border-green-500/30',
      withdrawal: 'bg-red-500/20 text-red-400 border-red-500/30',
      payment: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      copy_trade: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      referral: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    };
    return styles[type] || 'bg-white/5 text-muted-foreground border-white/10';
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      completed: 'bg-green-500/10 text-green-400',
      pending: 'bg-yellow-500/10 text-yellow-400',
      failed: 'bg-red-500/10 text-red-400',
      cancelled: 'bg-gray-500/10 text-gray-400',
    };
    return styles[status] || styles.pending;
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours < 1) return 'Just now';
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          Recent Transactions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 bg-white/5 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <ScrollArea className="max-h-96">
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-xs text-muted-foreground">Type</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Amount</TableHead>
                  <TableHead className="text-xs text-muted-foreground hidden sm:table-cell">Token</TableHead>
                  <TableHead className="text-xs text-muted-foreground hidden md:table-cell">Description</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Status</TableHead>
                  <TableHead className="text-xs text-muted-foreground text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id} className="border-white/5 hover:bg-white/5 transition-colors">
                    <TableCell>
                      <Badge variant="secondary" className={`text-[9px] h-5 ${getTypeBadge(tx.type)}`}>
                        {tx.type.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">
                        {tx.type === 'payment' || tx.type === 'referral' ? '$' : ''}
                        {tx.amount.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="text-xs text-muted-foreground">{tx.token}</span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-xs text-muted-foreground truncate max-w-[200px] block">
                        {tx.description || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`text-[9px] h-5 ${getStatusBadge(tx.status)}`}>
                        {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {formatDate(tx.createdAt)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {transactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                      No transactions found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

function QuickActions({ onAction }: { onAction: (action: string) => void }) {
  const actions = [
    {
      label: 'Create User',
      icon: UserPlus,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20',
    },
    {
      label: 'View All Transactions',
      icon: ListChecks,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/20',
    },
    {
      label: 'System Health Check',
      icon: HeartPulse,
      color: 'text-green-400',
      bg: 'bg-green-500/10 hover:bg-green-500/20 border-green-500/20',
    },
  ];

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-2">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="ghost"
              className={`w-full justify-start h-10 ${action.bg} border transition-all duration-200`}
              onClick={() => onAction(action.label)}
            >
              <action.icon className={`w-4 h-4 ${action.color} mr-2`} />
              <span className="text-sm">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RevenueChart({ data, loading }: { data: { month: string; revenue: number }[]; loading: boolean }) {
  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            Monthly Revenue
          </CardTitle>
          <Badge variant="secondary" className="bg-green-500/10 text-green-400 border-green-500/30 text-[9px]">
            +23.1% YoY
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {loading ? (
          <div className="h-56 bg-white/5 rounded animate-pulse" />
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="month"
                  stroke="rgba(255,255,255,0.2)"
                  fontSize={10}
                  tickLine={false}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.2)"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    background: '#12121a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: '#71717a' }}
                  itemStyle={{ color: '#22c55e' }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                />
                <Bar
                  dataKey="revenue"
                  fill="url(#revenueGradient)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SystemHealthPanel() {
  const healthItems = [
    { label: 'API Server', status: 'operational', latency: '12ms' },
    { label: 'Database', status: 'operational', latency: '3ms' },
    { label: 'WebSocket', status: 'operational', latency: '8ms' },
    { label: 'Trade Engine', status: 'operational', latency: '45ms' },
    { label: 'Alert Service', status: 'degraded', latency: '230ms' },
  ];

  const getStatusColor = (status: string) => {
    if (status === 'operational') return 'bg-green-500';
    if (status === 'degraded') return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusText = (status: string) => {
    if (status === 'operational') return 'text-green-400';
    if (status === 'degraded') return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <HeartPulse className="w-4 h-4 text-green-400" />
          System Health
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-3">
          {healthItems.map((item) => (
            <div key={item.label} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(item.status)} ${item.status === 'degraded' ? 'animate-pulse' : ''}`} />
                <span className="text-sm">{item.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{item.latency}</span>
                <span className={`text-xs capitalize ${getStatusText(item.status)}`}>{item.status}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function AdminView() {
  const { user, isAuthenticated } = useAppStore();
  const [stats, setStats] = useState<AdminStats>(mockStats);
  const [users, setUsers] = useState<AdminUser[]>(mockUsers);
  const [transactions, setTransactions] = useState<AdminTransaction[]>(mockTransactions);
  const [revenueData] = useState(mockRevenueData);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch admin data from API if authenticated
  const fetchAdminData = useCallback(async () => {
    if (!isAuthenticated || !apiClient.isAuthenticated()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [statsRes, usersRes, txRes] = await Promise.allSettled([
        fetch('/api/admin/stats', {
          headers: { Authorization: `Bearer ${apiClient.getSessionToken()}` },
        }),
        fetch('/api/admin/users', {
          headers: { Authorization: `Bearer ${apiClient.getSessionToken()}` },
        }),
        fetch('/api/admin/transactions', {
          headers: { Authorization: `Bearer ${apiClient.getSessionToken()}` },
        }),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
        const json = await statsRes.value.json();
        if (json.data) setStats(json.data as AdminStats);
      }

      if (usersRes.status === 'fulfilled' && usersRes.value.ok) {
        const json = await usersRes.value.json();
        if (json.data) setUsers(json.data as AdminUser[]);
      }

      if (txRes.status === 'fulfilled' && txRes.value.ok) {
        const json = await txRes.value.json();
        if (json.data) setTransactions(json.data as AdminTransaction[]);
      }
    } catch {
      // Fallback to mock data already set
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    // Optimistic update
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isActive: !currentActive } : u))
    );

    // Try to persist via API
    if (apiClient.isAuthenticated()) {
      try {
        await fetch(`/api/admin/users?id=${userId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiClient.getSessionToken()}`,
          },
          body: JSON.stringify({ isActive: !currentActive }),
        });
      } catch {
        // Revert on failure
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isActive: currentActive } : u))
        );
      }
    }
  };

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );

    if (apiClient.isAuthenticated()) {
      try {
        await fetch(`/api/admin/users?id=${userId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiClient.getSessionToken()}`,
          },
          body: JSON.stringify({ role: newRole }),
        });
      } catch {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: currentRole } : u))
        );
      }
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'Create User':
        // Future: open create user dialog
        break;
      case 'View All Transactions':
        setActiveTab('transactions');
        break;
      case 'System Health Check':
        // Future: trigger health check and show results
        break;
    }
  };

  // Non-admin access guard
  const isAdmin = user?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="glass-card max-w-md w-full">
          <CardContent className="p-8 text-center">
            <ShieldCheck className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-sm text-muted-foreground">
              You don&apos;t have admin privileges to access this dashboard. 
              Contact an administrator if you believe this is an error.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-purple-400" />
            Admin Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            System overview and management controls
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs bg-white/5 hover:bg-white/10 border border-white/10"
          onClick={() => fetchAdminData()}
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Stats Overview */}
      <StatsOverview stats={stats} loading={loading} />

      {/* Tabs for different sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="users" className="text-xs">Users</TabsTrigger>
          <TabsTrigger value="transactions" className="text-xs">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Revenue Chart - takes 2 cols */}
            <div className="lg:col-span-2">
              <RevenueChart data={revenueData} loading={false} />
            </div>

            {/* Quick Actions + System Health */}
            <div className="space-y-4">
              <QuickActions onAction={handleQuickAction} />
              <SystemHealthPanel />
            </div>
          </div>

          {/* Preview tables on overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top 5 recent users */}
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-400" />
                    Recent Users
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground"
                    onClick={() => setActiveTab('users')}
                  >
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-2">
                  {users.slice(0, 5).map((u) => (
                    <div key={u.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/30 to-cyan-500/30 flex items-center justify-center text-xs font-bold">
                        {(u.username || u.email || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{u.username || u.email?.split('@')[0]}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={`text-[8px] h-4 ${
                          u.plan === 'elite' ? 'bg-cyan-500/20 text-cyan-400' :
                          u.plan === 'pro' ? 'bg-purple-500/20 text-purple-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {u.plan.toUpperCase()}
                        </Badge>
                        <div className={`w-2 h-2 rounded-full ${u.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top 5 recent transactions */}
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ArrowLeftRight className="w-4 h-4 text-cyan-400" />
                    Recent Transactions
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground"
                    onClick={() => setActiveTab('transactions')}
                  >
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-2">
                  {transactions.slice(0, 5).map((tx) => (
                    <div key={tx.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                        tx.type === 'deposit' ? 'bg-green-500/10 text-green-400' :
                        tx.type === 'payment' ? 'bg-purple-500/10 text-purple-400' :
                        tx.type === 'copy_trade' ? 'bg-cyan-500/10 text-cyan-400' :
                        tx.type === 'withdrawal' ? 'bg-red-500/10 text-red-400' :
                        'bg-yellow-500/10 text-yellow-400'
                      }`}>
                        {tx.type === 'deposit' ? '↓' : tx.type === 'withdrawal' ? '↑' : tx.type === 'payment' ? '💳' : tx.type === 'copy_trade' ? '↗' : '🎁'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {tx.type === 'payment' || tx.type === 'referral' ? `$${tx.amount.toLocaleString()}` : `${tx.amount} ${tx.token}`}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {tx.description || tx.type}
                        </p>
                      </div>
                      <Badge variant="secondary" className={`text-[8px] h-4 ${
                        tx.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                        tx.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
                        'bg-red-500/10 text-red-400'
                      }`}>
                        {tx.status.toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <UserManagementTable
            users={users}
            loading={loading}
            onToggleActive={handleToggleActive}
            onToggleRole={handleToggleRole}
          />
        </TabsContent>

        <TabsContent value="transactions" className="mt-4">
          <RecentTransactionsTable transactions={transactions} loading={loading} />
        </TabsContent>
      </Tabs>

      {/* Footer separator */}
      <Separator className="bg-white/5" />
      <div className="flex items-center justify-between text-[10px] text-muted-foreground/50 pb-2">
        <span>WhaleRadar AI Admin Panel</span>
        <span>Last updated: {new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  );
}
