'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { apiClient } from '@/lib/api-client';
import { isPhantomInstalled, connectPhantomWallet, DEMO_WALLET_ADDRESS, DEMO_WALLET_BALANCE } from '@/lib/wallet';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Loader2,
  Zap,
  ArrowRight,
  Shield,
} from 'lucide-react';

export function AuthModal() {
  const {
    showAuthModal,
    setShowAuthModal,
    authModalTab,
    setAuthModalTab,
    loginWithEmail,
    loginWithWallet,
    register,
    setWalletConnected,
    setWalletAddress,
    setWalletBalance,
    setDemoMode,
    setCurrentPage,
    setShowDemoGuide,
    setDemoGuideStep,
  } = useAppStore();

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Register form state
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regWalletAddr, setRegWalletAddr] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');

  // Wallet connect state
  const [walletLoading, setWalletLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const resetForms = () => {
    setLoginEmail('');
    setLoginPassword('');
    setLoginError('');
    setShowLoginPassword(false);
    setRegEmail('');
    setRegUsername('');
    setRegPassword('');
    setRegWalletAddr('');
    setRegError('');
    setShowRegPassword(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginEmail.trim()) {
      setLoginError('Email is required');
      return;
    }
    if (!loginPassword.trim()) {
      setLoginError('Password is required');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(loginEmail)) {
      setLoginError('Please enter a valid email address');
      return;
    }

    setLoginLoading(true);
    try {
      const result = await loginWithEmail(loginEmail, loginPassword);
      if (result.success) {
        toast.success('Welcome back!', { description: 'Successfully logged in' });
        setShowAuthModal(false);
        resetForms();
        setCurrentPage('dashboard');
      } else {
        setLoginError(result.error || 'Login failed');
      }
    } catch {
      setLoginError('An unexpected error occurred');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regEmail.trim()) {
      setRegError('Email is required');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(regEmail)) {
      setRegError('Please enter a valid email address');
      return;
    }
    if (!regUsername.trim()) {
      setRegError('Username is required');
      return;
    }
    if (regUsername.trim().length < 3) {
      setRegError('Username must be at least 3 characters');
      return;
    }
    if (!regPassword.trim()) {
      setRegError('Password is required');
      return;
    }
    if (regPassword.length < 8) {
      setRegError('Password must be at least 8 characters');
      return;
    }

    setRegLoading(true);
    try {
      const result = await register(regEmail, regUsername, regPassword, regWalletAddr || undefined);
      if (result.success) {
        toast.success('Account created!', { description: 'Welcome to WhaleRadar AI' });
        setShowAuthModal(false);
        resetForms();
        setCurrentPage('dashboard');
      } else {
        setRegError(result.error || 'Registration failed');
      }
    } catch {
      setRegError('An unexpected error occurred');
    } finally {
      setRegLoading(false);
    }
  };

  const handlePhantomConnect = async () => {
    if (!isPhantomInstalled()) {
      toast.error('Phantom wallet not detected', {
        description: 'Please install the Phantom browser extension',
      });
      return;
    }

    setWalletLoading(true);
    try {
      const address = await connectPhantomWallet();
      if (address) {
        const result = await loginWithWallet(address);
        if (result.success) {
          toast.success('Wallet connected!', { description: `Logged in as ${address.slice(0, 8)}...` });
          setShowAuthModal(false);
          resetForms();
          setCurrentPage('dashboard');
        } else {
          toast.error(result.error || 'Wallet login failed');
        }
      } else {
        toast.error('Connection rejected', { description: 'You cancelled the wallet connection' });
      }
    } catch {
      toast.error('Failed to connect wallet');
    } finally {
      setWalletLoading(false);
    }
  };

  const handleDemoMode = async () => {
    setDemoLoading(true);
    try {
      // Set up demo state immediately so user sees the dashboard
      setWalletConnected(true);
      setWalletAddress(DEMO_WALLET_ADDRESS);
      setWalletBalance(DEMO_WALLET_BALANCE);
      setDemoMode(true);
      setShowAuthModal(false);
      resetForms();
      setCurrentPage('dashboard');

      // Auto-start demo guide after a short delay
      setTimeout(() => {
        setDemoGuideStep(0);
        setShowDemoGuide(true);
      }, 500);

      toast.success('Demo mode activated!', {
        description: 'Explore all features with simulated data',
      });

      // Try to login or register with demo credentials for API calls
      // First try logging in with demo email (if account already exists)
      const loginResult = await loginWithEmail('demo@whaleradar.io', 'DemoWhaleRadar2024!');
      if (!loginResult.success) {
        // Try wallet login (might auto-register)
        const walletResult = await loginWithWallet(DEMO_WALLET_ADDRESS);
        if (!walletResult.success) {
          // Last resort: register with demo credentials
          await register('demo@whaleradar.io', 'DemoWhale', 'DemoWhaleRadar2024!', DEMO_WALLET_ADDRESS);
        }
      }

      // Re-ensure demo state is preserved after API calls
      setDemoMode(true);
      setWalletAddress(DEMO_WALLET_ADDRESS);
      setWalletBalance(DEMO_WALLET_BALANCE);
      setWalletConnected(true);
    } catch {
      // Even if API fails, demo mode still works locally
      // Re-ensure demo state
      setDemoMode(true);
      setWalletAddress(DEMO_WALLET_ADDRESS);
      setWalletBalance(DEMO_WALLET_BALANCE);
      setWalletConnected(true);
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <Dialog open={showAuthModal} onOpenChange={(open) => {
      if (!open) {
        setShowAuthModal(false);
        resetForms();
      }
    }}>
      <DialogContent className="sm:max-w-[460px] bg-[#0f0f18] border-white/10 text-foreground p-0 overflow-hidden">
        {/* Header gradient bar */}
        <div className="h-1 w-full bg-gradient-to-r from-purple-500 via-cyan-400 to-purple-500" />

        <div className="p-6 pt-5">
          <DialogHeader className="mb-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <DialogTitle className="text-xl neon-text-purple">WhaleRadar AI</DialogTitle>
            </div>
            <DialogDescription className="text-muted-foreground text-sm">
              Sign in to track whales, copy trades, and maximize your gains
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={authModalTab}
            onValueChange={(v) => setAuthModalTab(v as 'login' | 'register')}
            className="mt-4"
          >
            <TabsList className="w-full bg-white/5 border border-white/10 h-10">
              <TabsTrigger
                value="login"
                className="flex-1 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 data-[state=active]:border-purple-500/30 transition-all"
              >
                Login
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="flex-1 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 data-[state=active]:border-purple-500/30 transition-all"
              >
                Register
              </TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login" className="mt-4">
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Error message */}
                <AnimatePresence>
                  {loginError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
                    >
                      {loginError}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-xs text-muted-foreground">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      value={loginEmail}
                      onChange={(e) => { setLoginEmail(e.target.value); setLoginError(''); }}
                      className="pl-9 h-10 bg-white/5 border-white/10 placeholder:text-muted-foreground/40 focus:border-purple-500/50 focus:ring-purple-500/20"
                      disabled={loginLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-xs text-muted-foreground">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type={showLoginPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => { setLoginPassword(e.target.value); setLoginError(''); }}
                      className="pl-9 pr-10 h-10 bg-white/5 border-white/10 placeholder:text-muted-foreground/40 focus:border-purple-500/50 focus:ring-purple-500/20"
                      disabled={loginLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full h-10 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-medium transition-all duration-300"
                >
                  {loginLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ArrowRight className="h-4 w-4 mr-2" />
                  )}
                  {loginLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-[#0f0f18] text-muted-foreground">or continue with</span>
                </div>
              </div>

              {/* Wallet Connect */}
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={walletLoading}
                  onClick={handlePhantomConnect}
                  className="w-full h-10 bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300"
                >
                  {walletLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Wallet className="h-4 w-4 mr-2 text-purple-400" />
                  )}
                  {walletLoading ? 'Connecting...' : 'Connect with Phantom Wallet'}
                </Button>

                {/* Demo Mode */}
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Button
                    type="button"
                    disabled={demoLoading}
                    onClick={handleDemoMode}
                    className="w-full h-10 bg-gradient-to-r from-green-600/80 to-emerald-500/80 hover:from-green-500/80 hover:to-emerald-400/80 text-white font-medium transition-all duration-300 border border-green-500/30"
                  >
                    {demoLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Shield className="h-4 w-4 mr-2" />
                    )}
                    {demoLoading ? 'Starting Demo...' : 'Enter Demo Mode'}
                    <Badge variant="secondary" className="ml-2 text-[9px] h-4 px-1.5 bg-green-400/20 text-green-300 border-green-400/30">
                      FREE
                    </Badge>
                  </Button>
                </motion.div>
              </div>
            </TabsContent>

            {/* Register Tab */}
            <TabsContent value="register" className="mt-4">
              <form onSubmit={handleRegister} className="space-y-3">
                {/* Error message */}
                <AnimatePresence>
                  {regError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
                    >
                      {regError}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-2">
                  <Label htmlFor="reg-email" className="text-xs text-muted-foreground">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="you@example.com"
                      value={regEmail}
                      onChange={(e) => { setRegEmail(e.target.value); setRegError(''); }}
                      className="pl-9 h-10 bg-white/5 border-white/10 placeholder:text-muted-foreground/40 focus:border-purple-500/50 focus:ring-purple-500/20"
                      disabled={regLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-username" className="text-xs text-muted-foreground">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reg-username"
                      type="text"
                      placeholder="whale_hunter"
                      value={regUsername}
                      onChange={(e) => { setRegUsername(e.target.value); setRegError(''); }}
                      className="pl-9 h-10 bg-white/5 border-white/10 placeholder:text-muted-foreground/40 focus:border-purple-500/50 focus:ring-purple-500/20"
                      disabled={regLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-password" className="text-xs text-muted-foreground">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reg-password"
                      type={showRegPassword ? 'text' : 'password'}
                      placeholder="Min. 8 characters"
                      value={regPassword}
                      onChange={(e) => { setRegPassword(e.target.value); setRegError(''); }}
                      className="pl-9 pr-10 h-10 bg-white/5 border-white/10 placeholder:text-muted-foreground/40 focus:border-purple-500/50 focus:ring-purple-500/20"
                      disabled={regLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showRegPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-wallet" className="text-xs text-muted-foreground">
                    Wallet Address <span className="text-muted-foreground/50">(optional)</span>
                  </Label>
                  <div className="relative">
                    <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reg-wallet"
                      type="text"
                      placeholder="Solana wallet address"
                      value={regWalletAddr}
                      onChange={(e) => setRegWalletAddr(e.target.value)}
                      className="pl-9 h-10 bg-white/5 border-white/10 placeholder:text-muted-foreground/40 focus:border-purple-500/50 focus:ring-purple-500/20"
                      disabled={regLoading}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={regLoading}
                  className="w-full h-10 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-medium transition-all duration-300 mt-1"
                >
                  {regLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ArrowRight className="h-4 w-4 mr-2" />
                  )}
                  {regLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-[#0f0f18] text-muted-foreground">or</span>
                </div>
              </div>

              {/* Demo Mode */}
              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Button
                  type="button"
                  disabled={demoLoading}
                  onClick={handleDemoMode}
                  className="w-full h-10 bg-gradient-to-r from-green-600/80 to-emerald-500/80 hover:from-green-500/80 hover:to-emerald-400/80 text-white font-medium transition-all duration-300 border border-green-500/30"
                >
                  {demoLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Shield className="h-4 w-4 mr-2" />
                  )}
                  {demoLoading ? 'Starting Demo...' : 'Enter Demo Mode'}
                  <Badge variant="secondary" className="ml-2 text-[9px] h-4 px-1.5 bg-green-400/20 text-green-300 border-green-400/30">
                    FREE
                  </Badge>
                </Button>
              </motion.div>
            </TabsContent>
          </Tabs>

          {/* Footer */}
          <div className="mt-5 pt-4 border-t border-white/5">
            <p className="text-[10px] text-muted-foreground/50 text-center">
              By continuing, you agree to WhaleRadar&apos;s Terms of Service and Privacy Policy.
              This is not financial advice.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
