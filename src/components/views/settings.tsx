'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Settings2, Bell, Shield, Wallet, Eye, Moon, Globe,
  Key, Volume2, Mail, MessageSquare, Smartphone,
  AlertTriangle, Lock, User, CreditCard, Palette,
  Save, Check, ExternalLink, Crown,
} from 'lucide-react';

export function SettingsView() {
  const { walletAddress, walletBalance, userPlan, alerts, setShowPaymentModal, setPaymentPlan, user, setUser } = useAppStore();
  
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminMessage, setAdminMessage] = useState('');
  
  const [notifications, setNotifications] = useState({
    whaleBuy: true,
    whaleSell: true,
    volumeSpike: true,
    newToken: false,
    copyTrade: true,
    browser: true,
    telegram: false,
    discord: false,
    email: false,
  });

  const [preferences, setPreferences] = useState({
    autoCopy: false,
    slippage: '1',
    gasPriority: 'medium',
    defaultCopyPercent: '50',
    showBalances: true,
    compactView: false,
  });

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleClaimAdmin = async () => {
    setAdminLoading(true);
    setAdminMessage('');
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('sessionToken') : null;
      if (!token) {
        setAdminMessage('Please log in first');
        return;
      }
      const res = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        if (user) {
          setUser({ ...user, role: 'admin' });
        }
        setAdminMessage('You are now an admin! Refresh to see the Admin Panel in the sidebar.');
      } else {
        setAdminMessage(data.error || 'Failed to claim admin');
      }
    } catch {
      setAdminMessage('Network error');
    } finally {
      setAdminLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings2 className="w-6 h-6 text-purple-400" />
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account and trading preferences</p>
      </div>

      <Tabs defaultValue="account">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="account" className="text-xs">Account</TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs">Notifications</TabsTrigger>
          <TabsTrigger value="trading" className="text-xs">Trading</TabsTrigger>
          <TabsTrigger value="security" className="text-xs">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="mt-4 space-y-4">
          {/* Profile */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="w-4 h-4 text-purple-400" /> Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Wallet Address</label>
                <div className="flex items-center gap-2">
                  <Input value={walletAddress || ''} readOnly className="bg-white/5 border-white/10 text-sm font-mono" />
                  <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Username</label>
                <Input placeholder="Enter username" className="bg-white/5 border-white/10 text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Email</label>
                <Input placeholder="Enter email" type="email" className="bg-white/5 border-white/10 text-sm" />
              </div>
            </CardContent>
          </Card>

          {/* Subscription */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-cyan-400" /> Subscription
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium capitalize">{userPlan} Plan</p>
                  <p className="text-xs text-muted-foreground">
                    {userPlan === 'free' ? 'Basic features with limited access' : 'Full access to premium features'}
                  </p>
                </div>
                <Badge className={userPlan === 'free' ? 'bg-gray-500/20 text-gray-400' : 'bg-purple-500/20 text-purple-400'}>
                  {userPlan.toUpperCase()}
                </Badge>
              </div>
              {userPlan === 'free' && (
                <Button className="mt-4 w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white" size="sm" onClick={() => { setPaymentPlan('pro'); setShowPaymentModal(true); }}>
                  Upgrade to Pro
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4 space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Bell className="w-4 h-4 text-yellow-400" /> Alert Triggers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'whaleBuy' as const, label: 'Whale Buy Detected', desc: 'When a tracked whale makes a large buy', icon: TrendingUpIcon },
                { key: 'whaleSell' as const, label: 'Whale Sell Detected', desc: 'When a tracked whale sells', icon: TrendingDownIcon },
                { key: 'volumeSpike' as const, label: 'Volume Spike', desc: 'Unusual volume increase on watched tokens', icon: Volume2 },
                { key: 'newToken' as const, label: 'New Trending Token', desc: 'New tokens gaining traction', icon: Globe },
                { key: 'copyTrade' as const, label: 'Copy Trade Executed', desc: 'When your copy trade is filled', icon: Check },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                  <Switch checked={notifications[item.key]} onCheckedChange={() => toggleNotification(item.key)} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-cyan-400" /> Notification Channels
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'browser' as const, label: 'Browser Notifications', desc: 'Desktop push notifications', icon: Globe },
                { key: 'telegram' as const, label: 'Telegram', desc: 'Send alerts to your Telegram', icon: MessageSquare },
                { key: 'discord' as const, label: 'Discord', desc: 'Send alerts to Discord webhook', icon: MessageSquare },
                { key: 'email' as const, label: 'Email', desc: 'Email notifications', icon: Mail },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                  <Switch checked={notifications[item.key]} onCheckedChange={() => toggleNotification(item.key)} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trading" className="mt-4 space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-400" /> Default Trading Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">Auto Copy Trading</p>
                  <p className="text-xs text-muted-foreground">Automatically copy followed whale trades</p>
                </div>
                <Switch checked={preferences.autoCopy} onCheckedChange={(v) => setPreferences(p => ({ ...p, autoCopy: v }))} />
              </div>
              <Separator className="bg-white/5" />
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Default Slippage</label>
                <Input value={preferences.slippage} onChange={(e) => setPreferences(p => ({ ...p, slippage: e.target.value }))} className="bg-white/5 border-white/10 text-sm w-24" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Gas Priority</label>
                <div className="flex gap-2">
                  {['low', 'medium', 'high'].map((p) => (
                    <Button
                      key={p}
                      variant={preferences.gasPriority === p ? 'default' : 'ghost'}
                      size="sm"
                      className={`h-8 text-xs ${preferences.gasPriority === p ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5'}`}
                      onClick={() => setPreferences(prev => ({ ...prev, gasPriority: p }))}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Default Copy %</label>
                <Input value={preferences.defaultCopyPercent} onChange={(e) => setPreferences(p => ({ ...p, defaultCopyPercent: e.target.value }))} className="bg-white/5 border-white/10 text-sm w-24" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Palette className="w-4 h-4 text-purple-400" /> Display
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">Show Balances</p>
                  <p className="text-xs text-muted-foreground">Display wallet and position values</p>
                </div>
                <Switch checked={preferences.showBalances} onCheckedChange={(v) => setPreferences(p => ({ ...p, showBalances: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">Compact View</p>
                  <p className="text-xs text-muted-foreground">Reduce card sizes for more data density</p>
                </div>
                <Switch checked={preferences.compactView} onCheckedChange={(v) => setPreferences(p => ({ ...p, compactView: v }))} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-4 space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Lock className="w-4 h-4 text-red-400" /> Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-200">Important Security Notice</p>
                  <p className="text-xs text-yellow-200/70 mt-1">
                    WhaleRadar never stores your private keys. All transactions are signed directly in your Phantom wallet. 
                    Never share your seed phrase with anyone.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">Wallet Connection</p>
                  <p className="text-xs text-muted-foreground">Connected via Phantom wallet adapter</p>
                </div>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  <Check className="w-3 h-3 mr-1" /> Connected
                </Badge>
              </div>

              <Separator className="bg-white/5" />

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">Transaction Signing</p>
                  <p className="text-xs text-muted-foreground">All trades require manual wallet approval</p>
                </div>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  <Shield className="w-3 h-3 mr-1" /> Secure
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">Rate Limiting</p>
                  <p className="text-xs text-muted-foreground">Protection against automated attacks</p>
                </div>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  Active
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Crown className="w-4 h-4 text-yellow-400" /> Admin Access
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {user?.role === 'admin' ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <Check className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-sm font-medium text-green-200">You are an Admin</p>
                    <p className="text-xs text-green-200/70">Admin Panel is available in the sidebar</p>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">
                    Claim admin access to manage users, view transactions, and monitor the platform. 
                    Available only if no admin exists yet.
                  </p>
                  <Button
                    onClick={handleClaimAdmin}
                    disabled={adminLoading}
                    className="w-full bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border border-yellow-500/30"
                  >
                    {adminLoading ? 'Claiming...' : 'Claim Admin Access'}
                  </Button>
                  {adminMessage && (
                    <p className={`text-xs ${adminMessage.includes('now an admin') ? 'text-green-400' : 'text-red-400'}`}>
                      {adminMessage}
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Simple icon components for the settings
function TrendingUpIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>;
}

function TrendingDownIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>;
}
