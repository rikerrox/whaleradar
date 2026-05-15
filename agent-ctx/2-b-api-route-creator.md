# Task 2-b: Create API Route Files

## Agent: API Route Creator

## Task
Create 4 API route files for the WhaleRadar AI project with session-based authentication and Prisma/SQLite integration.

## Files Created

1. **`/src/app/api/copy-trades/execute/route.ts`** — POST endpoint for copy trade execution
   - Session-based auth via Bearer token
   - Validates whale wallet, token, type, and amount
   - Checks SOL balance for buy orders
   - Enforces plan limits (free: 3, pro: 20, elite: 999 active trades)
   - Validates stop-loss (≤50%) and take-profit (≤500%)
   - Creates CopyTrade record with simulated entry price
   - Deducts SOL and creates Transaction for buy orders
   - Returns pending trade with execution delay estimate

2. **`/src/app/api/copy-trades/[id]/route.ts`** — GET/PATCH/DELETE for individual copy trades
   - GET: Fetch single copy trade by ID
   - PATCH: Update status/pnl/exitPrice; handles SOL refunds on cancel and balance updates on execution
   - DELETE: Soft-cancel with SOL refund for pending buys
   - Uses Next.js 16 `params: Promise<{ id: string }>` pattern

3. **`/src/app/api/transactions/route.ts`** — GET endpoint for transaction history
   - Paginated results (default 20, max 100)
   - Filter by type and status
   - Ordered by createdAt descending

4. **`/src/app/api/user/stats/route.ts`** — GET endpoint for dashboard stats
   - Aggregates data from CopyTrade, Transaction, Alert, Watchlist, and Subscription models
   - Returns user info, portfolio stats, trading stats, financial data, notifications, and subscription
   - Calculates win rate, PnL percentages, and portfolio value

## Verification
- ESLint passes clean
- Dev server running normally on port 3000
- All 4 files created with exact specifications
