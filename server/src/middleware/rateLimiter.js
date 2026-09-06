import rateLimit from 'express-rate-limit';

/**
 * Strict rate limiter for Authentication endpoints (Login / Signup)
 * Prevents brute force credential stuffing and account enumeration.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 auth requests per windowMs
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: {
    error: 'Too many login or registration attempts. Please try again after 15 minutes.',
  },
  skipSuccessfulRequests: false,
});

/**
 * General API rate limiter
 * Protects server resources from abuse and flooding.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests. Please slow down and try again later.',
  },
});
