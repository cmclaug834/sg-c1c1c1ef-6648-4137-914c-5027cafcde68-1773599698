/**
 * API Middleware
 * JWT validation, rate limiting, and security headers for API routes
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { verifyJWT } from "./auth";

// Rate limiting storage (in-memory for now, use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export interface AuthenticatedRequest extends NextApiRequest {
  user?: {
    userId: string;
    username: string;
    role: string;
  };
}

/**
 * CORS middleware - allows requests from any origin
 */
export function corsMiddleware(req: NextApiRequest, res: NextApiResponse): boolean {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400"); // 24 hours

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return true; // Handled
  }

  return false; // Not handled, continue
}

/**
 * JWT authentication middleware
 */
export function authMiddleware(
  req: AuthenticatedRequest,
  res: NextApiResponse,
  options: { required?: boolean } = {}
): boolean {
  const { required = true } = options;

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    if (required) {
      res.status(401).json({ error: "Authentication required" });
      return true; // Handled (blocked)
    }
    return false; // Not required, continue
  }

  // Support both Bearer tokens (JWT) and Basic auth (legacy)
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const decoded = verifyJWT(token);

    if (!decoded) {
      res.status(401).json({ error: "Invalid or expired token" });
      return true; // Handled (blocked)
    }

    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role,
    };

    return false; // Continue
  } else if (authHeader.startsWith("Basic ")) {
    // Legacy basic auth support (for backward compatibility)
    // In production, encourage migration to JWT
    console.warn("[API] Basic auth used - consider migrating to JWT");
    return false; // Continue (allow basic auth for now)
  }

  if (required) {
    res.status(401).json({ error: "Invalid authentication format" });
    return true; // Handled (blocked)
  }

  return false; // Continue
}

/**
 * Rate limiting middleware
 */
export function rateLimitMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  options: { maxRequests?: number; windowMs?: number } = {}
): boolean {
  const { maxRequests = 100, windowMs = 15 * 60 * 1000 } = options; // 100 req/15min default

  // Use IP address as identifier (in production, also consider user ID)
  const identifier = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
  const now = Date.now();

  let limitData = rateLimitStore.get(identifier as string);

  if (!limitData || now > limitData.resetAt) {
    // Create new window
    limitData = {
      count: 1,
      resetAt: now + windowMs,
    };
    rateLimitStore.set(identifier as string, limitData);
    return false; // Continue
  }

  limitData.count++;

  if (limitData.count > maxRequests) {
    const resetIn = Math.ceil((limitData.resetAt - now) / 1000);
    res.status(429).json({
      error: "Too many requests",
      retryAfter: resetIn,
    });
    return true; // Handled (blocked)
  }

  return false; // Continue
}

/**
 * HTTPS enforcement middleware (production only)
 */
export function httpsMiddleware(req: NextApiRequest, res: NextApiResponse): boolean {
  if (process.env.NODE_ENV === "production") {
    const proto = req.headers["x-forwarded-proto"] || "http";
    if (proto !== "https") {
      res.status(403).json({ error: "HTTPS required in production" });
      return true; // Handled (blocked)
    }
  }
  return false; // Continue
}

/**
 * Security headers middleware
 */
export function securityHeadersMiddleware(req: NextApiRequest, res: NextApiResponse): void {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
}

/**
 * Compose multiple middlewares
 */
export function withMiddleware(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void> | void,
  options: {
    auth?: boolean;
    rateLimit?: boolean;
    https?: boolean;
  } = {}
) {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    // Always add CORS
    if (corsMiddleware(req, res)) return;

    // Always add security headers
    securityHeadersMiddleware(req, res);

    // HTTPS enforcement
    if (options.https !== false) {
      if (httpsMiddleware(req, res)) return;
    }

    // Rate limiting
    if (options.rateLimit !== false) {
      if (rateLimitMiddleware(req, res)) return;
    }

    // Authentication
    if (options.auth !== false) {
      if (authMiddleware(req, res, { required: options.auth === true })) return;
    }

    // Call the actual handler
    return handler(req, res);
  };
}

/**
 * Clean up old rate limit entries (call periodically)
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
if (typeof window === "undefined") {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}