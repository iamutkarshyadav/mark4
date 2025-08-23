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
          setMessage(`Error: ${uploadData.error || "Image upload failed"}`);
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
        setImageFile(null);
        setMessage("Post created successfully!");
        onPostCreated?.();
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(`Error: ${data.error || "Failed to create post"}`);
      }
    } catch (err) {
      setMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
          {user.email?.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Create Post
          </h2>
          <p className="text-sm text-gray-600">
            Share your thoughts with the community
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            Content
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white text-gray-900"
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
          </div>
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            Category (optional)
          </label>
          <input
            id="category"
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g., general, announcement, question"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
          />
        </div>

        <div>
          <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
            Image (optional)
          </label>
          <input
            id="image"
            type="file"
            accept="image/png,image/jpeg"
            onChange={(e) => {
              const f = e.target.files?.[0] || null;
              setImageFile(f);
            }}
            className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
          />
          <div className="text-xs text-gray-500 mt-1">
            JPEG or PNG, max 2MB
          </div>
        </div>

        {message && (
          <div
            className={`p-3 rounded-lg text-sm ${
              message.includes("successfully")
                ? "text-green-700 bg-green-50 border border-green-200"
                : "text-red-700 bg-red-50 border border-red-200"
            }`}
          >
            {message}
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? (
              <span className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Posting...
              </span>
            ) : (
              "Post"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
