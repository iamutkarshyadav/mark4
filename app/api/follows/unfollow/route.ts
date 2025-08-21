import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  getCurrentUser,
  createSupabaseClientForAuthHeader,
} from "@/lib/policies";

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const user = await getCurrentUser(authHeader);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { user_id } = await request.json();

    if (!user_id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if currently following
    const { data: existingFollow } = await supabase
      .from("follows")
      .select("*")
      .eq("follower_id", user.id)
      .eq("following_id", user_id)
      .single();

    if (!existingFollow) {
      return NextResponse.json(
        { error: "Not following this user" },
        { status: 404 }
      );
    }

    // Remove follow relationship using user-scoped client (RLS)
    const userClient = createSupabaseClientForAuthHeader(authHeader);
    if (!userClient) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { error } = await userClient
      .from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", user_id);

    if (error) {
      console.error("Unfollow error:", error);
      return NextResponse.json(
        { error: "Failed to unfollow user" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Successfully unfollowed user",
    });
  } catch (error) {
    console.error("Unfollow error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
