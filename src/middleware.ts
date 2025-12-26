import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

// Simple in-memory store for rate limiting
// Note: In serverless environments (like Cloud Run), this is per-instance.
// For distributed consistency, use Redis/KV. For this implementation, per-instance is acceptable.
const ipRequestMap = new Map<string, { count: number; windowStart: number }>();

// Cleanup stale entries periodically to prevent memory leaks
setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of ipRequestMap.entries()) {
        if (now - data.windowStart > RATE_LIMIT_WINDOW_MS) {
            ipRequestMap.delete(ip);
        }
    }
}, RATE_LIMIT_WINDOW_MS * 5);

export function middleware(request: NextRequest) {
    // Only rate limit API routes
    if (!request.nextUrl.pathname.startsWith('/api')) {
        return NextResponse.next();
    }

    const ip = request.headers.get('x-forwarded-for') || 'unknown-ip';
    const now = Date.now();

    const requestData = ipRequestMap.get(ip) || { count: 0, windowStart: now };

    // Reset window if expired
    if (now - requestData.windowStart > RATE_LIMIT_WINDOW_MS) {
        requestData.count = 0;
        requestData.windowStart = now;
    }

    // Check rate limit
    if (requestData.count >= MAX_REQUESTS_PER_WINDOW) {
        return new NextResponse(
            JSON.stringify({ error: 'Too many requests. Please try again later.' }),
            { status: 429, headers: { 'content-type': 'application/json' } }
        );
    }

    // Increment and update
    requestData.count++;
    ipRequestMap.set(ip, requestData);

    const response = NextResponse.next();
    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', MAX_REQUESTS_PER_WINDOW.toString());
    response.headers.set(
        'X-RateLimit-Remaining',
        (MAX_REQUESTS_PER_WINDOW - requestData.count).toString()
    );

    return response;
}

export const config = {
    matcher: '/api/:path*',
};
