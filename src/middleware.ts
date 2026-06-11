import { NextRequest, NextResponse } from 'next/server';

// Lightweight middleware - only handles API rate limiting and CORS
// Page routes pass through without any modification

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only process API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // CORS preflight for API routes
  if (request.method === 'OPTIONS') {
    const origin = request.headers.get('origin') || '';
    const response = new NextResponse(null, { status: 204 });

    const isAllowed =
      origin.includes('localhost') ||
      origin.includes('.space-z.ai') ||
      origin.includes('127.0.0.1') ||
      origin.includes('80.225.227.86');

    if (isAllowed) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set('Access-Control-Max-Age', '86400');
    }
    return response;
  }

  // Rate limit auth endpoints (simple counter per IP)
  const isAuthEndpoint = pathname.startsWith('/api/auth/login') || pathname.startsWith('/api/auth/register');

  if (isAuthEndpoint) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    // Simple in-memory rate limit: 10 requests per minute per IP for auth
    const rateLimitKey = `rl:${ip}:${pathname}`;
    const now = Date.now();
    const windowMs = 60_000;
    const limit = 10;

    // Use globalThis to persist across middleware invocations
    const globalMap = (globalThis as Record<string, unknown>).__rateLimitMap as Map<string, { count: number; resetAt: number }> | undefined;
    const rateMap = globalMap || new Map<string, { count: number; resetAt: number }>();
    if (!globalMap) {
      (globalThis as Record<string, unknown>).__rateLimitMap = rateMap;
    }

    const entry = rateMap.get(rateLimitKey);
    if (!entry || now > entry.resetAt) {
      rateMap.set(rateLimitKey, { count: 1, resetAt: now + windowMs });
    } else if (entry.count >= limit) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests. Try again later.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil((entry.resetAt - now) / 1000)),
          },
        }
      );
    } else {
      entry.count++;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
