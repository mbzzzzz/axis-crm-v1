import { NextRequest, NextResponse } from "next/server";

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store (for production, use Redis or similar)
const rateLimitStore: RateLimitStore = {};

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  Object.keys(rateLimitStore).forEach((key) => {
    if (rateLimitStore[key].resetTime < now) {
      delete rateLimitStore[key];
    }
  });
}, 60000); // Clean every minute

export interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
  message?: string;
}

export function rateLimit(options: RateLimitOptions) {
  const { maxRequests, windowMs, message = "Too many requests. Please try again later." } = options;

  return (request: NextRequest): NextResponse | null => {
    // Get client identifier (IP address or user ID)
    const clientId = getClientId(request);
    const now = Date.now();
    const key = `${clientId}:${Math.floor(now / windowMs)}`;

    // Get or create rate limit entry
    let entry = rateLimitStore[key];
    if (!entry || entry.resetTime < now) {
      entry = {
        count: 0,
        resetTime: now + windowMs,
      };
      rateLimitStore[key] = entry;
    }

    // Increment count
    entry.count++;

    // Check if limit exceeded
    if (entry.count > maxRequests) {
      const resetTime = new Date(entry.resetTime).toISOString();
      return NextResponse.json(
        {
          error: message,
          code: "RATE_LIMIT_EXCEEDED",
          retryAfter: Math.ceil((entry.resetTime - now) / 1000),
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((entry.resetTime - now) / 1000)),
            "X-RateLimit-Limit": String(maxRequests),
            "X-RateLimit-Remaining": String(Math.max(0, maxRequests - entry.count)),
            "X-RateLimit-Reset": resetTime,
          },
        }
      );
    }

    // Add rate limit headers
    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Limit", String(maxRequests));
    response.headers.set("X-RateLimit-Remaining", String(Math.max(0, maxRequests - entry.count)));
    response.headers.set("X-RateLimit-Reset", new Date(entry.resetTime).toISOString());

    return null; // Continue with request
  };
}

function getClientId(request: NextRequest): string {
  // Try to get IP from various headers (for proxies/load balancers)
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fallback to connection IP
  return request.ip || "unknown";
}

// Pre-configured rate limiters for common use cases
export const authRateLimit = rateLimit({
  maxRequests: 5, // 5 attempts
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: "Too many login attempts. Please try again in 15 minutes.",
});

export const apiRateLimit = rateLimit({
  maxRequests: 100, // 100 requests
  windowMs: 60 * 1000, // 1 minute
  message: "API rate limit exceeded. Please slow down.",
});

