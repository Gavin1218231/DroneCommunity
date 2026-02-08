export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    seedDatabase();
    const db = getDb();

    const { username, email, password, display_name } = await request.json();

    if (!username || !email || !password || !display_name) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
    if (existing) {
      return NextResponse.json({ error: 'Username or email already taken' }, { status: 409 });
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
      secure: false,
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
