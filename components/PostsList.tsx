"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Post as DbPost } from "@/lib/types";
import type { User } from "@supabase/supabase-js";

type FeedPost = DbPost & {
  comments?: { count: number }[];
  like_count?: number;
};

interface Props {
  type: "feed" | "search";
  searchQuery?: string;
  user: User;
  refreshKey?: number;
}

export default function PostsList({
  type,
  searchQuery,
  user,
  refreshKey,
}: Props) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPosts();
  }, [type, searchQuery, refreshKey]);

  const fetchPosts = async (retryCount = 0) => {
    setLoading(true);
    setError("");

    try {
      // Get the current session for authorization
      const {
        data: { session },
      } = await supabase.auth.getSession();

      let url = "/api/posts/feed";
      if (type === "search" && searchQuery) {
        url = `/api/search/posts?query=${encodeURIComponent(searchQuery)}`;
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(url, { headers });

      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      } else {
        const data = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to fetch posts:', response.status, response.statusText);
        if (retryCount < 2) {
          setTimeout(() => fetchPosts(retryCount + 1), 1000);
          return;
        }
        setError(data.error || "Failed to fetch posts");
      }
    } catch (err) {
      console.error('Network error fetching posts:', err);
      if (retryCount < 2) {
        setTimeout(() => fetchPosts(retryCount + 1), 1000);
        return;
      }
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`/api/posts/delete/${postId}`, {
        method: "DELETE",
        headers,
      });

      if (response.ok) {
        setPosts(posts.filter((post) => post.id !== postId));
      } else {
        const data = await response.json();
        alert(`❌ ${data.error || "Failed to delete post"}`);
      }
    } catch (err) {
      alert("❌ Network error. Please try again.");
    }
  };

  const addComment = async (postId: string, text: string) => {
    if (!text.trim()) return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const response = await fetch("/api/comments/create", {
        method: "POST",
        headers,
        body: JSON.stringify({
          post_id: postId,
          text: text.trim(),
        }),
      });

      if (response.ok) {
        fetchPosts(); // Refresh posts to show new comment count
      } else {
        const data = await response.json();
        alert(`❌ ${data.error || "Failed to add comment"}`);
      }
    } catch (err) {
      alert("❌ Network error. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <div className="text-gray-600">Loading posts...</div>
        <div className="mt-3 inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
          <span>📡</span>
          <span>
            {type === "search" ? "/api/search/posts" : "/api/posts/feed"}
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-800 font-medium mb-2">❌ {error}</div>
        <button
          onClick={fetchPosts}
          className="text-red-600 hover:text-red-800 underline text-sm"
        >
          Try again
        </button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="text-6xl mb-4">📝</div>
        <div className="text-gray-600 font-medium mb-2">
          {type === "search"
            ? "No posts found for your search."
            : "No posts in your feed yet."}
        </div>
        <div className="text-sm text-gray-500">
          {type !== "search" &&
            "Create your first post or follow some users to see their content!"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow p-4">
        <div className="text-sm text-gray-600 flex items-center justify-between">
          <span className="text-gray-700">📊 Found {posts.length} posts</span>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
              <span>❤️</span>
              <span>
                {posts.reduce((a, p) => a + (p.like_count || 0), 0)} likes
              </span>
            </span>
            <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
              <span>💬</span>
              <span>
                {posts.reduce((a, p) => a + (p.comment_count || 0), 0)} comments
              </span>
            </span>
            <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
              <span>📡</span>
              <span>
                {type === "search" ? "/api/search/posts" : "/api/posts/feed"}
              </span>
            </span>
          </div>
        </div>
      </div>

      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onDelete={handleDeletePost}
          onAddComment={addComment}
          currentUser={user}
        />
      ))}
    </div>
  );
}

interface PostCardProps {
  post: FeedPost;
  onDelete: (postId: string) => void;
  onAddComment: (postId: string, text: string) => void;
  currentUser: User;
}

