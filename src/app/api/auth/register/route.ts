export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { generateToken } from '@/lib/auth';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

// Minimum password length enforced server-side (client validation is bypassable).
const MIN_PASSWORD_LENGTH = 8;

// Throttle account creation per IP to blunt enumeration / spam registration.
const REGISTER_LIMIT = 5;
const REGISTER_WINDOW_MS = 60_000;

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const limit = rateLimit(`register:${ip}`, REGISTER_LIMIT, REGISTER_WINDOW_MS);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
      );
    }

    seedDatabase();
    const db = getDb();

    const { username, email, password, display_name } = await request.json();

    if (!username || !email || !password || !display_name) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
        { status: 400 }
      );
    }

    // Generic conflict message that does not reveal *which* field collided, so
    // an attacker can't confirm whether a given email is already registered.
    const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
    if (existing) {
      return NextResponse.json({ error: 'That username or email is not available' }, { status: 409 });
    }

    const id = uuidv4();
    const password_hash = bcrypt.hashSync(password, 10);

    db.prepare(
      'INSERT INTO users (id, username, email, password_hash, display_name) VALUES (?, ?, ?, ?, ?)'
    ).run(id, username, email, password_hash, display_name);

    const token = generateToken(id);

    const response = NextResponse.json({
      user: { id, username, email, display_name },
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
