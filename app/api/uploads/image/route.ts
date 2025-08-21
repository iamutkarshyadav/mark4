import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/policies";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png"];

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const user = await getCurrentUser(authHeader || undefined);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Only JPEG/PNG allowed" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Max size is 2MB" },
        { status: 400 }
      );
    }

    const ext = file.type === "image/png" ? "png" : "jpg";
    const filename = `${crypto.randomUUID()}.${ext}`;
    const path = `${user.id}/${filename}`;

    // Ensure bucket exists
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const hasBucket = buckets?.some((b) => b.name === "post-images");
    if (!hasBucket) {
      const { error: bucketErr } = await supabaseAdmin.storage.createBucket(
        "post-images",
        {
          public: true,
          fileSizeLimit: `${MAX_FILE_SIZE}`,
        }
      );
      if (bucketErr) {
        console.error("Create bucket error:", bucketErr);
        return NextResponse.json(
          { error: "Failed to provision storage bucket" },
          { status: 500 }
        );
      }
    }

    const { error: uploadError } = await supabaseAdmin.storage
      .from("post-images")
      .upload(path, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload image" },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from("post-images")
      .getPublicUrl(path);

    const url = publicUrlData.publicUrl;

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Image upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
