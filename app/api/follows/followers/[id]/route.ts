import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    // Check if user exists
    const { data: targetUser } = await supabase
      .from("users")
      .select("id")
      .eq("id", id)
      .single();

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get followers
    const { data, error, count } = await supabase
      .from("follows")
      .select(
        `
        follower_id,
        created_at,
        follower:users!follows_follower_id_fkey(
          id,
          username,
          avatar_url,
          bio
        )
      `,
        { count: "exact" }
      )
      .eq("following_id", id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Followers fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch followers" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      followers: data?.map((item) => item.follower) || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        hasMore: (count || 0) > offset + limit,
      },
    });
  } catch (error) {
    console.error("Followers fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
