'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, MessageCircle, Share2, Tag, Image as ImageIcon, Video, FileText, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import CommentSection from './CommentSection';

interface Post {
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
  liked_by_me?: number;
}

export default function PostCard({ post, onLikeUpdate, onPostDeleted }: { post: Post; onLikeUpdate?: () => void; onPostDeleted?: () => void }) {
  const { user } = useAuth();
  const router = useRouter();
  const [showComments, setShowComments] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [liked, setLiked] = useState(!!post.liked_by_me);
  const [commentsCount, setCommentsCount] = useState(post.comments_count);
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isOwner = user?.id === post.user_id;

  const handleLike = async () => {
    if (!user || isLiking) return;
    setIsLiking(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/like`, { method: 'POST' });
      const data = await res.json();
      if (data.liked) {
        setLikesCount((c) => c + 1);
        setLiked(true);
      } else {
        setLikesCount((c) => Math.max(0, c - 1));
        setLiked(false);
      }
      onLikeUpdate?.();
    } catch (err) {
      console.error('Like failed:', err);
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' });
      if (res.ok) {
        onPostDeleted?.();
      }
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/profile/${post.username}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback - silently fail
    }
  };

  const getPostTypeIcon = () => {
    switch (post.post_type) {
      case 'photo': return <ImageIcon className="w-3.5 h-3.5" />;
      case 'video': return <Video className="w-3.5 h-3.5" />;
      default: return <FileText className="w-3.5 h-3.5" />;
    }
  };

  const getPostTypeLabel = () => {
    switch (post.post_type) {
      case 'photo': return 'Photo';
      case 'video': return 'Video';
      default: return 'Post';
    }
  };

  const initials = post.display_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const tags = post.tags ? post.tags.split(',').filter(Boolean) : [];

  let timeAgo: string;
  try {
    timeAgo = formatDistanceToNow(new Date(post.created_at + 'Z'), { addSuffix: true });
  } catch {
    timeAgo = 'recently';
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-xl overflow-hidden hover:border-gray-600/50 transition-colors">
      {/* Header */}
      <div className="p-4 pb-0">
        <div className="flex items-start gap-3">
          <Link href={`/profile/${post.username}`}>
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm shadow-lg">
              {initials}
            </div>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link href={`/profile/${post.username}`} className="font-semibold text-white hover:text-cyan-400 transition-colors">
                {post.display_name}
              </Link>
              <Link href={`/profile/${post.username}`} className="text-gray-500 text-sm">
                @{post.username}
              </Link>
              <span className="text-gray-600">&middot;</span>
              <span className="text-gray-500 text-sm">{timeAgo}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-700/50 text-gray-400">
                {getPostTypeIcon()}
                {getPostTypeLabel()}
              </span>
            </div>
          </div>
          {isOwner && (
            <div className="relative">
              {showDeleteConfirm ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-2 py-1 text-xs bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? 'Deleting...' : 'Confirm'}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-2 py-1 text-xs text-gray-400 hover:text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-gray-700/50 rounded-lg transition-all"
                  title="Delete post"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-3">
        <p className="text-gray-200 whitespace-pre-wrap leading-relaxed">{post.content}</p>

        {/* Media placeholder */}
        {post.media_url && (
          <div className="mt-3 rounded-lg overflow-hidden bg-gray-700/30 border border-gray-600/30">
            {post.media_type === 'video' ? (
              <video src={post.media_url} controls className="w-full max-h-96 object-cover" />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={post.media_url} alt="Post media" className="w-full max-h-96 object-cover" />
            )}
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => router.push(`/explore?tag=${encodeURIComponent(tag.trim())}`)}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors cursor-pointer"
              >
                <Tag className="w-3 h-3" />
                {tag.trim()}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-2 border-t border-gray-700/50 flex items-center gap-1">
        <button
          onClick={handleLike}
          disabled={!user}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
            liked
              ? 'text-rose-400 bg-rose-500/10 hover:bg-rose-500/20'
              : 'text-gray-400 hover:text-rose-400 hover:bg-gray-700/50'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
          <span>{likesCount}</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-cyan-400 hover:bg-gray-700/50 transition-all"
        >
          <MessageCircle className="w-4 h-4" />
          <span>{commentsCount}</span>
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-green-400 hover:bg-gray-700/50 transition-all"
        >
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <CommentSection
          postId={post.id}
          onNewComment={() => setCommentsCount((c) => c + 1)}
          onCommentDeleted={() => setCommentsCount((c) => Math.max(0, c - 1))}
        />
      )}
    </div>
  );
}
