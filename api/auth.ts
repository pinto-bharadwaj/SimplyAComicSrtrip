import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// Use a secure environment variable for signing JWT sessions.
// In development, fall back to a default key.
const JWT_SECRET = process.env.JWT_SECRET || 'simply-comical-default-fallback-key-2026';

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('[SECURITY WARNING] JWT_SECRET is not configured. Falling back to default session key in production.');
}

/**
 * Generate a cryptographically secure JWT-like token.
 */
export function generateToken(payload: object, expiresInMs: number = 2 * 60 * 60 * 1000): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + expiresInMs })).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

/**
 * Verify a token and return its payload, or null if invalid/expired.
 */
export function verifyToken(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');
    if (signature !== expectedSignature) return null;

    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (payload.exp && payload.exp < Date.now()) {
      return null; // Token expired
    }
    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * Generate a cryptographically secure salt.
 */
export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Hash a password using PBKDF2.
 */
export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

// Extend Request interface to include adminUser property
export interface AuthenticatedRequest extends Request {
  adminUser?: { username: string };
}

/**
 * Express Middleware to authenticate API requests via Bearer token.
 */
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Access Denied: Missing authentication token.' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Access Denied: Session token is invalid or expired.' });
  }

  req.adminUser = { username: payload.username };
  next();
}