function PostCard({
  post,
  onDelete,
  onAddComment,
  currentUser,
}: PostCardProps) {
  const [commentText, setCommentText] = useState("");
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [liking, setLiking] = useState(false);
  const [liked, setLiked] = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState<number>(post.like_count || 0);

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddComment(post.id, commentText);
    setCommentText("");
    setShowCommentForm(false);
  };

  const fetchComments = async () => {
    if (showComments) {
      setShowComments(false);
      return;
    }

    setLoadingComments(true);
    try {
      // Get the current session for authorization
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const headers: HeadersInit = {};
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`/api/comments/post/${post.id}`, {
        headers,
      });
      const data = await response.json();
      if (response.ok) {
        setComments(data.comments || []);
        setShowComments(true);
      }
    } catch (err) {
      console.error("Failed to fetch comments:", err);
    } finally {
      setLoadingComments(false);
    }
  };

  // Fetch like status lazily
  useEffect(() => {
    const fetchLikeStatus = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const headers: HeadersInit = {};
        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }
        const res = await fetch(`/api/posts/${post.id}/like-status`, {
          headers,
        });
        if (res.ok) {
          const data = await res.json();
          setLiked(Boolean(data.liked));
          if (typeof data.like_count === "number")
            setLikeCount(data.like_count);
        }
      } catch {}
    };
    fetchLikeStatus();
  }, [post.id]);

  const toggleLike = async () => {
    setLiking(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const headers: HeadersInit = {};
      if (session?.access_token)
        headers["Authorization"] = `Bearer ${session.access_token}`;
      const method = liked ? "DELETE" : "POST";
      const res = await fetch(`/api/posts/${post.id}/like`, {
        method,
        headers,
      });
      if (res.ok) {
        setLiked(!liked);
        setLikeCount((c) => (liked ? Math.max(0, c - 1) : c + 1));
      }
    } finally {
      setLiking(false);
    }
  };

  const canDelete = Boolean(
    currentUser && post.author && currentUser.id === post.author.id
  );

  return (
    <div className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold shadow-sm">
            {(post.author?.username || "?").charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {post.author?.username || "Unknown"}
            </h3>
            <p className="text-sm text-gray-500">
              {new Date(post.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
        {canDelete && (
          <button
            onClick={() => onDelete(post.id)}
            className="text-gray-400 hover:text-red-600 rounded-full p-2 hover:bg-red-50 transition-colors"
            aria-label="Delete post"
            title="Delete"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path d="M9 3a1 1 0 0 0-1 1v1H5.5a.75.75 0 0 0 0 1.5h13a.75.75 0 0 0 0-1.5H16V4a1 1 0 0 0-1-1H9Zm1 5.25a.75.75 0 0 0-1.5 0v9a.75.75 0 0 0 1.5 0v-9Zm4.5 0a.75.75 0 0 0-1.5 0v9a.75.75 0 0 0 1.5 0v-9Z" />
              <path d="M6.5 7.5h11l-.745 11.175A2.25 2.25 0 0 1 14.513 21h-5.026a2.25 2.25 0 0 1-2.242-2.325L6.5 7.5Z" />
            </svg>
          </button>
        )}
      </div>

      <div className="mb-4">
        <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
          {post.content}
        </p>
        {post.image_url && (
          <img
            src={post.image_url}
            alt="Post image"
            className="mt-3 rounded-lg border border-gray-100 max-h-80 object-contain w-full"
            loading="lazy"
          />
        )}
        {post.category && (
          <span className="inline-block mt-3 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
            #{post.category}
          </span>
        )}
      </div>

      <div className="flex items-center gap-6 pt-4 border-t border-gray-100">
        <button
          onClick={toggleLike}
          disabled={liking}
          className={`flex items-center gap-2 text-sm ${
            liked ? "text-red-600" : "text-gray-600 hover:text-red-600"
          } transition-colors`}
        >
          {liked ? "❤️" : "🤍"} {likeCount}
        </button>
        <button
          onClick={fetchComments}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
          disabled={loadingComments}
        >
          {loadingComments ? (
            <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
          ) : (
            <span>💬</span>
          )}
          {post.comment_count ?? post.comments?.[0]?.count ?? 0} comments
        </button>
        <button
          onClick={() => setShowCommentForm(!showCommentForm)}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          ✍️ Add Comment
        </button>
      </div>

      {showCommentForm && (
        <form
          onSubmit={handleCommentSubmit}
          className="mt-4 pt-4 border-t border-gray-100"
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a thoughtful comment..."
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={500}
              required
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Post
            </button>
          </div>
          <div className="mt-2 inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            <span>📡</span>
            <span>/api/comments/create</span>
          </div>
        </form>
      )}

      {showComments && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="mb-3 inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            <span>📡</span>
            <span>/api/comments/post/{post.id}</span>
          </div>
          {comments.length === 0 ? (
            <p className="text-gray-500 text-sm">
              No comments yet. Be the first to comment!
            </p>
          ) : (
            <div className="space-y-3">
              {comments.map((comment: any) => (
                <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      {comment.author?.username}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800">{comment.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
