"use client";

import { useAuth } from "@/hooks/useAuth";
import AuthForm from "@/components/AuthForm";
import Dashboard from "@/components/Dashboard";
import { isSupabaseConfigured, logConfig } from "@/lib/config";

export default function Home() {
  const { user, loading, error: authError } = useAuth();

  // Debug: Log configuration (development only)
  if (process.env.NODE_ENV !== "production") {
    logConfig();
  }

  // Check if Supabase is properly configured
  const supabaseConfigured = isSupabaseConfigured();

  if (!supabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md bg-white rounded-lg shadow-lg p-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            SocialConnect
          </h1>
          <div className="text-gray-600 space-y-4">
            <p>Welcome to SocialConnect! To get started, you need to:</p>
            <ol className="text-left space-y-2">
              <li>1. Connect to Supabase</li>
              <li>2. Set up your database</li>
              <li>3. Configure environment variables</li>
            </ol>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Next Step:</strong> Connect to Supabase and configure
                your database to enable authentication and data storage.
              </p>
            </div>
            {/* Debug Info */}
            <div className="mt-4 p-3 bg-red-50 rounded-lg text-left">
              <p className="text-xs text-red-800 font-mono">
                <strong>Debug Info:</strong>
                <br />
                Check your browser console for configuration details
                <br />
                Environment variables may not be loading properly
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-xl text-gray-700">Loading authentication...</div>
          <div className="text-sm text-gray-500 mt-2">
            Initializing Supabase session
          </div>
        </div>
      </div>
    );
  }

  // Show auth error if there's a critical authentication issue
  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-gray-900 mb-4">
            Authentication Error
          </h1>
          <p className="text-gray-600 mb-4">{authError}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {user ? <Dashboard user={user} /> : <AuthForm />}
    </main>
  );
}
