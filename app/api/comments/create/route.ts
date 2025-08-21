import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  getCurrentUser,
  createSupabaseClientForAuthHeader,
} from "@/lib/policies";
import { validateCommentText } from "@/lib/validators";

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

    const { post_id, text } = await request.json();

    // Validate input
    if (!post_id || !text) {
      return NextResponse.json(
        { error: "Post ID and text are required" },
        { status: 400 }
      );
    }

    if (!validateCommentText(text)) {
      return NextResponse.json(
        { error: "Comment must be between 1-500 characters" },
        { status: 400 }
      );
    }

    // Check if post exists and is active
    const { data: post } = await supabase
      .from("posts")
      .select("id")
      .eq("id", post_id)
      .eq("is_active", true)
      .single();

    if (!post) {
      return NextResponse.json(
        { error: "Post not found or inactive" },
        { status: 404 }
      );
    }

    // Use user-scoped client to satisfy RLS
    const userClient = createSupabaseClientForAuthHeader(authHeader);
    if (!userClient) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { data, error } = await userClient
      .from("comments")
      .insert([
        {
          post_id,
          author_id: user.id,
          text: text.trim(),
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
      console.error("Comment creation error:", error);
      return NextResponse.json(
        { error: "Failed to create comment" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Comment created successfully",
      comment: data,
    });
  } catch (error) {
    console.error("Comment creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
