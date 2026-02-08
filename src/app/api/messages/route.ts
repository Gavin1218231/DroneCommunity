export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

interface ConversationRow {
  id: string;
  created_at: string;
  other_user_id: string;
  other_username: string;
  other_display_name: string;
  other_avatar_url: string;
  last_message: string;
  last_message_at: string;
}

export async function GET() {
  try {
    const db = getDb();

    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversations = db.prepare(`
      SELECT c.id, c.created_at,
        u.id as other_user_id, u.username as other_username,
        u.display_name as other_display_name, u.avatar_url as other_avatar_url,
        (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_at
      FROM conversations c
      JOIN conversation_participants cp1 ON c.id = cp1.conversation_id AND cp1.user_id = ?
      JOIN conversation_participants cp2 ON c.id = cp2.conversation_id AND cp2.user_id != ?
      JOIN users u ON cp2.user_id = u.id
      ORDER BY last_message_at DESC
    `).all(userId, userId) as ConversationRow[];

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();

    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { other_user_id } = await request.json();

    if (!other_user_id) {
      return NextResponse.json({ error: 'other_user_id is required' }, { status: 400 });
    }

    // Check for existing conversation
    const existing = db.prepare(`
      SELECT c.id FROM conversations c
      JOIN conversation_participants cp1 ON c.id = cp1.conversation_id AND cp1.user_id = ?
      JOIN conversation_participants cp2 ON c.id = cp2.conversation_id AND cp2.user_id = ?
    `).get(userId, other_user_id) as { id: string } | undefined;

    if (existing) {
      return NextResponse.json({ conversation_id: existing.id });
    }

    const convId = uuidv4();
    db.prepare('INSERT INTO conversations (id) VALUES (?)').run(convId);
    db.prepare('INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)').run(convId, userId);
    db.prepare('INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)').run(convId, other_user_id);

    return NextResponse.json({ conversation_id: convId }, { status: 201 });
  } catch (error) {
    console.error('Create conversation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
