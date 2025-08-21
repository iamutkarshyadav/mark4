"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

interface AdminStats {
  totalUsers: number;
  totalPosts: number;
  activePosts: number;
  totalComments: number;
  totalLikes: number;
  totalFollows: number;
  usersRegisteredToday: number;
  postsCreatedToday: number;
  generatedAt: string;
}

interface UserData {
  id: string;
  username: string;
  email: string;
  role: string;
  created_at: string;
  posts_count: any[];
  followers_count: any[];
  following_count: any[];
}

interface PostData {
  id: string;
  content: string;
  created_at: string;
  like_count: number;
  comment_count: number;
  is_active: boolean;
  author: {
    id: string;
    username: string;
    role: string;
  };
}

interface Props {
  user: User;
}

export default function AdminPanel({ user }: Props) {
  const [activeTab, setActiveTab] = useState<"stats" | "users" | "posts">("stats");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (activeTab === "stats") {
      fetchStats();
    } else if (activeTab === "users") {
      fetchUsers();
    } else if (activeTab === "posts") {
      fetchPosts();
    }
  }, [activeTab]);

  const getAuthToken = async () => {
    const { data: session } = await supabase.auth.getSession();
    return session.session?.access_token;
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      const response = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      const response = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      const response = await fetch('/api/admin/posts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const deactivateUser = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to deactivate user ${username}?`)) {
      return;
    }

    try {
      const token = await getAuthToken();
      const response = await fetch(`/api/admin/users/${userId}/deactivate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        alert('User deactivated successfully');
        fetchUsers(); // Refresh the list
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to deactivate user');
      }
    } catch (error) {
      console.error('Error deactivating user:', error);
      alert('Failed to deactivate user');
    }
  };

  const deletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      const token = await getAuthToken();
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        alert('Post deleted successfully');
        fetchPosts(); // Refresh the list
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-4">👑 Admin Panel</h2>
        
        {/* Admin Navigation */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("stats")}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              activeTab === "stats"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            📊 Statistics
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              activeTab === "users"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            👥 Users
          </button>
          <button
            onClick={() => setActiveTab("posts")}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              activeTab === "posts"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            📝 Posts
          </button>
        </div>

        {/* Content */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-gray-500">Loading...</p>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === "stats" && stats && !loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
              <div className="text-sm text-blue-800">Total Users</div>
              {stats.usersRegisteredToday > 0 && (
                <div className="text-xs text-blue-600">+{stats.usersRegisteredToday} today</div>
              )}
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.totalPosts}</div>
              <div className="text-sm text-green-800">Total Posts</div>
              {stats.postsCreatedToday > 0 && (
                <div className="text-xs text-green-600">+{stats.postsCreatedToday} today</div>
              )}
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{stats.activePosts}</div>
              <div className="text-sm text-yellow-800">Active Posts</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{stats.totalLikes}</div>
              <div className="text-sm text-purple-800">Total Likes</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{stats.totalComments}</div>
              <div className="text-sm text-red-800">Total Comments</div>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-indigo-600">{stats.totalFollows}</div>
              <div className="text-sm text-indigo-800">Total Follows</div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && !loading && (
          <div className="space-y-4">
            {users.map((userData) => (
              <div key={userData.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900">{userData.username}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        userData.role === 'admin' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {userData.role}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{userData.email}</p>
                    <div className="text-xs text-gray-500 mt-1">
                      {userData.posts_count.length} posts • {userData.followers_count.length} followers • {userData.following_count.length} following
                    </div>
                    <div className="text-xs text-gray-400">
                      Joined {new Date(userData.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  {userData.role !== 'admin' && userData.id !== user.id && (
                    <button
                      onClick={() => deactivateUser(userData.id, userData.username)}
                      className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                    >
                      Deactivate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Posts Tab */}
        {activeTab === "posts" && !loading && (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-gray-900">{post.author.username}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        post.author.role === 'admin' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {post.author.role}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        post.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {post.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-2">{post.content}</p>
                    <div className="text-xs text-gray-500">
                      {post.like_count} likes • {post.comment_count} comments • {new Date(post.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={() => deletePost(post.id)}
                    className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 ml-4"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
