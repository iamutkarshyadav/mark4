import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  getCurrentUser,
  canModifyPost,
  createSupabaseClientForAuthHeader,
} from "@/lib/policies";

export async function DELETE(
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

    // Check if user can modify this post
    const canModify = await canModifyPost(id, user.id);
    if (!canModify) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const userClient = createSupabaseClientForAuthHeader(authHeader);
    if (!userClient) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { error } = await userClient.from("posts").delete().eq("id", id);

    if (error) {
      console.error("Post deletion error:", error);
      return NextResponse.json(
        { error: "Failed to delete post" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Post deletion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
