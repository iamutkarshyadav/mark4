import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  getCurrentUser,
  createSupabaseClientForAuthHeader,
} from "@/lib/policies";
import { validatePostContent, validateCategory } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const user = await getCurrentUser(authHeader);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { content, image_url, category } = await request.json();

    // Validate input
    if (!validatePostContent(content)) {
      return NextResponse.json(
        { error: "Content must be between 1-280 characters" },
        { status: 400 }
      );
    }

    if (!validateCategory(category)) {
      return NextResponse.json(
        { error: "Invalid category. Allowed: general, announcement, question" },
        { status: 400 }
      );
    }

    // Use a user-scoped client so RLS allows insert
    const userClient = createSupabaseClientForAuthHeader(authHeader);
    if (!userClient) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { data, error } = await userClient
      .from("posts")
      .insert([
        {
          author_id: user.id,
          content: content.trim(),
          image_url: image_url || null,
          category: category || null,
        },
      ])
      .select(
        `
        *,
        author:users(id, username, avatar_url)
      `
      )
      .single();

    if (error) {
      console.error("Post creation error:", error);
      return NextResponse.json(
        { error: "Failed to create post" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Post created successfully",
      post: data,
    });
  } catch (error) {
    console.error("Post creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
