import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/posts?author_id=&page=&limit=
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;
    const authorId = searchParams.get("author_id");

    let query = supabase
      .from("posts")
      .select(
        `
        *,
        author:users(id, username, avatar_url)
      `,
        { count: "exact" }
      )
      .eq("is_active", true);

    if (authorId) {
      query = query.eq("author_id", authorId);
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Posts list error:", error);
      return NextResponse.json(
        { error: "Failed to fetch posts" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      posts: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        hasMore: (count || 0) > offset + limit,
      },
    });
  } catch (error) {
    console.error("Posts list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

