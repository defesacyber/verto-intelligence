/**
 * Rate Limiting Middleware for Supabase Edge Functions
 * Protects against brute force attacks and DDoS
 */

interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
    keyPrefix?: string;
}

interface RateLimitStore {
    [key: string]: {
        count: number;
        resetTime: number;
    };
}

// In-memory store (use Redis in production for distributed systems)
const store: RateLimitStore = {};

/**
 * Clean up expired entries periodically
 */
function cleanupExpiredEntries() {
    const now = Date.now();
    Object.keys(store).forEach(key => {
        if (store[key].resetTime < now) {
            delete store[key];
        }
    });
}

// Cleanup every 5 minutes
setInterval(cleanupExpiredEntries, 5 * 60 * 1000);

/**
 * Rate limit middleware
 * @param identifier - Unique identifier (user ID, IP, etc.)
 * @param config - Rate limit configuration
 * @returns Object with allowed status and retry info
 */
export async function rateLimit(
    identifier: string,
    config: RateLimitConfig = { maxRequests: 100, windowMs: 60000 }
): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
}> {
    const { maxRequests, windowMs, keyPrefix = 'rl' } = config;
    const key = `${keyPrefix}:${identifier}`;
    const now = Date.now();

    // Initialize or get existing entry
    if (!store[key] || store[key].resetTime < now) {
        store[key] = {
            count: 0,
            resetTime: now + windowMs,
        };
    }

    // Increment counter
    store[key].count++;

    const remaining = Math.max(0, maxRequests - store[key].count);
    const allowed = store[key].count <= maxRequests;

    return {
        allowed,
        remaining,
        resetTime: store[key].resetTime,
        retryAfter: allowed ? undefined : Math.ceil((store[key].resetTime - now) / 1000),
    };
}

/**
 * Rate limit by IP address
 */
export async function rateLimitByIP(
    request: Request,
    config?: RateLimitConfig
): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
}> {
    const ip = request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown';

    return rateLimit(ip, config);
}

/**
 * Rate limit by user ID
 */
export async function rateLimitByUser(
    userId: string,
    config?: RateLimitConfig
): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
}> {
    return rateLimit(userId, { ...config, keyPrefix: 'user' });
}

/**
 * Create rate limit response
 */
export function createRateLimitResponse(retryAfter: number): Response {
    return new Response(
        JSON.stringify({
            error: 'Too Many Requests',
            message: 'Rate limit exceeded. Please try again later.',
            retryAfter,
        }),
        {
            status: 429,
            headers: {
                'Content-Type': 'application/json',
                'Retry-After': retryAfter.toString(),
                'X-RateLimit-Limit': '100',
                'X-RateLimit-Remaining': '0',
            },
        }
    );
}

/**
 * Preset configurations for different endpoints
 */
export const RateLimitPresets = {
    // Strict limit for authentication endpoints
    auth: { maxRequests: 5, windowMs: 60000 }, // 5 requests per minute

    // Standard limit for API endpoints
    api: { maxRequests: 100, windowMs: 60000 }, // 100 requests per minute

    // Relaxed limit for public data
    public: { maxRequests: 300, windowMs: 60000 }, // 300 requests per minute

    // Very strict for sensitive operations
    sensitive: { maxRequests: 3, windowMs: 60000 }, // 3 requests per minute
};
