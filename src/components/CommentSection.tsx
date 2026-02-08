'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Send } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  username: string;
  display_name: string;
  avatar_url: string;
}

export default function CommentSection({ postId, onNewComment }: { postId: string; onNewComment: () => void }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/posts/${postId}/comments`);
      const data = await res.json();
      setComments(data.comments || []);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      });
      const data = await res.json();
      if (data.comment) {
        setComments([...comments, data.comment]);
        setNewComment('');
        onNewComment();
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border-t border-gray-700/50 bg-gray-900/30">
      {/* Comments list */}
      <div className="max-h-64 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500 text-sm">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">No comments yet. Be the first!</div>
        ) : (
          <div className="divide-y divide-gray-700/30">
            {comments.map((comment) => {
              const initials = comment.display_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
              let timeAgo: string;
              try {
                timeAgo = formatDistanceToNow(new Date(comment.created_at + 'Z'), { addSuffix: true });
              } catch {
                timeAgo = 'recently';
              }

              return (
                <div key={comment.id} className="px-4 py-3 flex gap-3">
                  <Link href={`/profile/${comment.username}`}>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                      {initials}
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link href={`/profile/${comment.username}`} className="font-medium text-sm text-white hover:text-cyan-400 transition-colors">
                        {comment.display_name}
                      </Link>
                      <span className="text-gray-500 text-xs">{timeAgo}</span>
                    </div>
                    <p className="text-gray-300 text-sm mt-0.5">{comment.content}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Comment input */}
      {user ? (
        <form onSubmit={handleSubmit} className="p-3 border-t border-gray-700/50 flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1 bg-gray-800 border border-gray-600/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
          />
          <button
            type="submit"
            disabled={!newComment.trim() || submitting}
            className="p-2 bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      ) : (
        <div className="p-3 border-t border-gray-700/50 text-center text-sm text-gray-500">
          <Link href="/login" className="text-cyan-400 hover:underline">Log in</Link> to comment
        </div>
      )}
    </div>
  );
}
