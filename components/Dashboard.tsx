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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Clean Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">
                SocialConnect
              </h1>
              <div className="hidden md:flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-200">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                Online
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {userProfile?.username || "Loading..."}
                </div>
                <div className="text-xs text-gray-500">
                  {userProfile?.role === "admin" ? "Admin" : "User"}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>

          {/* Clean Navigation */}
          <nav className="mt-6">
            <div className="flex space-x-1 border-b border-gray-200">
              <button
                onClick={() => setActiveTab("feed")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "feed"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Feed
              </button>
              <button
                onClick={() => setActiveTab("search")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "search"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Search
              </button>
              <button
                onClick={() => setActiveTab("social")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "social"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Social
              </button>
              <button
                onClick={() => setActiveTab("notifications")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "notifications"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Notifications
              </button>
              <button
                onClick={() => setActiveTab("profile")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "profile"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Profile
              </button>
              {userProfile?.role === "admin" && (
                <button
                  onClick={() => setActiveTab("admin")}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "admin"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Admin
                </button>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {activeTab === "feed" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 space-y-6">
              <CreatePost
                user={user}
                onPostCreated={() => {
                  setRefreshKey((k) => k + 1);
                }}
              />
              <ErrorBoundary>
                <PostsList type="feed" user={user} refreshKey={refreshKey} />
              </ErrorBoundary>
            </div>
            <div className="space-y-6">
              <ErrorBoundary>
                <div className="bg-white rounded-lg border border-gray-200 max-h-80 overflow-hidden">
                  <NotificationsComponent user={user} />
                </div>
              </ErrorBoundary>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-gray-900">Stats</h3>
                  <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    Live
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="text-center p-4 border border-gray-100 rounded-lg">
                    <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                      Posts
                    </div>
                    <div
                      className={`text-2xl font-semibold ${
                        statsLoading
                          ? "animate-pulse text-gray-400"
                          : "text-gray-900"
                      }`}
                    >
                      {statsLoading ? "—" : stats.posts}
                    </div>
                  </div>
                  <div className="text-center p-4 border border-gray-100 rounded-lg">
                    <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                      Following
                    </div>
                    <div
                      className={`text-2xl font-semibold ${
                        statsLoading
                          ? "animate-pulse text-gray-400"
                          : "text-gray-900"
                      }`}
                    >
                      {statsLoading ? "—" : stats.following}
                    </div>
                  </div>
                  <div className="text-center p-4 border border-gray-100 rounded-lg">
                    <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                      Followers
                    </div>
                    <div
                      className={`text-2xl font-semibold ${
                        statsLoading
                          ? "animate-pulse text-gray-400"
                          : "text-gray-900"
                      }`}
                    >
                      {statsLoading ? "—" : stats.followers}
                    </div>
                  </div>
                  <div className="text-center p-4 border border-gray-100 rounded-lg">
                    <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                      Likes
                    </div>
                    <div
                      className={`text-2xl font-semibold ${
                        statsLoading
                          ? "animate-pulse text-gray-400"
                          : "text-gray-900"
                      }`}
                    >
                      {statsLoading ? "—" : stats.likesReceived}
                    </div>
                  </div>
                  <div className="text-center p-4 border border-gray-100 rounded-lg">
                    <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                      Comments
                    </div>
                    <div
                      className={`text-2xl font-semibold ${
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <NotificationsComponent user={user} />
            </div>
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">About</h3>
                <div className="text-sm text-gray-600 space-y-3">
                  <p>Real-time notifications for:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-gray-500">
                    <li>New followers</li>
                    <li>Likes on your posts</li>
                    <li>Comments on your posts</li>
                  </ul>
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
