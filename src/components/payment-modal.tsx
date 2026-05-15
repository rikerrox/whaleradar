'use client';

import React, { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { apiClient } from '@/lib/api-client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  Loader2,
  CheckCircle2,
  Wallet,
  Crown,
  Zap,
  Shield,
  Sparkles,
  ArrowRight,
  Star,
  Globe,
} from 'lucide-react';

const SOL_PRICE_USD = 142.58;

const PLAN_CONFIG = {
  pro: {
    name: 'Pro',
    monthlyPrice: 49,
    annualPrice: 470,
    icon: Zap,
    color: 'purple',
    gradient: 'from-purple-600 to-purple-400',
    borderGlow: 'border-purple-500/30',
    benefits: [
      'Real-time whale alerts',
      'Up to 10 copy trades',
      'Advanced token scanner',
      'Priority support',
    ],
  },
  elite: {
    name: 'Elite',
    monthlyPrice: 149,
    annualPrice: 1430,
    icon: Crown,
    color: 'yellow',
    gradient: 'from-yellow-600 to-amber-400',
    borderGlow: 'border-yellow-500/30',
    benefits: [
      'Everything in Pro',
      'Unlimited copy trades',
      'AI-powered predictions',
      'Private whale network',
      'Custom alerts & webhooks',
      'Dedicated account manager',
    ],
  },
} as const;

type PlanKey = keyof typeof PLAN_CONFIG;

