import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  getCurrentUser,
  createSupabaseClientForAuthHeader,
} from "@/lib/policies";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization");
    const user = await getCurrentUser(authHeader);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id: postId } = await context.params;

    // Validate post exists and active
    const { data: post } = await supabase
      .from("posts")
      .select("id, is_active")
      .eq("id", postId)
      .eq("is_active", true)
      .single();

    if (!post) {
      return NextResponse.json(
        { error: "Post not found or inactive" },
        { status: 404 }
      );
    }

    // Check if already liked
    const { data: existing } = await supabase
      .from("likes")
      .select("post_id, user_id")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Already liked" }, { status: 409 });
    }

    const userClient = createSupabaseClientForAuthHeader(authHeader);
    if (!userClient) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { error } = await userClient
      .from("likes")
      .insert({ post_id: postId, user_id: user.id });

    if (error) {
      console.error("Like error:", error);
      return NextResponse.json(
        { error: "Failed to like post" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Post liked",
    });
  } catch (error) {
    console.error("Like error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization");
    const user = await getCurrentUser(authHeader);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id: postId } = await context.params;

    const { data: existing } = await supabase
      .from("likes")
      .select("post_id, user_id")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: "Not liked" }, { status: 404 });
    }

    const userClient = createSupabaseClientForAuthHeader(authHeader);
    if (!userClient) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { error } = await userClient
      .from("likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Unlike error:", error);
      return NextResponse.json(
        { error: "Failed to unlike post" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Post unliked",
    });
  } catch (error) {
    console.error("Unlike error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
