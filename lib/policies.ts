import { createClient } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export async function getCurrentUser(authHeader?: string) {
  if (!authHeader) return null;

  try {
    // Extract the token from the Authorization header
    const token = authHeader.replace("Bearer ", "");

    // Create a new supabase client instance with the access token
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // Get the user info using the authenticated client
    const {
      data: { user },
      error,
    } = await supabaseClient.auth.getUser();

    if (error || !user) {
      console.error("Token verification error:", error);
      return null;
    }

    return user;
  } catch (error) {
    console.error("getCurrentUser error:", error);
    return null;
  }
}

export function createSupabaseClientForAuthHeader(authHeader?: string) {
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "");
  try {
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );
    return client;
  } catch (err) {
    console.error("createSupabaseClientForAuthHeader error:", err);
    return null;
  }
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) return null;
  return data;
}

export async function canModifyPost(
  postId: string,
  userId: string
): Promise<boolean> {
  const userProfile = await getUserProfile(userId);
  if (!userProfile) return false;

  if (userProfile.role === "admin") return true;

  const { data: post } = await supabase
    .from("posts")
    .select("author_id")
    .eq("id", postId)
    .single();

  return post?.author_id === userId;
}

export async function canModifyComment(
  commentId: string,
  userId: string
): Promise<boolean> {
  const userProfile = await getUserProfile(userId);
  if (!userProfile) return false;

  if (userProfile.role === "admin") return true;

  const { data: comment } = await supabase
    .from("comments")
    .select("author_id")
    .eq("id", commentId)
    .single();

  return comment?.author_id === userId;
}
