"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import PostsList from "./PostsList";

interface Props {
  user: User;
}

export default function SearchComponent({ user }: Props) {
  const [searchType, setSearchType] = useState<"users" | "posts">("posts");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);

    try {
      const endpoint =
        searchType === "users" ? "/api/search/users" : "/api/search/posts";
      const response = await fetch(
        `${endpoint}?query=${encodeURIComponent(query.trim())}`
      );
      const data = await response.json();

      if (response.ok) {
        setResults(searchType === "users" ? data.users : data.posts);
      } else {
        console.error("Search error:", data.error);
        setResults([]);
      }
    } catch (err) {
      console.error("Search error:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const followUser = async (userId: string) => {
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

      const response = await fetch("/api/follows/follow", {
        method: "POST",
        headers,
        body: JSON.stringify({ user_id: userId }),
      });

      const data = await response.json();
      if (response.ok) {
        alert("✅ User followed successfully!");
      } else {
        alert(`❌ ${data.error || "Failed to follow user"}`);
      }
    } catch (err) {
      alert("❌ Network error. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          🔍 Search SocialConnect
        </h2>

        {/* Search Type Toggle */}
        <div className="mb-6">
          <div className="flex gap-4 mb-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                value="posts"
                checked={searchType === "posts"}
                onChange={(e) => setSearchType(e.target.value as "posts")}
                className="mr-2 text-blue-600"
              />
              <span className="text-gray-700">📰 Posts</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                value="users"
                checked={searchType === "users"}
                onChange={(e) => setSearchType(e.target.value as "users")}
                className="mr-2 text-blue-600"
              />
              <span className="text-gray-700">👥 Users</span>
            </label>
          </div>
          <div className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            <span>📡</span>
            <span>
              {searchType === "users"
                ? "/api/search/users"
                : "/api/search/posts"}
            </span>
          </div>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${
              searchType === "users"
                ? "users by username or email"
                : "posts by content or category"
            }...`}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
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
                Searching...
              </span>
            ) : (
              "🔍 Search"
            )}
          </button>
        </form>

        {/* Search Tips */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            💡 Search Tips:
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            {searchType === "users" ? (
              <>
                <li>• Search by username or email address</li>
                <li>• Results show user profiles and bio information</li>
                <li>• Click &quot;Follow&quot; to connect with other users</li>
              </>
            ) : (
              <>
                <li>• Search by post content or category</li>
                <li>• Use keywords to find relevant discussions</li>
                <li>• Results show posts with author information</li>
              </>
            )}
          </ul>
        </div>
      </div>

      {/* Search Results */}
      {hasSearched && (
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center justify-between">
            <span>Search Results ({results.length})</span>
            {query && (
              <span className="text-sm font-normal text-gray-600">
                for &quot;{query}&quot;
              </span>
            )}
          </h3>

          {searchType === "posts" ? (
            results.length > 0 ? (
              <PostsList type="search" searchQuery={query} user={user} />
            ) : (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📝</div>
                <p className="text-gray-600 font-medium">No posts found.</p>
                <p className="text-sm text-gray-500 mt-2">
                  Try different keywords or browse the feed instead.
                </p>
              </div>
            )
          ) : (
            <div className="space-y-4">
              {results.length > 0 ? (
                results.map((user: any) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {user.username}
                        </h4>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        {user.bio && (
                          <p className="text-sm text-gray-700 mt-1">
                            {user.bio}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Joined{" "}
                          {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => followUser(user.id)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
                      >
                        👤 Follow
                      </button>
                      <div className="text-xs text-gray-500 text-center">
                        API: /api/follows/follow
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">👥</div>
                  <p className="text-gray-600 font-medium">No users found.</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Try different search terms or check the spelling.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
