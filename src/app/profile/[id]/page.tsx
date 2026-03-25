'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import PostCard from '@/components/PostCard';
import { MapPin, Calendar, Wrench, MessageCircle, UserPlus, UserCheck, Pencil, X, Save } from 'lucide-react';
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
  const { user: currentUser, refreshUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    display_name: '',
    bio: '',
    drone_setup: '',
    location: '',
  });
  const [saving, setSaving] = useState(false);

  const userId = params.id as string;

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch(`/api/users/${userId}`);
      const data = await res.json();
      setProfile(data.user);
      if (data.user) {
        setEditForm({
          display_name: data.user.display_name,
          bio: data.user.bio || '',
          drone_setup: data.user.drone_setup || '',
          location: data.user.location || '',
        });
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchPosts = useCallback(async () => {
    try {
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

  const handleFollow = async () => {
    if (!profile || !currentUser || followLoading) return;
    setFollowLoading(true);
    try {
      const res = await fetch(`/api/users/${profile.id}`, { method: 'POST' });
      const data = await res.json();
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              is_following: data.following,
              follower_count: prev.follower_count + (data.following ? 1 : -1),
            }
          : prev
      );
    } catch (err) {
      console.error('Follow failed:', err);
    } finally {
      setFollowLoading(false);
    }
  };

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

  const handleSaveProfile = async () => {
    if (!profile || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${profile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.user) {
        setProfile((prev) => (prev ? { ...prev, ...data.user } : prev));
        setEditing(false);
        refreshUser();
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const handlePostDeleted = () => {
    fetchPosts();
    fetchProfile();
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
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all shadow-lg disabled:opacity-50 ${
                    profile.is_following
                      ? 'bg-gray-700/50 border border-gray-600/50 text-white hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-400'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 shadow-cyan-500/20'
                  }`}
                >
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
            {isOwnProfile && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 border border-gray-600/50 text-white rounded-xl hover:bg-gray-700 transition-colors"
              >
                <Pencil className="w-4 h-4" />
                Edit Profile
              </button>
            )}
          </div>

          {/* Edit form */}
          {editing && isOwnProfile ? (
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Display Name</label>
                <input
                  type="text"
                  value={editForm.display_name}
                  onChange={(e) => setEditForm((f) => ({ ...f, display_name: e.target.value }))}
                  className="w-full bg-gray-900/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Bio</label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))}
                  rows={3}
                  className="w-full bg-gray-900/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Drone Setup</label>
                <input
                  type="text"
                  value={editForm.drone_setup}
                  onChange={(e) => setEditForm((f) => ({ ...f, drone_setup: e.target.value }))}
                  className="w-full bg-gray-900/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Location</label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))}
                  className="w-full bg-gray-900/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setEditing(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 hover:text-white rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving || !editForm.display_name.trim()}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <>
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
            </>
          )}

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
            <PostCard key={post.id} post={post} onPostDeleted={handlePostDeleted} />
          ))
        )}
      </div>
    </div>
  );
}
