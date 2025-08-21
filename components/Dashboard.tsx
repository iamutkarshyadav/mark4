"use client";

import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import PostsList from "./PostsList";
import CreatePost from "./CreatePost";
import SearchComponent from "./SearchComponent";
import ProfileSection from "./ProfileSection";
import SocialFeatures from "./SocialFeatures";
import NotificationsComponent from "./NotificationsComponent";
import AdminPanel from "./AdminPanel";
import ErrorBoundary from "./ErrorBoundary";

interface Props {
  user: User;
}

interface UserProfile {
  id: string;
  username: string;
  email: string;
  bio?: string;
  avatar_url?: string;
  role: string;
  created_at: string;
}

export default function Dashboard({ user }: Props) {
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "feed" | "search" | "profile" | "social" | "notifications" | "admin"
  >("feed");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState<{
    posts: number;
    following: number;
    followers: number;
    likesReceived: number;
    commentsReceived: number;
  }>({
    posts: 0,
    following: 0,
    followers: 0,
    likesReceived: 0,
    commentsReceived: 0,
  });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
        } else {
          setUserProfile(data);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user.id]);

  useEffect(() => {
    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        const [
          postsRes,
          followingRes,
          followersRes,
          likesAggRes,
          commentsAggRes,
        ] = await Promise.all([
          supabase
            .from("posts")
            .select("id", { count: "exact", head: true })
            .eq("author_id", user.id)
            .eq("is_active", true),
          supabase
            .from("follows")
            .select("following_id", { count: "exact", head: true })
            .eq("follower_id", user.id),
          supabase
            .from("follows")
            .select("follower_id", { count: "exact", head: true })
            .eq("following_id", user.id),
          supabase.from("posts").select("like_count").eq("author_id", user.id),
          supabase
            .from("posts")
            .select("comment_count")
            .eq("author_id", user.id),
        ]);

        setStats({
          posts: postsRes.count || 0,
          following: followingRes.count || 0,
          followers: followersRes.count || 0,
          likesReceived: (likesAggRes.data || []).reduce(
            (sum: number, row: any) => sum + (row.like_count || 0),
            0
          ),
          commentsReceived: (commentsAggRes.data || []).reduce(
            (sum: number, row: any) => sum + (row.comment_count || 0),
            0
          ),
        });
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, [user.id, refreshKey]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75 border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="text-lg font-semibold text-gray-900">
                SocialConnect
              </div>
              <div className="hidden md:flex items-center text-xs text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full">
                Backend Connected ✓
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {userProfile?.username || "Loading..."}
                </div>
                <div className="text-xs text-gray-500">
                  {userProfile?.role === "admin" ? "👑 Admin" : "👤 User"}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-sm bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="mt-3">
            <div className="inline-flex items-center gap-1 rounded-xl bg-gray-100 p-1">
              <button
                onClick={() => setActiveTab("feed")}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  activeTab === "feed"
                    ? "bg-white text-gray-900 shadow"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                title="Feed"
              >
                📰 <span className="ml-1 hidden sm:inline">Feed</span>
              </button>
              <button
                onClick={() => setActiveTab("search")}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  activeTab === "search"
                    ? "bg-white text-gray-900 shadow"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                title="Search"
              >
                🔍 <span className="ml-1 hidden sm:inline">Search</span>
              </button>
              <button
                onClick={() => setActiveTab("social")}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  activeTab === "social"
                    ? "bg-white text-gray-900 shadow"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                title="Social"
              >
                👥 <span className="ml-1 hidden sm:inline">Social</span>
              </button>
              <button
                onClick={() => setActiveTab("notifications")}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  activeTab === "notifications"
                    ? "bg-white text-gray-900 shadow"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                title="Notifications"
              >
                🔔 <span className="ml-1 hidden sm:inline">Notifications</span>
              </button>
              <button
                onClick={() => setActiveTab("profile")}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  activeTab === "profile"
                    ? "bg-white text-gray-900 shadow"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                title="Profile"
              >
                ⚙️ <span className="ml-1 hidden sm:inline">Profile</span>
              </button>
              {userProfile?.role === "admin" && (
                <button
                  onClick={() => setActiveTab("admin")}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    activeTab === "admin"
                      ? "bg-white text-gray-900 shadow"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  title="Admin"
                >
                  👑 <span className="ml-1 hidden sm:inline">Admin</span>
                </button>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === "feed" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <CreatePost
                user={user}
                onPostCreated={() => {
                  setRefreshKey((k) => k + 1);
                }}
              />
              <PostsList type="feed" user={user} refreshKey={refreshKey} />
            </div>
            <div className="space-y-6">
              <ErrorBoundary>
                <div className="bg-white rounded-xl shadow border border-gray-100 max-h-72 overflow-hidden">
                  <NotificationsComponent user={user} />
                </div>
              </ErrorBoundary>
              <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Quick Stats</h3>
                  <span className="text-xs text-gray-500">Live</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  <div className="rounded-lg bg-gray-50 p-4 text-center">
                    <div className="text-xs uppercase tracking-wide text-gray-500">
                      Posts
                    </div>
                    <div
                      className={`mt-1 text-2xl font-bold ${
                        statsLoading
                          ? "animate-pulse text-gray-400"
                          : "text-gray-900"
                      }`}
                    >
                      {statsLoading ? "—" : stats.posts}
                    </div>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-4 text-center">
                    <div className="text-xs uppercase tracking-wide text-gray-500">
                      Following
                    </div>
                    <div
                      className={`mt-1 text-2xl font-bold ${
                        statsLoading
                          ? "animate-pulse text-gray-400"
                          : "text-gray-900"
                      }`}
                    >
                      {statsLoading ? "—" : stats.following}
                    </div>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-4 text-center">
                    <div className="text-xs uppercase tracking-wide text-gray-500">
                      Followers
                    </div>
                    <div
                      className={`mt-1 text-2xl font-bold ${
                        statsLoading
                          ? "animate-pulse text-gray-400"
                          : "text-gray-900"
                      }`}
                    >
                      {statsLoading ? "—" : stats.followers}
                    </div>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-4 text-center">
                    <div className="text-xs uppercase tracking-wide text-gray-500">
                      Likes Received
                    </div>
                    <div
                      className={`mt-1 text-2xl font-bold ${
                        statsLoading
                          ? "animate-pulse text-gray-400"
                          : "text-gray-900"
                      }`}
                    >
                      {statsLoading ? "—" : stats.likesReceived}
                    </div>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-4 text-center">
                    <div className="text-xs uppercase tracking-wide text-gray-500">
                      Comments Received
                    </div>
                    <div
                      className={`mt-1 text-2xl font-bold ${
                        statsLoading
                          ? "animate-pulse text-gray-400"
                          : "text-gray-900"
                      }`}
                    >
                      {statsLoading ? "—" : stats.commentsReceived}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "search" && <SearchComponent user={user} />}

        {activeTab === "social" && <SocialFeatures user={user} />}

        {activeTab === "notifications" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <NotificationsComponent user={user} />
            </div>
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4">About Notifications</h3>
                <div className="text-sm text-gray-600 space-y-2">
                  <p>🔔 Get real-time notifications for:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>New followers</li>
                    <li>Likes on your posts</li>
                    <li>Comments on your posts</li>
                  </ul>
                  <p className="mt-3 text-xs text-gray-500">
                    Notifications update in real-time using Supabase subscriptions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "admin" && userProfile?.role === "admin" && (
          <AdminPanel user={user} />
        )}

        {activeTab === "profile" && userProfile && (
          <ProfileSection
            user={user}
            userProfile={userProfile}
            setUserProfile={setUserProfile}
          />
        )}
      </main>
    </div>
  );
}
