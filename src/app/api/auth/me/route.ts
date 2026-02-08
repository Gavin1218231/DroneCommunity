export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';
import { getCurrentUserId } from '@/lib/auth';

interface UserRow {
  id: string;
  username: string;
  email: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  drone_setup: string;
  location: string;
  created_at: string;
}

export async function GET() {
  try {
    seedDatabase();
    const db = getDb();

    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const user = db.prepare(
      'SELECT id, username, email, display_name, bio, avatar_url, drone_setup, location, created_at FROM users WHERE id = ?'
    ).get(userId) as UserRow | undefined;

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null }, { status: 500 });
  }
}

export async function PUT() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('auth_token');
  return response;
}
