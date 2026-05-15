'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  X, ChevronRight, ChevronLeft, Zap, Radar, Copy,
  ScanSearch, Trophy, Wallet, ArrowRight, Check,
  Waves, Sparkles, Play,
} from 'lucide-react';

const GUIDE_STEPS = [
  {
    title: 'Welcome to WhaleRadar AI! 🐋',
    description: 'Your AI-powered command center for tracking smart money and copy trading on Solana. Let us show you around!',
    icon: Waves,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
  },
  {
    title: 'Dashboard Overview',
    description: 'Your portfolio, live whale feed, active copy trades, and market volume — all in one place. Monitor your positions and P&L in real-time.',
    icon: Wallet,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
    action: 'dashboard',
  },
  {
    title: 'Track Smart Money',
    description: 'Browse and filter whale wallets by confidence score, ROI, win rate, and tags. Follow whales to get alerts when they make moves.',
    icon: Radar,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    action: 'whale-tracker',
  },
  {
    title: 'Discover Meme Coins',
    description: 'Scan trending meme tokens with AI-powered analysis, rug risk detection, trust scores, and whale activity. Filter by volume, liquidity, and more.',
    icon: ScanSearch,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    action: 'scanner',
  },
  {
    title: 'Copy Trade Whales',
    description: 'Set up copy trades to automatically mirror profitable whale moves. Configure risk management with stop-loss, take-profit, and position limits.',
    icon: Copy,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
    action: 'copy-trading',
  },
  {
    title: 'Ready to Trade! 🚀',
    description: 'You\'re all set! Navigate using the sidebar, explore whales, discover tokens, and start copy trading. This is a demo — all trades are simulated.',
    icon: Sparkles,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
  },
];

export function DemoWelcomeGuide() {
  const { showDemoGuide, setShowDemoGuide, demoGuideStep, setDemoGuideStep, setCurrentPage } = useAppStore();
  const [isVisible, setIsVisible] = useState(showDemoGuide);

  // Use a ref to handle the animation timeout
  useEffect(() => {
    if (showDemoGuide) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [showDemoGuide]);

  // Sync visibility when guide closes
  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      setShowDemoGuide(false);
    }, 200);
  };

  if (!showDemoGuide) return null;

  const currentStep = GUIDE_STEPS[demoGuideStep];
  const isLastStep = demoGuideStep === GUIDE_STEPS.length - 1;
  const progress = ((demoGuideStep + 1) / GUIDE_STEPS.length) * 100;

  const handleNext = () => {
    if (isLastStep) {
      handleDismiss();
      setCurrentPage('dashboard');
    } else {
      // Navigate to the relevant page if the step has an action
      if (currentStep.action) {
        setCurrentPage(currentStep.action as any);
      }
      setDemoGuideStep(demoGuideStep + 1);
    }
  };

  const handlePrev = () => {
    if (demoGuideStep > 0) {
      setDemoGuideStep(demoGuideStep - 1);
    }
  };

  const handleSkip = () => {
    handleDismiss();
    setCurrentPage('dashboard');
  };

  const Icon = currentStep.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100]"
            onClick={handleSkip}
          />

          {/* Guide Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="glass-card neon-glow-purple w-full max-w-lg border-purple-500/30">
              <CardContent className="p-8">
                {/* Close button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-3 right-3 h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={handleSkip}
                >
                  <X className="w-4 h-4" />
                </Button>

                {/* Progress */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-muted-foreground">Step {demoGuideStep + 1} of {GUIDE_STEPS.length}</span>
                    <span className="text-[10px] text-muted-foreground">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                </div>

                {/* Icon */}
                <motion.div
                  key={`icon-${demoGuideStep}`}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
                  className={`w-16 h-16 rounded-2xl ${currentStep.bgColor} flex items-center justify-center mx-auto mb-6`}
                >
                  <Icon className={`w-8 h-8 ${currentStep.color}`} />
                </motion.div>

                {/* Title */}
                <motion.h2
                  key={`title-${demoGuideStep}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="text-xl font-bold text-center mb-3"
                >
                  {currentStep.title}
                </motion.h2>

                {/* Description */}
                <motion.p
                  key={`desc-${demoGuideStep}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-sm text-muted-foreground text-center mb-8 leading-relaxed"
                >
                  {currentStep.description}
                </motion.p>

                {/* Step indicators */}
                <div className="flex items-center justify-center gap-2 mb-6">
                  {GUIDE_STEPS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setDemoGuideStep(i)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        i === demoGuideStep
                          ? 'w-6 bg-purple-500'
                          : i < demoGuideStep
                            ? 'bg-purple-500/50'
                            : 'bg-white/20'
                      }`}
                    />
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={handleSkip}
                  >
                    Skip Tour
                  </Button>

                  <div className="flex items-center gap-2">
                    {demoGuideStep > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-white/20"
                        onClick={handlePrev}
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" /> Back
                      </Button>
                    )}
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white"
                      onClick={handleNext}
                    >
                      {isLastStep ? (
                        <>
                          <Play className="w-4 h-4 mr-1" /> Start Trading
                        </>
                      ) : (
                        <>
                          Next <ChevronRight className="w-4 h-4 ml-1" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
