export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';
import { getCurrentUserId } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

interface PostRow {
  id: string;
  user_id: string;
  content: string;
  media_url: string;
  media_type: string;
  post_type: string;
  tags: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  username: string;
  display_name: string;
  avatar_url: string;
}

export async function GET(request: NextRequest) {
  try {
    seedDatabase();
    const db = getDb();

    const { searchParams } = new URL(request.url);
    const tag = searchParams.get('tag');
    const userId = searchParams.get('user_id');
    const currentUserId = await getCurrentUserId();

    let query = `
      SELECT p.*, u.username, u.display_name, u.avatar_url,
      CASE WHEN l.id IS NOT NULL THEN 1 ELSE 0 END as liked_by_me
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN likes l ON l.post_id = p.id AND l.user_id = ?
    `;
    const params: (string | null)[] = [currentUserId];

    if (tag) {
      query += ' WHERE p.tags LIKE ?';
      params.push(`%${tag}%`);
    } else if (userId) {
      query += ' WHERE p.user_id = ?';
      params.push(userId);
    }

    query += ' ORDER BY p.created_at DESC';

    const posts = db.prepare(query).all(...params) as (PostRow & { liked_by_me: number })[];

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Get posts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    seedDatabase();
    const db = getDb();

    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, media_url, media_type, post_type, tags } = await request.json();

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Only allow http(s) media URLs. This blocks javascript:, data:, and other
    // schemes from being persisted and later rendered into <img>/<video src>.
    if (media_url) {
      let parsed: URL;
      try {
        parsed = new URL(media_url);
      } catch {
        return NextResponse.json({ error: 'Invalid media URL' }, { status: 400 });
      }
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return NextResponse.json({ error: 'Media URL must use http or https' }, { status: 400 });
      }
    }

    const id = uuidv4();
    db.prepare(
      'INSERT INTO posts (id, user_id, content, media_url, media_type, post_type, tags) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(id, userId, content, media_url || '', media_type || '', post_type || 'general', tags || '');

    const post = db.prepare(`
      SELECT p.*, u.username, u.display_name, u.avatar_url
      FROM posts p JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `).get(id);

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error('Create post error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
