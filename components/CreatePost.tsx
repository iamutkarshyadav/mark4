"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

interface Props {
  user: User;
  onPostCreated?: () => void;
}

export default function CreatePost({ user, onPostCreated }: Props) {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    setMessage("");

    try {
      // Get the current session for authorization
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      // If image selected, upload first
      let image_url: string | null = null;
      if (imageFile) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const headers: Record<string, string> = {};
        if (session?.access_token)
          headers["Authorization"] = `Bearer ${session.access_token}`;
        const fd = new FormData();
        fd.append("file", imageFile);
        const uploadRes = await fetch("/api/uploads/image", {
          method: "POST",
          headers,
          body: fd as any,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          setMessage(`❌ ${uploadData.error || "Image upload failed"}`);
          setLoading(false);
          return;
        }
        image_url = uploadData.url;
      }

      const response = await fetch("/api/posts/create", {
        method: "POST",
        headers,
        body: JSON.stringify({
          content: content.trim(),
          category: category.trim() || null,
          image_url,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setContent("");
        setCategory("");
        setMessage("Post created successfully! 🎉");
        onPostCreated?.();
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(`❌ ${data.error || "Failed to create post"}`);
      }
    } catch (err) {
      setMessage("❌ Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-md border-2 border-white">
          {user.email?.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Create New Post
          </h2>
          <p className="text-sm text-gray-500">
            Share your thoughts with the community
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What's on your mind?
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts, ideas, or experiences..."
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all bg-white text-gray-900 placeholder-gray-500"
            rows={4}
            maxLength={1000}
            required
          />
          <div className="flex justify-between items-center mt-2">
            <span
              className={`text-sm ${
                content.length > 900 ? "text-red-500" : "text-gray-500"
              }`}
            >
              {content.length}/1000 characters
            </span>
            <div className="w-20 bg-gray-200 rounded-full h-1">
              <div
                className={`h-1 rounded-full transition-all ${
                  content.length > 900 ? "bg-red-500" : "bg-blue-500"
                }`}
                style={{ width: `${(content.length / 1000) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category (optional)
          </label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g., general, announcement, question"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-900 placeholder-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Image (JPEG/PNG up to 2MB)
          </label>
          <input
            type="file"
            accept="image/png,image/jpeg"
            onChange={(e) => {
              const f = e.target.files?.[0] || null;
              setImageFile(f);
            }}
            className="block w-full text-sm text-gray-600"
          />
          <div className="text-xs text-gray-500 mt-1">
            Supported formats: JPEG, PNG (max 2MB)
          </div>
        </div>

        {message && (
          <div
            className={`p-3 rounded-lg text-sm ${
              message.includes("successfully")
                ? "text-green-800 bg-green-50 border border-green-200"
                : "text-red-800 bg-red-50 border border-red-200"
            }`}
          >
            {message}
          </div>
        )}

        <div className="flex justify-end items-center pt-4 border-t">
          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
          >
            {loading ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Posting...
              </span>
            ) : (
              "📤 Post"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
