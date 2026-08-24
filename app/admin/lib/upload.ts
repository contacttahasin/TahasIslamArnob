"use client";

import { createClient } from "@/lib/supabase/client";
import type { MediaFolder } from "@/app/admin/lib/actions/media";
import { MEDIA_BUCKET } from "@/app/admin/lib/media-constants";

function sanitizeFilename(name: string) {
  const dot = name.lastIndexOf(".");
  const base = (dot > 0 ? name.slice(0, dot) : name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const ext = dot > 0 ? name.slice(dot) : "";
  return `${base || "file"}${ext}`;
}

/** Uploads directly from the browser to Supabase Storage (RLS-protected,
 * requires the authenticated owner session) and returns its public URL. */
export async function uploadToMedia(file: File, folder: MediaFolder) {
  const supabase = createClient();
  const path = `${folder}/${Date.now()}-${sanitizeFilename(file.name)}`;

  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw new Error(error.message);

  const {
    data: { publicUrl },
  } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);

  return { url: publicUrl, path };
}
