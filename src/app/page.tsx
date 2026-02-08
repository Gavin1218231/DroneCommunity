'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import PostCard from '@/components/PostCard';
import CreatePost from '@/components/CreatePost';
import { Compass, TrendingUp, Users, Zap, ArrowRight } from 'lucide-react';

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

export default function HomePage() {
  const { user, loading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/posts');
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (err) {
      console.error('Failed to load posts:', err);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">Loading DroneHub...</p>
        </div>
      </div>
    );
  }

  // Landing page for unauthenticated users
  if (!user) {
    return (
      <div>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-transparent" />
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl" />
          <div className="absolute top-40 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

          <div className="relative max-w-6xl mx-auto px-4 py-24 sm:py-32">
            <div className="text-center space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm">
                <Zap className="w-4 h-4" />
                The #1 Community for Drone Pilots
              </div>

              <h1 className="text-5xl sm:text-7xl font-bold tracking-tight">
                <span className="text-white">Fly Higher.</span>
                <br />
                <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                  Share Further.
                </span>
              </h1>

              <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                Connect with drone enthusiasts worldwide. Share your aerial photography,
                discuss builds, get FAA guidance, and push the boundaries of flight together.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/register"
                  className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl text-lg font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40"
                >
                  Join the Community
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/login"
                  className="px-8 py-4 border border-gray-700 text-gray-300 rounded-xl text-lg font-medium hover:bg-gray-800 hover:border-gray-600 transition-all"
                >
                  Sign In
                </Link>
              </div>

              <p className="text-sm text-gray-500">
                Demo accounts available — try <span className="text-gray-400">mike@example.com</span> / <span className="text-gray-400">password123</span>
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-6xl mx-auto px-4 py-20">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-800/30 backdrop-blur border border-gray-700/50 rounded-2xl p-8 hover:border-cyan-500/30 transition-colors">
              <div className="w-14 h-14 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-6">
                <Compass className="w-7 h-7 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Share Your Flights</h3>
              <p className="text-gray-400 leading-relaxed">
                Post photos, videos, and stories from your drone adventures. Tag your content and connect with pilots who share your interests.
              </p>
            </div>

            <div className="bg-gray-800/30 backdrop-blur border border-gray-700/50 rounded-2xl p-8 hover:border-blue-500/30 transition-colors">
              <div className="w-14 h-14 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Direct Messaging</h3>
              <p className="text-gray-400 leading-relaxed">
                Chat directly with other pilots. Collaborate on projects, share tips, or plan group flights with the built-in messaging system.
              </p>
            </div>

            <div className="bg-gray-800/30 backdrop-blur border border-gray-700/50 rounded-2xl p-8 hover:border-purple-500/30 transition-colors">
              <div className="w-14 h-14 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">AI Drone Assistant</h3>
              <p className="text-gray-400 leading-relaxed">
                Get instant answers about FAA regulations, camera settings, flight planning, and drone maintenance from our AI-powered SkyBot.
              </p>
            </div>
          </div>
        </section>

        {/* Preview of posts */}
        <section className="max-w-2xl mx-auto px-4 pb-20">
          <h2 className="text-2xl font-bold text-white text-center mb-8">Latest from the Community</h2>
          <div className="space-y-4">
            {posts.slice(0, 3).map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
          {posts.length > 3 && (
            <div className="text-center mt-8">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Sign up to see more
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </section>
      </div>
    );
  }

  // Authenticated feed
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <CreatePost onPostCreated={fetchPosts} />

      {loadingPosts ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Loading feed...</p>
          </div>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Compass className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg">No posts yet. Be the first to share!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onLikeUpdate={fetchPosts} />
          ))}
        </div>
      )}
    </div>
  );
}
