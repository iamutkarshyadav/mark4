"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

interface Props {
  user: User;
}

interface FollowData {
  id: string;
  username: string;
  email: string;
  bio?: string;
  avatar_url?: string;
  created_at: string;
}

export default function SocialFeatures({ user }: Props) {
  const [activeTab, setActiveTab] = useState<"followers" | "following">(
    "followers"
  );
  const [followers, setFollowers] = useState<FollowData[]>([]);
  const [following, setFollowing] = useState<FollowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [unfollowingId, setUnfollowingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSocialData();
  }, [user.id]);

  const fetchSocialData = async () => {
    setLoading(true);
    try {
      // Get the current session for authorization
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      // Fetch followers
      const followersResponse = await fetch(
        `/api/follows/followers/${user.id}`,
        { headers }
      );
      const followersData = await followersResponse.json();

      // Fetch following
      const followingResponse = await fetch(
        `/api/follows/following/${user.id}`,
        { headers }
      );
      const followingData = await followingResponse.json();

      if (followersResponse.ok) {
        setFollowers(followersData.followers || []);
      }

      if (followingResponse.ok) {
        setFollowing(followingData.following || []);
      }
    } catch (error) {
      console.error("Error fetching social data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async (userId: string) => {
    if (!confirm("Are you sure you want to unfollow this user?")) return;

    setUnfollowingId(userId);
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

      const response = await fetch("/api/follows/unfollow", {
        method: "DELETE",
        headers,
        body: JSON.stringify({ user_id: userId }),
      });

      if (response.ok) {
        setFollowing(following.filter((user) => user.id !== userId));
      } else {
        const data = await response.json();
        alert(`❌ ${data.error || "Failed to unfollow user"}`);
      }
    } catch (error) {
      alert("❌ Network error. Please try again.");
    } finally {
      setUnfollowingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          👥 Social Connections
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {followers.length}
            </div>
            <div className="text-sm text-blue-800">Followers</div>
            <div className="inline-flex items-center gap-1 text-[11px] text-gray-600 bg-gray-100 mt-2 px-2 py-0.5 rounded-full">
              <span>📡</span>
              <span>/api/follows/followers/{user.id}</span>
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {following.length}
            </div>
            <div className="text-sm text-green-800">Following</div>
            <div className="inline-flex items-center gap-1 text-[11px] text-gray-600 bg-gray-100 mt-2 px-2 py-0.5 rounded-full">
              <span>📡</span>
              <span>/api/follows/following/{user.id}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow">
        <div className="border-b">
          <nav className="flex">
            <button
              onClick={() => setActiveTab("followers")}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === "followers"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              👥 Followers ({followers.length})
            </button>
            <button
              onClick={() => setActiveTab("following")}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === "following"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              👤 Following ({following.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <div className="text-gray-600">Loading social connections...</div>
            </div>
          ) : (
            <div className="space-y-4">
              {activeTab === "followers" && (
                <>
                  {followers.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-6xl mb-4">👥</div>
                      <p className="text-gray-600 font-medium">
                        No followers yet
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Share interesting content to attract followers!
                      </p>
                    </div>
                  ) : (
                    followers.map((follower) => (
                      <div
                        key={follower.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {follower.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {follower.username}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {follower.email}
                            </p>
                            {follower.bio && (
                              <p className="text-sm text-gray-700 mt-1">
                                {follower.bio}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              Following since{" "}
                              {new Date(
                                follower.created_at
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">Follows you</div>
                      </div>
                    ))
                  )}
                </>
              )}

              {activeTab === "following" && (
                <>
                  {following.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-6xl mb-4">👤</div>
                      <p className="text-gray-600 font-medium">
                        Not following anyone yet
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Use the search feature to find interesting people to
                        follow!
                      </p>
                    </div>
                  ) : (
                    following.map((followedUser) => (
                      <div
                        key={followedUser.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {followedUser.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {followedUser.username}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {followedUser.email}
                            </p>
                            {followedUser.bio && (
                              <p className="text-sm text-gray-700 mt-1">
                                {followedUser.bio}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              Following since{" "}
                              {new Date(
                                followedUser.created_at
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleUnfollow(followedUser.id)}
                            disabled={unfollowingId === followedUser.id}
                            className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700 disabled:opacity-50 transition-colors"
                          >
                            {unfollowingId === followedUser.id ? (
                              <span className="flex items-center">
                                <svg
                                  className="animate-spin -ml-1 mr-1 h-3 w-3 text-white"
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
                                ...
                              </span>
                            ) : (
                              "🚫 Unfollow"
                            )}
                          </button>
                          <div className="text-xs text-gray-500 text-center">
                            API: /api/follows/unfollow
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
