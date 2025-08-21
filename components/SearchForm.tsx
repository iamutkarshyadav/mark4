"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import PostsList from "./PostsList";
import type { User } from "@supabase/supabase-js";

export default function SearchForm({ user }: { user: User }) {
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

      const headers: HeadersInit = {
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
        alert("User followed successfully!");
      } else {
        alert(data.error || "Failed to follow user");
      }
    } catch (err) {
      alert("Network error. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Search</h2>

        <div className="mb-4">
          <div className="flex gap-4 mb-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="posts"
                checked={searchType === "posts"}
                onChange={(e) => setSearchType(e.target.value as "posts")}
                className="mr-2"
              />
              Posts
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="users"
                checked={searchType === "users"}
                onChange={(e) => setSearchType(e.target.value as "users")}
                className="mr-2"
              />
              Users
            </label>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${searchType}...`}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>
      </div>

      {hasSearched && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">
            Search Results ({results.length})
          </h3>

          {searchType === "posts" ? (
            results.length > 0 ? (
              <PostsList type="search" searchQuery={query} user={user} />
            ) : (
              <p className="text-gray-500">No posts found.</p>
            )
          ) : (
            <div className="space-y-4">
              {results.length > 0 ? (
                results.map((user: any) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-semibold">{user.username}</h4>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        {user.bio && (
                          <p className="text-sm text-gray-600 mt-1">
                            {user.bio}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => followUser(user.id)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      Follow
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No users found.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
