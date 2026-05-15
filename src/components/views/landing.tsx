'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Waves, Radar, Zap, Shield, TrendingUp, Copy,
  Bell, BarChart3, Eye, ArrowRight, ChevronDown,
  Activity, Coins, Target, Brain, Star, Check,
  Volume2, Lock, Users, Globe, ExternalLink, Wallet,
  ScanSearch, Search,
} from 'lucide-react';
import { subscriptionPlans, generateMockTrades } from '@/lib/mock-data';
import { connectPhantomWallet, isPhantomInstalled, DEMO_WALLET_ADDRESS, DEMO_WALLET_BALANCE } from '@/lib/wallet';
import { toast } from 'sonner';

const liveWhaleTrades = generateMockTrades(8);

function HeroSection() {
  const { setWalletConnected, setWalletAddress, setWalletBalance, setCurrentPage } = useAppStore();
  const [glowIntensity, setGlowIntensity] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setGlowIntensity(prev => (prev + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnectWallet = async () => {
    setIsConnecting(true);
    try {
      if (isPhantomInstalled()) {
        const address = await connectPhantomWallet();
        if (address) {
          setWalletAddress(address);
          setWalletConnected(true);
          setWalletBalance(DEMO_WALLET_BALANCE);
          toast.success('Wallet connected!', {
            description: `Connected to ${address.slice(0, 4)}...${address.slice(-4)}`,
          });
          setCurrentPage('dashboard');
        } else {
          toast.error('Connection rejected', {
            description: 'You rejected the wallet connection request.',
          });
        }
      } else {
        // Phantom not installed — use demo mode
        setWalletAddress(DEMO_WALLET_ADDRESS);
        setWalletConnected(true);
        setWalletBalance(DEMO_WALLET_BALANCE);
        toast.success('Demo mode activated!', {
          description: 'Install Phantom wallet for real trading. Using demo data for now.',
        });
        setCurrentPage('dashboard');
      }
    } catch {
      toast.error('Connection failed', {
        description: 'Could not connect to wallet. Please try again.',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid-pattern" />
      <div className="absolute inset-0 bg-gradient-radial" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6"
        >
          <Badge variant="secondary" className="px-4 py-1.5 bg-purple-500/10 text-purple-400 border-purple-500/30 text-sm">
            <Activity className="w-3.5 h-3.5 mr-1.5 animate-pulse" />
            Live on Solana — {Math.floor(Math.random() * 500 + 200)} whales tracked
          </Badge>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-6"
        >
          <span className="text-foreground">Track </span>
          <span className="bg-gradient-to-r from-purple-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent neon-text-purple">
            Smart Money
          </span>
          <br />
          <span className="text-foreground">Before Everyone Else</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
        >
          AI-powered whale tracking & copy trading for Solana meme coins. 
          Detect large buys, follow profitable wallets, and auto-copy trades in real-time.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <Button
            size="lg"
            onClick={handleConnectWallet}
            disabled={isConnecting}
            className="h-12 px-8 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-medium neon-glow-purple transition-all duration-300"
          >
            <Wallet className="w-4 h-4 mr-2" />
            {isConnecting ? 'Connecting...' : 'Connect Phantom Wallet'}
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={async () => {
              // Connect wallet first, then go to copy trading
              if (isPhantomInstalled()) {
                const address = await connectPhantomWallet();
                if (address) {
                  setWalletAddress(address);
                  toast.success('Wallet connected!', {
                    description: `Connected to ${address.slice(0, 4)}...${address.slice(-4)}`,
                  });
                } else {
                  setWalletAddress(DEMO_WALLET_ADDRESS);
                  toast.info('Using demo mode');
                }
              } else {
                setWalletAddress(DEMO_WALLET_ADDRESS);
                toast.success('Demo mode activated!', {
                  description: 'Install Phantom wallet for real trading.',
                });
              }
              setWalletConnected(true);
              setWalletBalance(DEMO_WALLET_BALANCE);
              setCurrentPage('copy-trading');
            }}
            className="h-12 px-8 border-white/20 hover:bg-white/10 font-medium"
          >
            Start Copy Trading
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>

        {/* Live Trades Feed */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <div className="glass-card rounded-xl p-4 neon-glow-purple">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-green-400 font-medium">LIVE WHALE FEED</span>
              <span className="text-xs text-muted-foreground ml-auto">Powered by Helius & Birdeye</span>
            </div>
            <div className="space-y-2">
              {liveWhaleTrades.slice(0, 5).map((trade, i) => (
                <motion.div
                  key={trade.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                    trade.type === 'buy' ? 'bg-green-500/5' : 'bg-red-500/5'
                  }`}
                >
                  <Badge variant="secondary" className={`text-[10px] h-5 ${
                    trade.type === 'buy' 
                      ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                      : 'bg-red-500/20 text-red-400 border-red-500/30'
                  }`}>
                    {trade.type.toUpperCase()}
                  </Badge>
                  <span className="text-muted-foreground font-mono text-xs">
                    {trade.walletAddress.slice(0, 4)}...{trade.walletAddress.slice(-4)}
                  </span>
                  <span className="font-medium">{trade.tokenSymbol}</span>
                  <span className="text-muted-foreground ml-auto">
                    {trade.amount.toLocaleString()} tokens
                  </span>
                  <span className={`font-medium ${trade.type === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                    ${trade.totalValue.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground text-xs">{trade.dex}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <ChevronDown className="w-5 h-5 text-muted-foreground" />
      </motion.div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: Radar,
      title: 'Real-Time Whale Tracking',
      description: 'Monitor large SOL buys and smart money wallets across DexScreener, BullX, and Axiom in real-time.',
      color: 'purple',
    },
    {
      icon: Copy,
      title: 'Auto Copy Trading',
      description: 'Mirror profitable whale trades automatically with customizable risk management and position sizing.',
      color: 'cyan',
    },
    {
      icon: Brain,
      title: 'AI-Powered Scoring',
      description: 'Trust scores, rug probability, momentum analysis, and social hype scoring powered by AI.',
      color: 'green',
    },
    {
      icon: Shield,
      title: 'Rug Detection',
      description: 'Advanced rug pull detection with contract analysis, liquidity verification, and holder distribution checks.',
      color: 'yellow',
    },
    {
      icon: ScanSearch,
      title: 'Meme Coin Scanner',
      description: 'Discover trending meme coins, new launches, and volume spikes before they go viral.',
      color: 'red',
    },
    {
      icon: Bell,
      title: 'Instant Alerts',
      description: 'Get notified via Telegram, Discord, browser, or email when whales make moves.',
      color: 'purple',
    },
  ];

  const colorMap: Record<string, string> = {
    purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/20 text-purple-400',
    cyan: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/20 text-cyan-400',
    green: 'from-green-500/20 to-green-500/5 border-green-500/20 text-green-400',
    yellow: 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/20 text-yellow-400',
    red: 'from-red-500/20 to-red-500/5 border-red-500/20 text-red-400',
  };

  const iconColorMap: Record<string, string> = {
    purple: 'text-purple-400',
    cyan: 'text-cyan-400',
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    red: 'text-red-400',
  };

  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 bg-purple-500/10 text-purple-400 border-purple-500/30">
            Features
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything You Need to{' '}
            <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Follow Smart Money
            </span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Built for degas who want an edge. Track, analyze, and copy the most profitable wallets on Solana.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className={`bg-gradient-to-b ${colorMap[feature.color]} border hover:scale-[1.02] transition-transform duration-300 h-full`}>
                <CardContent className="p-6">
                  <feature.icon className={`w-8 h-8 ${iconColorMap[feature.color]} mb-4`} />
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DashboardPreview() {
  const { setWalletConnected, setWalletAddress, setWalletBalance, setCurrentPage } = useAppStore();

  const handleConnect = async () => {
    if (isPhantomInstalled()) {
      const address = await connectPhantomWallet();
      if (address) {
        setWalletAddress(address);
      } else {
        setWalletAddress(DEMO_WALLET_ADDRESS);
      }
    } else {
      setWalletAddress(DEMO_WALLET_ADDRESS);
    }
    setWalletConnected(true);
    setWalletBalance(DEMO_WALLET_BALANCE);
    toast.success('Welcome to WhaleRadar!', {
      description: 'Your dashboard is ready.',
    });
    setCurrentPage('dashboard');
  };

  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
            Dashboard
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Your Command Center
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Monitor portfolios, track whales, and execute copy trades from one powerful dashboard.
          </p>
        </div>

        {/* Dashboard mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="glass-card rounded-2xl p-6 neon-glow-purple max-w-5xl mx-auto"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Portfolio Value', value: '$48,750', change: '+20.6%', up: true },
              { label: 'SOL Balance', value: '45.8 SOL', change: '', up: true },
              { label: 'Active Positions', value: '7', change: '', up: true },
              { label: "Today's P&L", value: '+$1,250', change: '+2.64%', up: true },
            ].map((item) => (
              <div key={item.label} className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-[11px] text-muted-foreground mb-1">{item.label}</p>
                <p className="text-lg font-bold">{item.value}</p>
                {item.change && (
                  <p className={`text-xs ${item.up ? 'text-green-400' : 'text-red-400'}`}>
                    {item.change}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Chart placeholder */}
          <div className="bg-white/5 rounded-lg p-4 border border-white/10 mb-4 h-48 flex items-end gap-1">
            {Array.from({ length: 30 }).map((_, i) => {
              const height = 20 + Math.random() * 80;
              return (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-purple-500/40 to-purple-500/10 rounded-t"
                  style={{ height: `${height}%` }}
                />
              );
            })}
          </div>

          {/* Live feed */}
          <div className="space-y-2">
            {liveWhaleTrades.slice(0, 3).map((trade) => (
              <div key={trade.id} className="flex items-center gap-3 px-3 py-2 bg-white/5 rounded-lg text-sm">
                <Badge variant="secondary" className={`text-[10px] h-5 ${
                  trade.type === 'buy' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {trade.type.toUpperCase()}
                </Badge>
                <span className="font-mono text-xs text-muted-foreground">
                  {trade.walletAddress.slice(0, 4)}...{trade.walletAddress.slice(-4)}
                </span>
                <span className="font-medium">{trade.tokenSymbol}</span>
                <span className="ml-auto text-muted-foreground">${trade.totalValue.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="text-center mt-8">
          <Button
            size="lg"
            onClick={handleConnect}
            className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white neon-glow-purple"
          >
            <Eye className="w-4 h-4 mr-2" />
            Try the Dashboard
          </Button>
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  const { setWalletConnected, setWalletAddress, setWalletBalance, setCurrentPage, setUserPlan } = useAppStore();

  const handleSelectPlan = async (planId: string) => {
    if (isPhantomInstalled()) {
      const address = await connectPhantomWallet();
      if (address) {
        setWalletAddress(address);
      } else {
        setWalletAddress(DEMO_WALLET_ADDRESS);
      }
    } else {
      setWalletAddress(DEMO_WALLET_ADDRESS);
    }
    setWalletConnected(true);
    setWalletBalance(DEMO_WALLET_BALANCE);
    setUserPlan(planId as 'free' | 'pro' | 'elite');
    toast.success(`${planId === 'free' ? 'Free' : planId === 'pro' ? 'Pro' : 'Elite'} plan activated!`, {
      description: 'Welcome to WhaleRadar AI.',
    });
    setCurrentPage('dashboard');
  };

  return (
    <section className="py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 bg-green-500/10 text-green-400 border-green-500/30">
            Pricing
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Choose Your Edge
          </h2>
          <p className="text-muted-foreground">
            Start free, upgrade when you&apos;re ready to go pro.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {subscriptionPlans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className={`h-full ${
                plan.highlighted
                  ? 'border-purple-500/50 neon-glow-purple bg-gradient-to-b from-purple-500/10 to-transparent'
                  : 'border-white/10 bg-[#12121a]'
              }`}>
                <CardContent className="p-6">
                  {plan.highlighted && (
                    <Badge className="mb-4 bg-purple-500/20 text-purple-400 border-purple-500/30">
                      Most Popular
                    </Badge>
                  )}
                  <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-3xl font-bold">
                      {plan.price === 0 ? 'Free' : `$${plan.price}`}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-muted-foreground text-sm">/{plan.period}</span>
                    )}
                  </div>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-400 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full ${
                      plan.highlighted
                        ? 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white'
                        : 'bg-white/10 hover:bg-white/20 text-foreground'
                    }`}
                    onClick={() => handleSelectPlan(plan.id)}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const faqs = [
    {
      q: 'How does whale tracking work?',
      a: 'We monitor the Solana blockchain in real-time using Helius webhooks and Birdeye API. When a wallet makes a large buy above your threshold, you get instant notification.',
    },
    {
      q: 'Is copy trading safe?',
      a: 'Copy trading involves risk. We provide risk management tools like stop-loss, take-profit, and position limits. Never invest more than you can afford to lose.',
    },
    {
      q: 'Which wallets are supported?',
      a: 'Currently we support Phantom wallet. More wallets like Solflare, Backpack, and Ledger are coming soon.',
    },
    {
      q: 'How are whales identified?',
      a: 'Our AI scores wallets based on trading history, win rate, ROI, holding patterns, and trade frequency. High-confidence wallets are flagged as "smart money."',
    },
    {
      q: 'What is AI trade scoring?',
      a: 'AI trade scoring analyzes entry timing, momentum, social sentiment, and historical patterns to rate each trade opportunity from 1-100.',
    },
  ];

  return (
    <section className="py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
            FAQ
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Common Questions</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-lg p-4"
            >
              <h3 className="font-semibold mb-2">{faq.q}</h3>
              <p className="text-sm text-muted-foreground">{faq.a}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const testimonials = [
    {
      name: 'CryptoDegens.sol',
      role: 'Pro Trader',
      text: 'WhaleRadar helped me catch the WIF pump 3 hours before it went viral. Made 8x on my position.',
      avatar: '🟣',
    },
    {
      name: 'SolWhisperer',
      role: 'Elite Member',
      text: 'The copy trading feature is insane. I just follow the top 3 whales and let it run. Up 120% this month.',
      avatar: '🔵',
    },
    {
      name: 'DiamondHands.dev',
      role: 'Pro Member',
      text: 'Best rug detection I\'ve seen. Saved me from at least 5 rugs this week alone.',
      avatar: '🟢',
    },
  ];

  return (
    <section className="py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 bg-purple-500/10 text-purple-400 border-purple-500/30">
            Testimonials
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Trusted by{' '}
            <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Smart Traders
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="bg-[#12121a] border-white/10 h-full">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/30 to-cyan-500/30 flex items-center justify-center text-lg">
                      {t.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground italic">&ldquo;{t.text}&rdquo;</p>
                  <div className="flex gap-0.5 mt-3">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatsSection() {
  const stats = [
    { value: '2,500+', label: 'Whales Tracked', icon: Users },
    { value: '$48M+', label: 'Volume Monitored', icon: Volume2 },
    { value: '15K+', label: 'Active Traders', icon: Globe },
    { value: '99.2%', label: 'Uptime', icon: Lock },
  ];

  return (
    <section className="py-16 px-4 border-y border-white/5">
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="text-center"
          >
            <stat.icon className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <p className="text-2xl md:text-3xl font-bold neon-text-purple">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  const { setWalletConnected, setWalletAddress, setCurrentPage } = useAppStore();

  return (
    <footer className="py-12 px-4 border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center">
              <Waves className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold neon-text-purple">WhaleRadar AI</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <button onClick={() => setCurrentPage('pricing')} className="hover:text-foreground transition-colors">Pricing</button>
            <a href="https://dexscreener.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors flex items-center gap-1">
              DexScreener <ExternalLink className="w-3 h-3" />
            </a>
            <a href="https://bullx.io" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors flex items-center gap-1">
              BullX <ExternalLink className="w-3 h-3" />
            </a>
            <a href="https://axiom.trade" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors flex items-center gap-1">
              Axiom <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <p className="text-xs text-muted-foreground/50">
            This is not financial advice. Trade at your own risk.
          </p>
        </div>
      </div>
    </footer>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <DashboardPreview />
      <TestimonialsSection />
      <PricingSection />
      <FAQSection />
      <Footer />
    </div>
  );
}
