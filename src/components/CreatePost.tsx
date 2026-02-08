'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Send, Image, Video, FileText, X } from 'lucide-react';

interface CreatePostProps {
  onPostCreated: () => void;
}

export default function CreatePost({ onPostCreated }: CreatePostProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState('general');
  const [tags, setTags] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (!user) return null;

  const initials = user.display_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          post_type: postType,
          tags,
        }),
      });
      if (res.ok) {
        setContent('');
        setTags('');
        setPostType('general');
        setExpanded(false);
        onPostCreated();
      }
    } catch (err) {
      console.error('Failed to create post:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const postTypes = [
    { value: 'general', label: 'Post', icon: FileText },
    { value: 'photo', label: 'Photo', icon: Image },
    { value: 'video', label: 'Video', icon: Video },
  ];

  return (
    <div className="bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-xl overflow-hidden">
      <form onSubmit={handleSubmit}>
        <div className="p-4">
          <div className="flex gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 shadow-lg">
              {initials}
            </div>
            <div className="flex-1">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onFocus={() => setExpanded(true)}
                placeholder="Share your latest flight, tips, or drone build..."
                rows={expanded ? 4 : 2}
                className="w-full bg-transparent text-white placeholder-gray-500 resize-none focus:outline-none text-[15px] leading-relaxed"
              />
            </div>
          </div>

          {expanded && (
            <div className="mt-3 space-y-3">
              {/* Post type selector */}
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm mr-1">Type:</span>
                {postTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setPostType(type.value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                      postType === type.value
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'bg-gray-700/30 text-gray-400 border border-transparent hover:bg-gray-700/50'
                    }`}
                  >
                    <type.icon className="w-3.5 h-3.5" />
                    {type.label}
                  </button>
                ))}
              </div>

              {/* Tags */}
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Tags (comma separated): landscape, sunset, dji"
                className="w-full bg-gray-700/30 border border-gray-600/30 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          )}
        </div>

        {/* Actions bar */}
        <div className="px-4 py-3 border-t border-gray-700/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button type="button" className="p-2 text-gray-400 hover:text-cyan-400 hover:bg-gray-700/50 rounded-lg transition-all">
              <Image className="w-5 h-5" />
            </button>
            <button type="button" className="p-2 text-gray-400 hover:text-cyan-400 hover:bg-gray-700/50 rounded-lg transition-all">
              <Video className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            {expanded && (
              <button
                type="button"
                onClick={() => { setExpanded(false); setContent(''); setTags(''); }}
                className="px-3 py-1.5 text-sm text-gray-400 hover:text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={!content.trim() || submitting}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20"
            >
              <Send className="w-4 h-4" />
              Post
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
