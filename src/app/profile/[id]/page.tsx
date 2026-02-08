'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import PostCard from '@/components/PostCard';
import { MapPin, Calendar, Wrench, MessageCircle, UserPlus, UserCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  drone_setup: string;
  location: string;
  created_at: string;
  post_count: number;
  follower_count: number;
  following_count: number;
  is_following: boolean;
}

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

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = params.id as string;

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch(`/api/users/${userId}`);
      const data = await res.json();
      setProfile(data.user);
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchPosts = useCallback(async () => {
    try {
      // First get user info to get their ID
      const userRes = await fetch(`/api/users/${userId}`);
      const userData = await userRes.json();
      if (userData.user) {
        const res = await fetch(`/api/posts?user_id=${userData.user.id}`);
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (err) {
      console.error('Failed to load posts:', err);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
    fetchPosts();
  }, [fetchProfile, fetchPosts]);

  const startConversation = async () => {
    if (!profile || !currentUser) return;
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ other_user_id: profile.id }),
      });
      const data = await res.json();
      if (data.conversation_id) {
        router.push('/messages');
      }
    } catch (err) {
      console.error('Failed to start conversation:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-400 text-lg">User not found</p>
      </div>
    );
  }

  const initials = profile.display_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const isOwnProfile = currentUser?.id === profile.id;

  let memberSince: string;
  try {
    memberSince = formatDistanceToNow(new Date(profile.created_at + 'Z'), { addSuffix: true });
  } catch {
    memberSince = 'recently';
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Profile header */}
      <div className="bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-2xl overflow-hidden">
        {/* Banner */}
        <div className="h-32 sm:h-40 bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 relative">
          <div className="absolute inset-0 bg-black/20" />
        </div>

        {/* Profile info */}
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 sm:-mt-10">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-bold text-2xl border-4 border-gray-800 shadow-xl">
              {initials}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">{profile.display_name}</h1>
              <p className="text-gray-400">@{profile.username}</p>
            </div>
            {currentUser && !isOwnProfile && (
              <div className="flex gap-2">
                <button
                  onClick={startConversation}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 border border-gray-600/50 text-white rounded-xl hover:bg-gray-700 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Message
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/20">
                  {profile.is_following ? (
                    <>
                      <UserCheck className="w-4 h-4" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Follow
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-gray-300 mt-4 leading-relaxed">{profile.bio}</p>
          )}

          {/* Info badges */}
          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-400">
            {profile.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-cyan-400" />
                {profile.location}
              </span>
            )}
            {profile.drone_setup && (
              <span className="flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-blue-400" />
                {profile.drone_setup}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-purple-400" />
              Joined {memberSince}
            </span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 mt-5 pt-5 border-t border-gray-700/50">
            <div className="text-center">
              <p className="text-xl font-bold text-white">{profile.post_count}</p>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Posts</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-white">{profile.follower_count}</p>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-white">{profile.following_count}</p>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Following</p>
            </div>
          </div>
        </div>
      </div>

      {/* User's posts */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-300">Posts</h2>
        {posts.length === 0 ? (
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-8 text-center text-gray-500">
            No posts yet
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))
        )}
      </div>
    </div>
  );
}
