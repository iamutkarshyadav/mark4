import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  getCurrentUser,
  canModifyPost,
  createSupabaseClientForAuthHeader,
} from "@/lib/policies";
import { validatePostContent, validateCategory } from "@/lib/validators";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const { id } = params;
    const { content, image_url, category, is_active } = await request.json();

    // Check if user can modify this post
    const canModify = await canModifyPost(id, user.id);
    if (!canModify) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Validate content if provided
    if (content !== undefined && !validatePostContent(content)) {
      return NextResponse.json(
        { error: "Content must be between 1-280 characters" },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: any = {};
    if (content !== undefined) updateData.content = content.trim();
    if (image_url !== undefined) updateData.image_url = image_url;
    if (category !== undefined) {
      if (!validateCategory(category)) {
        return NextResponse.json(
          {
            error: "Invalid category. Allowed: general, announcement, question",
          },
          { status: 400 }
        );
      }
      updateData.category = category;
    }
    if (is_active !== undefined) updateData.is_active = is_active;

    const userClient = createSupabaseClientForAuthHeader(authHeader);
    if (!userClient) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { data, error } = await userClient
      .from("posts")
      .update(updateData)
      .eq("id", id)
      .select(
        `
        *,
        author:users(id, username, avatar_url)
      `
      )
      .single();

    if (error) {
      console.error("Post update error:", error);
      return NextResponse.json(
        { error: "Failed to update post" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Post updated successfully",
      post: data,
    });
  } catch (error) {
    console.error("Post update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
