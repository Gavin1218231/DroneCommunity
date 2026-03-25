export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';

export async function GET(request: NextRequest) {
  try {
    seedDatabase();
    const db = getDb();

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    let query = `
      SELECT id, username, display_name, bio, avatar_url, drone_setup, location
      FROM users
      WHERE username != 'drone_ai'
    `;
    const params: string[] = [];

    if (q) {
      query += ' AND (username LIKE ? OR display_name LIKE ? OR bio LIKE ? OR drone_setup LIKE ?)';
      const term = `%${q}%`;
      params.push(term, term, term, term);
    }

    query += ' ORDER BY created_at DESC LIMIT 50';

    const users = db.prepare(query).all(...params);

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Search users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
