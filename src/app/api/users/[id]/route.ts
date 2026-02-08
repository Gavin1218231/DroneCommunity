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
