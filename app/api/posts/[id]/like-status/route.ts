import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/policies";

export async function GET(
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

    const [{ data: like }, { data: post }] = await Promise.all([
      supabase
        .from("likes")
        .select("post_id")
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase.from("posts").select("like_count").eq("id", postId).single(),
    ]);

    return NextResponse.json({
      liked: Boolean(like),
      like_count: post?.like_count ?? 0,
    });
  } catch (error) {
    console.error("Like status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
