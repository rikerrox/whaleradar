/**
 * API Client for WhaleRadar AI
 * Handles all backend API calls with session token management
 */

const API_BASE = '/api';

class ApiClient {
  private sessionToken: string | null = null;

  constructor() {
    // Restore session from localStorage
    if (typeof window !== 'undefined') {
      this.sessionToken = localStorage.getItem('whaleradar_session');
    }
  }

  setSessionToken(token: string | null) {
    this.sessionToken = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('whaleradar_session', token);
      } else {
        localStorage.removeItem('whaleradar_session');
      }
    }
  }

  getSessionToken(): string | null {
    return this.sessionToken;
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.sessionToken) {
      headers['Authorization'] = `Bearer ${this.sessionToken}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    // Auto-logout on 401
    if (response.status === 401) {
      this.setSessionToken(null);
    }

    return response;
  }

  private async parseResponse<T>(response: Response): Promise<{ data: T; error: string | null }> {
    const json = await response.json();
    if (!response.ok) {
      return { data: null as T, error: json.error || 'Request failed' };
    }
    return { data: json.data as T, error: null };
  }

  // ========== AUTH ==========

  async register(email: string, username: string, password: string, walletAddress?: string) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, username, password, walletAddress }),
    });
    const result = await this.parseResponse<{
      id: string; email: string; username: string; walletAddress: string | null;
      plan: string; solBalance: number; stats: Record<string, unknown>;
    } & { [key: string]: unknown }>(response);
    
    if (result.data && !result.error) {
      const fullResult = await response.json();
      this.setSessionToken(fullResult.sessionToken);
      return { ...result, sessionToken: fullResult.sessionToken };
    }
    return result;
  }

  async loginWithEmail(email: string, password: string) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const result = await this.parseResponse<{
      id: string; email: string; username: string; walletAddress: string | null;
      plan: string; solBalance: number; stats: Record<string, unknown>;
    } & { [key: string]: unknown }>(response);
    
    if (result.data && !result.error) {
      const fullResult = await response.json();
      this.setSessionToken(fullResult.sessionToken);
      return { ...result, sessionToken: fullResult.sessionToken };
    }
    return result;
  }

  async loginWithWallet(walletAddress: string) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ walletAddress }),
    });
    const result = await this.parseResponse<{
      id: string; email: string; username: string; walletAddress: string | null;
      plan: string; solBalance: number; stats: Record<string, unknown>;
    } & { [key: string]: unknown }>(response);
    
    if (result.data && !result.error) {
      const fullResult = await response.json();
      this.setSessionToken(fullResult.sessionToken);
      return { ...result, sessionToken: fullResult.sessionToken };
    }
    return result;
  }

  async logout() {
    await this.request('/auth/logout', { method: 'POST' });
    this.setSessionToken(null);
  }

  async getCurrentUser() {
    const response = await this.request('/auth/me');
    return this.parseResponse<{
      id: string; email: string; username: string; walletAddress: string | null;
      plan: string; solBalance: number; stats: Record<string, unknown>;
    }>(response);
  }

  async updateProfile(data: { username?: string; email?: string; walletAddress?: string; newPassword?: string; currentPassword?: string }) {
    const response = await this.request('/auth/update', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return this.parseResponse<Record<string, unknown>>(response);
  }

  // ========== PAYMENTS ==========

  async createCheckout(plan: string, billing: 'monthly' | 'annual' = 'monthly') {
    const response = await this.request('/payments/create-checkout', {
      method: 'POST',
      body: JSON.stringify({ plan, billing }),
    });
    return this.parseResponse<{
      checkoutId: string; paymentIntentId: string; amount: number;
      currency: string; plan: string; billing: string; checkoutUrl: string;
    }>(response);
  }

  async verifyPayment(checkoutId: string, paymentMethod: string = 'card') {
    const response = await this.request('/payments/verify', {
      method: 'POST',
      body: JSON.stringify({ checkoutId, paymentMethod }),
    });
    return this.parseResponse<{
      success: boolean; plan: string; status: string; amount: number;
    }>(response);
  }

  // ========== DEPOSITS ==========

  async createDeposit(amount: number, token: string = 'SOL', txHash?: string, method: string = 'phantom') {
    const response = await this.request('/deposits', {
      method: 'POST',
      body: JSON.stringify({ amount, token, txHash, method }),
    });
    return this.parseResponse<{
      transaction: Record<string, unknown>; newBalance: number;
    }>(response);
  }

  async getDeposits(page: number = 1, limit: number = 20, type?: string) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (type) params.set('type', type);
    const response = await this.request(`/deposits?${params}`);
    return this.parseResponse<Record<string, unknown>[]>(response);
  }

  // ========== WALLET ==========

  async getWalletBalance() {
    const response = await this.request('/wallet/balance');
    return this.parseResponse<{
      solBalance: number; walletAddress: string | null; portfolioValue: number;
      totalPnl: number; activeCopyTrades: number; plan: string;
    }>(response);
  }

  // ========== COPY TRADES ==========

  async executeCopyTrade(data: {
    whaleWalletId: string; whaleLabel: string; tokenAddress: string;
    tokenSymbol: string; tokenName?: string; type: 'buy' | 'sell';
    amount: number; copyPercent?: number; stopLoss?: number;
    takeProfit?: number; maxPosition?: number; slippage?: number;
  }) {
    const response = await this.request('/copy-trades/execute', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return this.parseResponse<{
      copyTrade: Record<string, unknown>; executionDelay: number;
      estimatedSuccess: boolean; message: string;
    }>(response);
  }

  async getCopyTrade(id: string) {
    const response = await this.request(`/copy-trades/${id}`);
    return this.parseResponse<Record<string, unknown>>(response);
  }

  async updateCopyTrade(id: string, data: { status?: string; pnl?: number; exitPrice?: number }) {
    const response = await this.request(`/copy-trades/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return this.parseResponse<Record<string, unknown>>(response);
  }

  async cancelCopyTrade(id: string) {
    const response = await this.request(`/copy-trades/${id}`, {
      method: 'DELETE',
    });
    return this.parseResponse<Record<string, unknown>>(response);
  }

  async getCopyTrades(page: number = 1, limit: number = 20, status?: string) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.set('status', status);
    const response = await this.request(`/copy-trades?${params}`);
    return this.parseResponse<Record<string, unknown>[]>(response);
  }

  // ========== TRANSACTIONS ==========

  async getTransactions(page: number = 1, limit: number = 20, type?: string, status?: string) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (type) params.set('type', type);
    if (status) params.set('status', status);
    const response = await this.request(`/transactions?${params}`);
    return this.parseResponse<Record<string, unknown>[]>(response);
  }

  // ========== USER STATS ==========

  async getUserStats() {
    const response = await this.request('/user/stats');
    return this.parseResponse<Record<string, unknown>>(response);
  }

  // ========== ALERTS ==========

  async getAlerts() {
    const response = await this.request('/alerts');
    return this.parseResponse<Record<string, unknown>[]>(response);
  }

  async markAlertRead(id: string) {
    const response = await this.request(`/alerts?id=${id}`, {
      method: 'PATCH',
    });
    return this.parseResponse<Record<string, unknown>>(response);
  }

  // ========== WHALES ==========

  async getWhales() {
    const response = await this.request('/whales');
    return this.parseResponse<Record<string, unknown>[]>(response);
  }

  // ========== TOKENS ==========

  async getTokens() {
    const response = await this.request('/tokens');
    return this.parseResponse<Record<string, unknown>[]>(response);
  }

  // ========== SUBSCRIPTIONS ==========

  async getSubscription(userId: string) {
    const response = await this.request(`/subscriptions?userId=${userId}`);
    return this.parseResponse<Record<string, unknown>>(response);
  }

  // ========== CHECK AUTH ==========

  isAuthenticated(): boolean {
    return !!this.sessionToken;
  }
}

export const apiClient = new ApiClient();
