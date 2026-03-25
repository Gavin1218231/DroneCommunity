export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth';

interface UserRow {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  drone_setup: string;
  location: string;
  created_at: string;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getDb();

    const { id } = await params;
    const user = db.prepare(
      'SELECT id, username, display_name, bio, avatar_url, drone_setup, location, created_at FROM users WHERE id = ? OR username = ?'
    ).get(id, id) as UserRow | undefined;

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const postCount = db.prepare('SELECT COUNT(*) as count FROM posts WHERE user_id = ?').get(user.id) as { count: number };
    const followerCount = db.prepare('SELECT COUNT(*) as count FROM follows WHERE following_id = ?').get(user.id) as { count: number };
    const followingCount = db.prepare('SELECT COUNT(*) as count FROM follows WHERE follower_id = ?').get(user.id) as { count: number };

    const currentUserId = await getCurrentUserId();
    let isFollowing = false;
    if (currentUserId) {
      const follow = db.prepare('SELECT * FROM follows WHERE follower_id = ? AND following_id = ?').get(currentUserId, user.id);
      isFollowing = !!follow;
    }

    return NextResponse.json({
      user: {
        ...user,
        post_count: postCount.count,
        follower_count: followerCount.count,
        following_count: followingCount.count,
        is_following: isFollowing,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Follow/unfollow toggle
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getDb();

    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const targetUser = db.prepare(
      'SELECT id FROM users WHERE id = ? OR username = ?'
    ).get(id, id) as { id: string } | undefined;

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (targetUser.id === currentUserId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    const existing = db.prepare(
      'SELECT * FROM follows WHERE follower_id = ? AND following_id = ?'
    ).get(currentUserId, targetUser.id);

    if (existing) {
      db.prepare('DELETE FROM follows WHERE follower_id = ? AND following_id = ?').run(currentUserId, targetUser.id);
      return NextResponse.json({ following: false });
    } else {
      db.prepare('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)').run(currentUserId, targetUser.id);
      return NextResponse.json({ following: true });
    }
  } catch (error) {
    console.error('Follow error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update own profile
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getDb();

    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const targetUser = db.prepare(
      'SELECT id FROM users WHERE id = ? OR username = ?'
    ).get(id, id) as { id: string } | undefined;

    if (!targetUser || targetUser.id !== currentUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { display_name, bio, drone_setup, location } = await request.json();

    db.prepare(
      'UPDATE users SET display_name = ?, bio = ?, drone_setup = ?, location = ? WHERE id = ?'
    ).run(
      display_name ?? '',
      bio ?? '',
      drone_setup ?? '',
      location ?? '',
      currentUserId
    );

    const updated = db.prepare(
      'SELECT id, username, display_name, bio, avatar_url, drone_setup, location, created_at FROM users WHERE id = ?'
    ).get(currentUserId) as UserRow;

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
