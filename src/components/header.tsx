'use client';

import React from 'react';
import { useAppStore } from '@/lib/store';
import {
  Menu,
  Search,
  Bell,
  Wallet,
  ChevronDown,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { disconnectPhantomWallet } from '@/lib/wallet';
import { toast } from 'sonner';

export function Header() {
  const {
    sidebarOpen, setSidebarOpen, walletAddress, walletBalance,
    alerts, markAlertRead, searchQuery, setSearchQuery, liveTrades,
  } = useAppStore();

  const unreadAlerts = alerts.filter(a => !a.isRead).length;

  return (
    <header className="h-14 border-b border-border/50 flex items-center justify-between px-4 bg-[#0a0a0f]/80 backdrop-blur-md sticky top-0 z-30">
      {/* Left */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu className="h-4 w-4" />
        </Button>
        
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search tokens, wallets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 w-[260px] bg-white/5 border-white/10 text-sm placeholder:text-muted-foreground/50"
          />
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-1.5 ml-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-green-400 font-medium">LIVE</span>
          <span className="text-xs text-muted-foreground">
            {liveTrades.length} trades
          </span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* SOL Price */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
          <span className="text-xs text-muted-foreground">SOL</span>
          <span className="text-sm font-medium">$142.58</span>
          <span className="text-xs text-green-400">+3.2%</span>
        </div>

        {/* Alerts */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 relative">
              <Bell className="h-4 w-4" />
              {unreadAlerts > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 min-w-4 text-[10px] p-0 flex items-center justify-center bg-red-500">
                  {unreadAlerts}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 bg-[#12121a] border-white/10" align="end">
            <div className="p-3 border-b border-white/10">
              <h3 className="text-sm font-semibold">Notifications</h3>
            </div>
            <ScrollArea className="max-h-80">
              {alerts.slice(0, 10).map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${
                    !alert.isRead ? 'bg-purple-500/5' : ''
                  }`}
                  onClick={() => markAlertRead(alert.id)}
                >
                  <div className="flex items-start gap-2">
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${
                      alert.type === 'whale_buy' ? 'bg-green-500' :
                      alert.type === 'whale_sell' ? 'bg-red-500' :
                      alert.type === 'volume_spike' ? 'bg-yellow-500' :
                      alert.type === 'new_token' ? 'bg-cyan-500' :
                      'bg-purple-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">{alert.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{alert.message}</p>
                    </div>
                    {!alert.isRead && <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5" />}
                  </div>
                </div>
              ))}
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {/* Wallet */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 gap-2 px-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center">
                <Wallet className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-xs font-mono hidden sm:block">
                {walletAddress ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` : 'Connect'}
              </span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-[#12121a] border-white/10" align="end">
            <div className="p-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium font-mono">{walletAddress?.slice(0, 8)}...{walletAddress?.slice(-4)}</p>
                  <p className="text-xs text-muted-foreground">{walletBalance.toFixed(2)} SOL</p>
                </div>
              </div>
            </div>
            <DropdownMenuItem className="text-xs cursor-pointer">
              <ExternalLink className="w-3 h-3 mr-2" />
              View on Solscan
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              className="text-xs cursor-pointer text-red-400"
              onClick={async () => {
                await disconnectPhantomWallet();
                useAppStore.getState().setWalletConnected(false);
                useAppStore.getState().setWalletAddress(null);
                useAppStore.getState().setWalletBalance(0);
                useAppStore.getState().setCurrentPage('landing');
                toast.info('Wallet disconnected');
              }}
            >
              Disconnect Wallet
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
