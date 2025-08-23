"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { safeFetch } from "@/lib/fetch-utils";
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

  const fetchPosts = async () => {
    setLoading(true);
    setError("");

    try {
      let url = "/api/posts/feed";
      if (type === "search" && searchQuery) {
        url = `/api/search/posts?query=${encodeURIComponent(searchQuery)}`;
      }

      const { data, error } = await safeFetch(url);

      if (error) {
        console.error('Failed to fetch posts:', error);
        setError(error);
      } else {
        setPosts(data.posts || []);
      }
    } catch (err) {
      console.error('Unexpected error fetching posts:', err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const { error } = await safeFetch(`/api/posts/delete/${postId}`, {
        method: "DELETE"
      });

      if (!error) {
        setPosts(posts.filter((post) => post.id !== postId));
      } else {
        alert(`Error: ${error}`);
      }
    } catch (err) {
      console.error('Error deleting post:', err);
      alert("Network error. Please try again.");
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
        alert(`Error: ${data.error || "Failed to add comment"}`);
      }
    } catch (err) {
      alert("Network error. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <div className="text-gray-600">Loading posts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-700 font-medium mb-2">Error: {error}</div>
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
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="text-4xl mb-4">📝</div>
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
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="text-sm text-gray-600 flex items-center justify-between">
          <span>Found {posts.length} posts</span>
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span>{posts.reduce((a, p) => a + (p.like_count || 0), 0)} likes</span>
            <span>{posts.reduce((a, p) => a + (p.comment_count || 0), 0)} comments</span>
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
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
            {(post.author?.username || "?").charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-medium text-gray-900">
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
            className="text-gray-400 hover:text-red-600 p-1"
            aria-label="Delete post"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-4 w-4"
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
            className="mt-3 rounded-lg border border-gray-200 max-h-80 object-contain w-full"
            loading="lazy"
          />
        )}
        {post.category && (
          <span className="inline-block mt-3 px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
            {post.category}
          </span>
        )}
      </div>

      <div className="flex items-center space-x-6 pt-4 border-t border-gray-100">
        <button
          onClick={toggleLike}
          disabled={liking}
          className={`flex items-center space-x-1 text-sm ${
            liked ? "text-red-600" : "text-gray-600 hover:text-red-600"
          } transition-colors`}
        >
          <span>{liked ? "♥" : "♡"}</span>
          <span>{likeCount}</span>
        </button>
        <button
          onClick={fetchComments}
          className="flex items-center space-x-1 text-sm text-gray-600 hover:text-blue-600 transition-colors"
          disabled={loadingComments}
        >
          {loadingComments ? (
            <div className="w-4 h-4 border border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          ) : (
            <span>💬</span>
          )}
          <span>{post.comment_count ?? post.comments?.[0]?.count ?? 0}</span>
        </button>
        <button
          onClick={() => setShowCommentForm(!showCommentForm)}
          className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          Reply
        </button>
      </div>

      {showCommentForm && (
        <form
          onSubmit={handleCommentSubmit}
          className="mt-4 pt-4 border-t border-gray-100"
        >
          <div className="flex space-x-3">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
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
        </form>
      )}

      {showComments && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          {comments.length === 0 ? (
            <p className="text-gray-500 text-sm">
              No comments yet. Be the first to comment!
            </p>
          ) : (
            <div className="space-y-3">
              {comments.map((comment: any) => (
                <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-1">
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
