import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  getCurrentUser,
  createSupabaseClientForAuthHeader,
} from "@/lib/policies";

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

    const { user_id } = await request.json();

    if (!user_id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Can't follow yourself
    if (user_id === user.id) {
      return NextResponse.json(
        { error: "Cannot follow yourself" },
        { status: 400 }
      );
    }

    // Check if target user exists
    const { data: targetUser } = await supabase
      .from("users")
      .select("id")
      .eq("id", user_id)
      .single();

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if already following
    const { data: existingFollow } = await supabase
      .from("follows")
      .select("*")
      .eq("follower_id", user.id)
      .eq("following_id", user_id)
      .single();

    if (existingFollow) {
      return NextResponse.json(
        { error: "Already following this user" },
        { status: 409 }
      );
    }

    // Create follow relationship using user-scoped client (RLS)
    const userClient = createSupabaseClientForAuthHeader(authHeader);
    if (!userClient) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { data, error } = await userClient
      .from("follows")
      .insert([
        {
          follower_id: user.id,
          following_id: user_id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Follow error:", error);
      return NextResponse.json(
        { error: "Failed to follow user" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Successfully followed user",
      follow: data,
    });
  } catch (error) {
    console.error("Follow error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
