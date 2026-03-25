'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import PostCard from '@/components/PostCard';
import { Search, Users, Tag, MapPin, Wrench, X } from 'lucide-react';

interface UserResult {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  drone_setup: string;
  location: string;
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

export default function ExplorePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ExploreContent />
    </Suspense>
  );
}

function ExploreContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [tab, setTab] = useState<'pilots' | 'posts'>('pilots');
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<UserResult[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const tagFilter = searchParams.get('tag');

  useEffect(() => {
    if (tagFilter) {
      setTab('posts');
      setQuery(tagFilter);
    }
  }, [tagFilter]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (tab === 'pilots') {
        searchUsers(query);
      } else {
        searchPosts(query);
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [query, tab]);

  const searchUsers = async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users${q ? `?q=${encodeURIComponent(q)}` : ''}`);
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const searchPosts = async (q: string) => {
    setLoading(true);
    try {
      const url = q ? `/api/posts?tag=${encodeURIComponent(q)}` : '/api/posts';
      const res = await fetch(url);
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearTag = () => {
    setQuery('');
    router.push('/explore');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Explore</h1>
        <p className="text-gray-400 text-sm mt-1">Discover pilots and posts in the community</p>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={tab === 'pilots' ? 'Search pilots by name, username, or drone setup...' : 'Filter posts by tag...'}
          className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
        />
        {tagFilter && (
          <button
            onClick={clearTag}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tag indicator */}
      {tagFilter && (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-sm">
            <Tag className="w-3.5 h-3.5" />
            {tagFilter}
            <button onClick={clearTag} className="ml-1 hover:text-white transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-700/50">
        <button
          onClick={() => setTab('pilots')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === 'pilots'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          Pilots
        </button>
        <button
          onClick={() => setTab('posts')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === 'posts'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Tag className="w-4 h-4" />
          Posts
        </button>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tab === 'pilots' ? (
        <div className="space-y-3">
          {users.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No pilots found</p>
            </div>
          ) : (
            users.map((u) => {
              const initials = u.display_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
              return (
                <Link
                  key={u.id}
                  href={`/profile/${u.username}`}
                  className="flex items-center gap-4 p-4 bg-gray-800/50 border border-gray-700/50 rounded-xl hover:border-gray-600/50 transition-colors group"
                >
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-semibold text-lg shadow-lg flex-shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white group-hover:text-cyan-400 transition-colors">{u.display_name}</span>
                      <span className="text-gray-500 text-sm">@{u.username}</span>
                    </div>
                    {u.bio && (
                      <p className="text-gray-400 text-sm mt-0.5 truncate">{u.bio}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-gray-500">
                      {u.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {u.location}
                        </span>
                      )}
                      {u.drone_setup && (
                        <span className="flex items-center gap-1">
                          <Wrench className="w-3 h-3" />
                          {u.drone_setup}
                        </span>
                      )}
                    </div>
                  </div>
                  {user && u.id !== user.id && (
                    <div className="text-gray-500 text-sm">View &rarr;</div>
                  )}
                </Link>
              );
            })
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Tag className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No posts found{query ? ` with tag "${query}"` : ''}</p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard key={post.id} post={post} onLikeUpdate={() => searchPosts(query)} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