export function PaymentModal() {
  const {
    showPaymentModal,
    setShowPaymentModal,
    paymentPlan,
    setUserPlan,
    walletBalance,
  } = useAppStore();

  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'sol'>('card');

  // Card form state (all accept any input - simulated)
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Processing state
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const planKey = (paymentPlan || 'pro') as PlanKey;
  const plan = PLAN_CONFIG[planKey] || PLAN_CONFIG.pro;
  const PlanIcon = plan.icon;

  const price = billing === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
  const monthlyEquivalent = billing === 'annual' ? (plan.annualPrice / 12).toFixed(2) : null;
  const solEquivalent = (price / SOL_PRICE_USD).toFixed(4);
  const savings = billing === 'annual' ? plan.monthlyPrice * 12 - plan.annualPrice : 0;

  const solBalanceSufficient = walletBalance >= parseFloat(solEquivalent);

  const resetState = () => {
    setBilling('monthly');
    setPaymentMethod('card');
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setProcessing(false);
    setPaymentSuccess(false);
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 16);
    return cleaned.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 3) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    }
    return cleaned;
  };

  const handlePayment = async () => {
    if (paymentMethod === 'card') {
      if (!cardNumber.replace(/\s/g, '') || !cardExpiry || !cardCvv) {
        toast.error('Missing card details', { description: 'Please fill in all card fields' });
        return;
      }
    } else {
      if (!solBalanceSufficient) {
        toast.error('Insufficient SOL balance', {
          description: `You need at least ${solEquivalent} SOL. Current balance: ${walletBalance.toFixed(2)} SOL`,
        });
        return;
      }
    }

    setProcessing(true);

    try {
      // Create checkout session
      const checkout = await apiClient.createCheckout(planKey, billing);

      if (checkout.error) {
        // Even on API error, allow simulated success
        await simulatePaymentSuccess();
        return;
      }

      const checkoutData = checkout.data as {
        checkoutId: string;
        amount: number;
        currency: string;
        plan: string;
        billing: string;
      } | null;

      if (checkoutData?.checkoutId) {
        // Verify payment
        const verifyResult = await apiClient.verifyPayment(
          checkoutData.checkoutId,
          paymentMethod === 'sol' ? 'sol' : 'card'
        );

        if (verifyResult.data && !verifyResult.error) {
          const verifyData = verifyResult.data as {
            success: boolean;
            plan: string;
            status: string;
            amount: number;
          };

          if (verifyData.success) {
            setUserPlan(verifyData.plan as 'pro' | 'elite');
            setPaymentSuccess(true);
            toast.success('Plan upgraded!', {
              description: `You are now on the ${verifyData.plan.toUpperCase()} plan`,
            });
            return;
          }
        }
      }

      // Fallback: simulate success
      await simulatePaymentSuccess();
    } catch {
      // Fallback: simulate success
      await simulatePaymentSuccess();
    } finally {
      setProcessing(false);
    }
  };

  const simulatePaymentSuccess = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setUserPlan(planKey as 'pro' | 'elite');
    setPaymentSuccess(true);
    toast.success('Plan upgraded!', {
      description: `You are now on the ${plan.name} plan`,
    });
  };

  return (
    <Dialog open={showPaymentModal} onOpenChange={(open) => {
      if (!open) {
        setShowPaymentModal(false);
        resetState();
      }
    }}>
      <DialogContent className="sm:max-w-[500px] bg-[#0f0f18] border-white/10 text-foreground p-0 overflow-hidden">
        {/* Header gradient bar */}
        <div className={`h-1 w-full bg-gradient-to-r ${
          planKey === 'elite'
            ? 'from-yellow-500 via-amber-400 to-yellow-500'
            : 'from-purple-500 via-cyan-400 to-purple-500'
        }`} />

        <div className="p-6 pt-5">
          <DialogHeader className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${plan.gradient} flex items-center justify-center`}>
                <PlanIcon className="w-5 h-5 text-white" />
              </div>
              <DialogTitle className="text-lg">Upgrade to {plan.name}</DialogTitle>
              <Badge className={`text-[9px] h-4 px-1.5 ${
                planKey === 'elite'
                  ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                  : 'bg-purple-500/20 text-purple-400 border-purple-500/30'
              }`}>
                {plan.name.toUpperCase()}
              </Badge>
            </div>
            <DialogDescription className="text-muted-foreground text-sm">
              Unlock premium features and maximize your trading edge
            </DialogDescription>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {paymentSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="py-6 flex flex-col items-center text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                >
                  <CheckCircle2 className={`w-16 h-16 mb-4 ${
                    planKey === 'elite' ? 'text-yellow-400' : 'text-purple-400'
                  }`} />
                </motion.div>
                <h3 className="text-lg font-semibold mb-1">Welcome to {plan.name}!</h3>
                <p className="text-sm text-muted-foreground mb-5">
                  Your account has been upgraded successfully
                </p>

                {/* Benefits unlocked */}
                <div className="glass-card rounded-lg p-4 w-full max-w-xs text-left">
                  <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Unlocked Benefits</p>
                  <div className="space-y-2">
                    {plan.benefits.map((benefit, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + idx * 0.1 }}
                        className="flex items-center gap-2"
                      >
                        <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${
                          planKey === 'elite' ? 'text-yellow-400' : 'text-purple-400'
                        }`} />
                        <span className="text-xs text-foreground">{benefit}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => {
                    setShowPaymentModal(false);
                    resetState();
                  }}
                  className={`mt-5 bg-gradient-to-r ${plan.gradient} text-white font-medium`}
                >
                  Start Trading <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Billing Toggle */}
                <div className="glass-card rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setBilling('monthly')}
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 ${
                        billing === 'monthly'
                          ? `bg-${plan.color}-500/20 text-${plan.color}-400 border border-${plan.color}-500/30`
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                      style={billing === 'monthly' ? {
                        background: planKey === 'elite' ? 'rgba(234,179,8,0.2)' : 'rgba(168,85,247,0.2)',
                        color: planKey === 'elite' ? '#facc15' : '#a855f7',
                        borderColor: planKey === 'elite' ? 'rgba(234,179,8,0.3)' : 'rgba(168,85,247,0.3)',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                      } : {}}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setBilling('annual')}
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 relative ${
                        billing === 'annual'
                          ? 'text-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                      style={billing === 'annual' ? {
                        background: planKey === 'elite' ? 'rgba(234,179,8,0.2)' : 'rgba(168,85,247,0.2)',
                        color: planKey === 'elite' ? '#facc15' : '#a855f7',
                        borderColor: planKey === 'elite' ? 'rgba(234,179,8,0.3)' : 'rgba(168,85,247,0.3)',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                      } : {}}
                    >
                      Annual
                      <Badge className="absolute -top-2 -right-1 text-[8px] h-3.5 px-1 bg-green-500/20 text-green-400 border-green-500/30">
                        -20%
                      </Badge>
                    </button>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="glass-card rounded-lg p-4 mb-4">
                  <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Order Summary</p>

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">WhaleRadar {plan.name}</span>
                    <span className="text-sm font-medium">${price}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">Billing</span>
                    <span className="text-xs text-muted-foreground capitalize">{billing}</span>
                  </div>
                  {monthlyEquivalent && (
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">Monthly equivalent</span>
                      <span className="text-xs text-green-400">${monthlyEquivalent}/mo</span>
                    </div>
                  )}
                  {savings > 0 && (
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">You save</span>
                      <span className="text-xs text-green-400 font-medium">${savings}/year</span>
                    </div>
                  )}

                  <Separator className="bg-white/10 my-3" />

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Total</span>
                    <div className="text-right">
                      <span className="text-lg font-bold">${price}</span>
                      <span className="text-xs text-muted-foreground ml-1">
                        /{billing === 'monthly' ? 'mo' : 'yr'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Method Toggle */}
                <div className="mb-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Payment Method</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPaymentMethod('card')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200 border ${
                        paymentMethod === 'card'
                          ? 'bg-white/10 border-purple-500/40 text-foreground'
                          : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      Credit Card
                    </button>
                    <button
                      onClick={() => setPaymentMethod('sol')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200 border ${
                        paymentMethod === 'sol'
                          ? 'bg-white/10 border-cyan-500/40 text-foreground'
                          : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10'
                      }`}
                    >
                      <Wallet className="w-4 h-4" />
                      Pay with SOL
                      <Badge variant="secondary" className="text-[8px] h-3 px-1 bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                        {solEquivalent} SOL
                      </Badge>
                    </button>
                  </div>
                </div>

                {/* Card Form or SOL Info */}
                {paymentMethod === 'card' ? (
                  <div className="space-y-3 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="card-number" className="text-xs text-muted-foreground">Card Number</Label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="card-number"
                          placeholder="4242 4242 4242 4242"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                          className="pl-9 h-10 bg-white/5 border-white/10 placeholder:text-muted-foreground/40 font-mono focus:border-purple-500/50 focus:ring-purple-500/20"
                          disabled={processing}
                        />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="card-expiry" className="text-xs text-muted-foreground">Expiry</Label>
                        <Input
                          id="card-expiry"
                          placeholder="MM/YY"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                          className="h-10 bg-white/5 border-white/10 placeholder:text-muted-foreground/40 font-mono focus:border-purple-500/50 focus:ring-purple-500/20"
                          disabled={processing}
                          maxLength={5}
                        />
                      </div>
                      <div className="w-24 space-y-2">
                        <Label htmlFor="card-cvv" className="text-xs text-muted-foreground">CVV</Label>
                        <Input
                          id="card-cvv"
                          placeholder="123"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          className="h-10 bg-white/5 border-white/10 placeholder:text-muted-foreground/40 font-mono focus:border-purple-500/50 focus:ring-purple-500/20"
                          disabled={processing}
                          type="password"
                          maxLength={4}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded-md bg-white/5">
                      <Shield className="w-3.5 h-3.5 text-green-400 shrink-0" />
                      <span className="text-[10px] text-muted-foreground">
                        Your payment information is encrypted and secure. This is a simulated checkout.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 mb-4">
                    <div className="glass-card rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-muted-foreground">Wallet Balance</span>
                        <span className="text-sm font-bold">{walletBalance.toFixed(2)} SOL</span>
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-muted-foreground">Amount Due</span>
                        <span className="text-sm font-medium">{solEquivalent} SOL</span>
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-muted-foreground">USD Value</span>
                        <span className="text-sm text-muted-foreground">${price}</span>
                      </div>
                      <Separator className="bg-white/10 my-2" />
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Remaining After</span>
                        <span className={`text-sm font-medium ${
                          solBalanceSufficient ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {solBalanceSufficient
                            ? `${(walletBalance - parseFloat(solEquivalent)).toFixed(2)} SOL`
                            : 'Insufficient'}
                        </span>
                      </div>
                    </div>

                    {!solBalanceSufficient && (
                      <div className="flex items-center gap-2 p-2.5 rounded-md bg-red-500/10 border border-red-500/20">
                        <Wallet className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        <span className="text-[10px] text-red-400">
                          Insufficient SOL balance. Please deposit more SOL or use a credit card.
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Process Payment Button */}
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Button
                    onClick={handlePayment}
                    disabled={processing || (paymentMethod === 'sol' && !solBalanceSufficient)}
                    className={`w-full h-11 bg-gradient-to-r ${plan.gradient} text-white font-medium transition-all duration-300`}
                  >
                    {processing ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      paymentMethod === 'card' ? (
                        <CreditCard className="h-4 w-4 mr-2" />
                      ) : (
                        <Wallet className="h-4 w-4 mr-2" />
                      )
                    )}
                    {processing
                      ? 'Processing Payment...'
                      : paymentMethod === 'card'
                      ? `Pay $${price} with Card`
                      : `Pay ${solEquivalent} SOL`
                    }
                  </Button>
                </motion.div>

                {/* Features preview */}
                <div className="mt-4 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                  <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wider">What you&apos;ll unlock</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {plan.benefits.slice(0, 4).map((benefit, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <Star className={`w-3 h-3 shrink-0 ${
                          planKey === 'elite' ? 'text-yellow-400' : 'text-purple-400'
                        }`} />
                        <span className="text-[10px] text-muted-foreground">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
