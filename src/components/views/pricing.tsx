'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  CreditCard, Check, Star, Zap, Shield, Crown,
  ArrowRight, Wallet, TrendingUp, Copy, Bell,
  BarChart3, Brain, Eye, Lock, Users, Globe,
  Sparkles, Rocket, Award,
} from 'lucide-react';
import { subscriptionPlans } from '@/lib/mock-data';

export function PricingView() {
  const { userPlan, setUserPlan, walletConnected, setWalletConnected, setWalletAddress, setCurrentPage } = useAppStore();
  const [annual, setAnnual] = useState(false);

  const handleSelectPlan = (planId: string) => {
    if (!walletConnected) {
      setWalletAddress('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
      setWalletConnected(true);
    }
    setUserPlan(planId as 'free' | 'pro' | 'elite');
    setCurrentPage('dashboard');
  };

  const planIcons: Record<string, React.ElementType> = {
    free: Zap,
    pro: Rocket,
    elite: Crown,
  };

  const planColors: Record<string, string> = {
    free: 'from-gray-500/20 to-gray-500/5',
    pro: 'from-purple-500/20 to-purple-500/5',
    elite: 'from-cyan-500/20 to-cyan-500/5',
  };

  const planBorderColors: Record<string, string> = {
    free: 'border-white/10',
    pro: 'border-purple-500/50',
    elite: 'border-cyan-500/50',
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <Badge variant="secondary" className="mb-4 bg-purple-500/10 text-purple-400 border-purple-500/30">
          <CreditCard className="w-3 h-3 mr-1" /> Pricing
        </Badge>
        <h1 className="text-3xl md:text-4xl font-bold mb-3">
          Choose Your{' '}
          <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Trading Edge
          </span>
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Start free, upgrade when you&apos;re ready. All plans include real-time whale tracking.
        </p>

        {/* Annual Toggle */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <span className={`text-sm ${!annual ? 'text-foreground' : 'text-muted-foreground'}`}>Monthly</span>
          <Switch checked={annual} onCheckedChange={setAnnual} />
          <span className={`text-sm ${annual ? 'text-foreground' : 'text-muted-foreground'}`}>
            Annual <Badge variant="secondary" className="ml-1 text-[10px] bg-green-500/20 text-green-400 border-green-500/30">Save 20%</Badge>
          </span>
        </div>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {subscriptionPlans.map((plan, i) => {
          const Icon = planIcons[plan.id] || Zap;
          const isCurrentPlan = userPlan === plan.id;
          const price = annual && plan.price > 0 ? Math.floor(plan.price * 0.8) : plan.price;

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className={`h-full bg-gradient-to-b ${planColors[plan.id]} ${planBorderColors[plan.id]} ${
                plan.highlighted ? 'neon-glow-purple' : ''
              } relative overflow-hidden`}>
                {plan.highlighted && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-cyan-500" />
                )}
                <CardContent className="p-6">
                  {plan.highlighted && (
                    <Badge className="mb-4 bg-purple-500/20 text-purple-400 border-purple-500/30">
                      <Star className="w-3 h-3 mr-1" /> Most Popular
                    </Badge>
                  )}
                  {isCurrentPlan && (
                    <Badge className="mb-4 bg-green-500/20 text-green-400 border-green-500/30">
                      <Check className="w-3 h-3 mr-1" /> Current Plan
                    </Badge>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                  </div>

                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-bold">
                      {price === 0 ? 'Free' : `$${price}`}
                    </span>
                    {price > 0 && (
                      <span className="text-muted-foreground text-sm">
                        /{annual ? 'mo (billed yearly)' : plan.period}
                      </span>
                    )}
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full ${
                      isCurrentPlan
                        ? 'bg-white/10 text-muted-foreground cursor-default'
                        : plan.highlighted
                          ? 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white'
                          : 'bg-white/10 hover:bg-white/20 text-foreground'
                    }`}
                    onClick={() => !isCurrentPlan && handleSelectPlan(plan.id)}
                    disabled={isCurrentPlan}
                  >
                    {isCurrentPlan ? 'Current Plan' : plan.cta}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Comparison */}
      <div className="max-w-4xl mx-auto">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-center">Feature Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Feature</th>
                    <th className="text-center py-3 px-4 text-muted-foreground font-medium">Free</th>
                    <th className="text-center py-3 px-4 text-purple-400 font-medium">Pro</th>
                    <th className="text-center py-3 px-4 text-cyan-400 font-medium">Elite</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[
                    ['Whale Tracking', 'Basic', 'Real-time', 'Real-time + AI'],
                    ['Whale Follows', '5', '50', 'Unlimited'],
                    ['Copy Trading', 'Manual', '3 whales', 'Unlimited'],
                    ['Alerts', '15 min delay', 'Instant', 'Instant + Custom'],
                    ['Rug Detection', '—', '✓', '✓ + Advanced'],
                    ['AI Scoring', '—', '—', '✓'],
                    ['API Access', '—', '—', '✓'],
                    ['Support', 'Community', 'Priority', 'Dedicated'],
                  ].map(([feature, free, pro, elite]) => (
                    <tr key={feature} className="hover:bg-white/5">
                      <td className="py-3 px-4">{feature}</td>
                      <td className="py-3 px-4 text-center text-muted-foreground">{free}</td>
                      <td className="py-3 px-4 text-center text-purple-400">{pro}</td>
                      <td className="py-3 px-4 text-center text-cyan-400">{elite}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Disclaimer */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground/50">
          This is not financial advice. All trading involves risk. Past performance does not guarantee future results.
        </p>
      </div>
    </div>
  );
}
