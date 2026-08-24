"use server";

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/app/admin/lib/auth";
import type { ActionResult } from "@/app/admin/lib/actions/projects";
import { MEDIA_BUCKET, MEDIA_FOLDERS, type MediaFolder } from "@/app/admin/lib/media-constants";

export type { MediaFolder } from "@/app/admin/lib/media-constants";

export type MediaFile = {
  name: string;
  path: string;
  url: string;
  size: number;
  updatedAt: string | null;
};

export async function listMediaFolder(folder: MediaFolder): Promise<MediaFile[]> {
  const { supabase } = await requireOwner();
  const { data, error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .list(folder, { sortBy: { column: "updated_at", order: "desc" } });

  if (error || !data) return [];

  return data
    .filter((item) => item.id !== null) // folders show up as entries with id === null
    .map((item) => {
      const path = `${folder}/${item.name}`;
      const {
        data: { publicUrl },
      } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
      return {
        name: item.name,
        path,
        url: publicUrl,
        size: item.metadata?.size ?? 0,
        updatedAt: item.updated_at,
      };
    });
}

export async function getStorageUsage(): Promise<{ folder: MediaFolder; count: number; bytes: number }[]> {
  const results = await Promise.all(
    MEDIA_FOLDERS.map(async (folder) => {
      const files = await listMediaFolder(folder);
      return { folder, count: files.length, bytes: files.reduce((sum, f) => sum + f.size, 0) };
    })
  );
  return results;
}

export async function deleteMediaFile(path: string): Promise<ActionResult> {
  const { supabase } = await requireOwner();
  const { error } = await supabase.storage.from(MEDIA_BUCKET).remove([path]);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/media");
  return { ok: true };
}
