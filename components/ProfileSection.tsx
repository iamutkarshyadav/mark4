"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface UserProfile {
  id: string;
  username: string;
  email: string;
  bio?: string;
  avatar_url?: string;
  role: string;
  created_at: string;
}

interface Props {
  user: User;
  userProfile: UserProfile;
  setUserProfile: (profile: UserProfile) => void;
}

export default function ProfileSection({
  user,
  userProfile,
  setUserProfile,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    username: userProfile.username,
    bio: userProfile.bio || "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const { data, error } = await supabase
        .from("users")
        .update({
          username: editData.username.trim(),
          bio: editData.bio.trim() || null,
        })
        .eq("id", user.id)
        .select()
        .single();

      if (error) {
        setMessage(`❌ ${error.message}`);
      } else {
        setUserProfile(data);
        setIsEditing(false);
        setMessage("✅ Profile updated successfully!");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (err) {
      setMessage("❌ Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      username: userProfile.username,
      bio: userProfile.bio || "",
    });
    setIsEditing(false);
    setMessage("");
  };

  const fetchMyPosts = async () => {
    setLoadingPosts(true);
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("author_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (!error) setMyPosts(data || []);
    } finally {
      setLoadingPosts(false);
    }
  };

  // Lazy load my posts when tab is opened
  // We do not have tab state here, so always load once
  useState(() => {
    fetchMyPosts();
  });

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="rounded-xl overflow-hidden shadow">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8">
          <div className="flex items-center gap-6 text-white">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-3xl font-bold shadow-sm">
              {userProfile.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-1">
                {userProfile.username}
              </h1>
              <p className="text-blue-100">{userProfile.email}</p>
              <div className="flex items-center gap-3 text-sm mt-2">
                <span className="bg-white/20 px-3 py-1 rounded-full">
                  {userProfile.role === "admin" ? "👑 Admin" : "👤 User"}
                </span>
                <span>
                  📅 Joined{" "}
                  {new Date(userProfile.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Details */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Profile Information</h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              ✏️ Edit Profile
            </button>
          )}
        </div>

        {message && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm ${
              message.includes("successfully")
                ? "text-green-800 bg-green-50 border border-green-200"
                : "text-red-800 bg-red-50 border border-red-200"
            }`}
          >
            {message}
          </div>
        )}

        {isEditing ? (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                value={editData.username}
                onChange={(e) =>
                  setEditData((prev) => ({ ...prev, username: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                minLength={3}
                maxLength={20}
              />
              <p className="text-xs text-gray-500 mt-1">
                3-20 characters, letters, numbers, and underscores only
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <textarea
                value={editData.bio}
                onChange={(e) =>
                  setEditData((prev) => ({ ...prev, bio: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                maxLength={500}
                placeholder="Tell us about yourself..."
              />
              <p className="text-xs text-gray-500 mt-1">
                {editData.bio.length}/500 characters
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
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
                    Saving...
                  </span>
                ) : (
                  "💾 Save Changes"
                )}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                ❌ Cancel
              </button>
            </div>

            <div className="text-sm text-gray-500 pt-2 border-t">
              📡 API: Direct Supabase client update to users table
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                  {userProfile.username}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                  {userProfile.email}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                  {userProfile.role === "admin"
                    ? "👑 Administrator"
                    : "👤 User"}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Member Since
                </label>
                <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                  {new Date(userProfile.created_at).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bio
              </label>
              <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg min-h-[60px]">
                {userProfile.bio || (
                  <span className="text-gray-500 italic">
                    No bio added yet. Click "Edit Profile" to add one!
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Account Information */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Account Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="font-medium text-blue-900">User ID</div>
            <div className="text-blue-700 font-mono text-xs break-all">
              {userProfile.id}
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="font-medium text-green-900">Account Status</div>
            <div className="text-green-700">✅ Active</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="font-medium text-purple-900">Database Table</div>
            <div className="text-purple-700">public.users</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="font-medium text-yellow-900">Authentication</div>
            <div className="text-yellow-700">🔐 Supabase Auth</div>
          </div>
        </div>
      </div>

      {/* My Recent Posts */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">My Recent Posts</h3>
          <button
            onClick={fetchMyPosts}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Refresh
          </button>
        </div>
        {loadingPosts ? (
          <div className="text-gray-500">Loading...</div>
        ) : myPosts.length === 0 ? (
          <div className="text-gray-500">
            You have not created any posts yet.
          </div>
        ) : (
          <ul className="divide-y">
            {myPosts.map((p) => (
              <li key={p.id} className="py-3 flex justify-between items-center">
                <div>
                  <div className="text-gray-900">
                    {p.content?.slice(0, 80) || "(no content)"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(p.created_at).toLocaleString()} •{" "}
                    {p.like_count || 0} likes • {p.comment_count || 0} comments
                  </div>
                </div>
                {p.category && (
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                    #{p.category}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
