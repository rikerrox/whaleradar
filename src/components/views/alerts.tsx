'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bell, Waves, TrendingUp, TrendingDown, Volume2,
  Zap, Copy, Eye, Trash2, Check, Clock,
  MessageSquare, Globe, Mail, Smartphone,
  AlertTriangle, ArrowUpRight, Radio,
} from 'lucide-react';

const alertTypeConfig: Record<string, { color: string; bg: string; icon: React.ElementType; label: string }> = {
  whale_buy: { color: 'text-green-400', bg: 'bg-green-500/20 border-green-500/30', icon: TrendingUp, label: 'Whale Buy' },
  whale_sell: { color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/30', icon: TrendingDown, label: 'Whale Sell' },
  volume_spike: { color: 'text-yellow-400', bg: 'bg-yellow-500/20 border-yellow-500/30', icon: Volume2, label: 'Volume Spike' },
  new_token: { color: 'text-cyan-400', bg: 'bg-cyan-500/20 border-cyan-500/30', icon: Zap, label: 'New Token' },
  copy_trade: { color: 'text-purple-400', bg: 'bg-purple-500/20 border-purple-500/30', icon: Copy, label: 'Copy Trade' },
};

function AlertCard({ alert, onRead, onDelete }: { alert: any; onRead: () => void; onDelete: () => void }) {
  const config = alertTypeConfig[alert.type] || alertTypeConfig.whale_buy;
  const Icon = config.icon;
  const timeAgo = (date: Date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className={`glass-card glass-card-hover rounded-xl p-4 transition-all duration-300 ${
        !alert.isRead ? 'border-purple-500/30' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg ${config.bg} border flex items-center justify-center shrink-0`}>
          <Icon className={`w-5 h-5 ${config.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold">{alert.title}</h3>
            {!alert.isRead && <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />}
          </div>
          <p className="text-xs text-muted-foreground mb-2">{alert.message}</p>
          <div className="flex items-center gap-2">
            <Badge className={`text-[9px] h-4 ${config.bg} ${config.color} border`}>
              {config.label}
            </Badge>
            {alert.token && (
              <Badge variant="secondary" className="text-[9px] h-4 bg-white/5">
                {alert.token}
              </Badge>
            )}
            <Badge variant="secondary" className="text-[9px] h-4 bg-white/5">
              {alert.channel}
            </Badge>
            <span className="text-[10px] text-muted-foreground ml-auto">
              {timeAgo(alert.timestamp)}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          {!alert.isRead && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRead}>
              <Check className="w-3.5 h-3.5 text-green-400" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDelete}>
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export function AlertsView() {
  const { alerts, markAlertRead } = useAppStore();
  const [filter, setFilter] = useState('all');

  const filteredAlerts = filter === 'all' 
    ? alerts 
    : alerts.filter(a => a.type === filter);

  const unreadCount = alerts.filter(a => !a.isRead).length;

  const markAllRead = () => {
    alerts.filter(a => !a.isRead).forEach(a => markAlertRead(a.id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="w-6 h-6 text-yellow-400" />
            Alerts
            {unreadCount > 0 && (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                {unreadCount} new
              </Badge>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Stay updated with whale activity and trade notifications
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" className="text-xs" onClick={markAllRead}>
            <Check className="w-3 h-3 mr-1" /> Mark all read
          </Button>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { key: 'all', label: 'All' },
          { key: 'whale_buy', label: 'Whale Buys' },
          { key: 'whale_sell', label: 'Whale Sells' },
          { key: 'volume_spike', label: 'Volume Spikes' },
          { key: 'new_token', label: 'New Tokens' },
          { key: 'copy_trade', label: 'Copy Trades' },
        ].map((f) => (
          <Button
            key={f.key}
            variant={filter === f.key ? 'default' : 'ghost'}
            size="sm"
            className={`h-8 text-xs shrink-0 ${
              filter === f.key
                ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                : 'bg-white/5 text-muted-foreground hover:text-foreground'
            } border`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Alert List */}
      <ScrollArea className="max-h-[calc(100vh-280px)]">
        <AnimatePresence>
          {filteredAlerts.length > 0 ? (
            <div className="space-y-3">
              {filteredAlerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onRead={() => markAlertRead(alert.id)}
                  onDelete={() => {}}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No alerts found</p>
              <p className="text-xs mt-1">Alerts will appear here when whale activity is detected</p>
            </div>
          )}
        </AnimatePresence>
      </ScrollArea>
    </div>
  );
}
