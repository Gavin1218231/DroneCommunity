import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { cookies } from 'next/headers';

/**
 * Resolve the JWT signing secret.
 *
 * Security: we must never fall back to a *known, source-committed* secret,
 * because anyone reading the repo could then forge auth tokens for any user.
 *
 * - Production: JWT_SECRET is mandatory. Fail fast if it's missing.
 * - Dev / build / test: if JWT_SECRET is unset, generate a random per-process
 *   secret. It's unknowable to an attacker (so not a vulnerability) and simply
 *   invalidates existing sessions on restart, which is fine locally.
 */
let cachedSecret: string | null = null;

function getSecret(): string {
  if (cachedSecret) return cachedSecret;

  const fromEnv = process.env.JWT_SECRET;
  if (fromEnv) {
    cachedSecret = fromEnv;
    return cachedSecret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'JWT_SECRET environment variable is required in production. ' +
      'Set it to a long, random value (e.g. `openssl rand -hex 32`).'
    );
  }

  console.warn(
    '[auth] JWT_SECRET is not set — generating a random ephemeral secret for this process. ' +
    'Sessions will not survive a restart. Set JWT_SECRET for a stable dev experience.'
  );
  cachedSecret = crypto.randomBytes(32).toString('hex');
  return cachedSecret;
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, getSecret(), { expiresIn: '7d' });
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, getSecret()) as { userId: string };
  } catch {
    return null;
  }
}

export async function getCurrentUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  return payload?.userId || null;
}
