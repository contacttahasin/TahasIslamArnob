"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { UploadCloud, X, Loader2, Link2 } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { uploadToMedia } from "@/app/admin/lib/upload";
import type { MediaFolder } from "@/app/admin/lib/actions/media";
import { deleteMediaFile } from "@/app/admin/lib/actions/media";

/** Single-image drop zone (cover, logo, favicon, OG image, …). Uploads
 * immediately on drop/select and reports back just the public URL — the
 * surrounding form treats it like any other text field. An external image
 * URL can be pasted instead of uploading; both paths produce the same
 * plain-string value, and only Supabase-hosted ones are deleted from
 * storage on remove (pathFromPublicUrl returns null for anything else). */
export function ImageUploader({
  folder,
  value,
  onChange,
  label,
  aspect = "aspect-video",
}: {
  folder: MediaFolder;
  value: string;
  onChange: (url: string) => void;
  label?: string;
  aspect?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleAddLink() {
    const url = linkUrl.trim();
    if (!url) return;
    if (!isHttpUrl(url)) {
      toast.error("Enter a valid image URL (https://...)");
      return;
    }
    onChange(url);
    setLinkUrl("");
  }

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadToMedia(file, folder);
      onChange(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    const path = pathFromPublicUrl(value);
    onChange("");
    if (path) await deleteMediaFile(path).catch(() => {});
  }

  if (value) {
    return (
      <div className={cn("group relative w-full overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]", aspect)}>
        <Image src={value} alt={label ?? "Uploaded image"} fill sizes="400px" className="object-cover" />
        <button
          type="button"
          onClick={handleRemove}
          className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100"
        >
          <X className="size-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-center transition-colors",
          aspect,
          dragOver ? "border-primary bg-primary/5" : "border-white/15 bg-white/[0.015] hover:border-white/25"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {uploading ? (
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        ) : (
          <>
            <UploadCloud className="size-5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Drop {label?.toLowerCase() ?? "an image"} or click to upload</p>
          </>
        )}
      </div>

      <ImageLinkInput value={linkUrl} onValueChange={setLinkUrl} onAdd={handleAddLink} />
    </div>
  );
}

/** Shared "paste an image URL instead of uploading" row. */
export function ImageLinkInput({
  value,
  onValueChange,
  onAdd,
  placeholder = "https://example.com/image.jpg",
}: {
  value: string;
  onValueChange: (v: string) => void;
  onAdd: () => void;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Link2 className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="url"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          onKeyDown={(e) => {
            // The uploader lives inside a <form>; Enter here must add the
            // link, not submit the whole project form.
            if (e.key === "Enter") {
              e.preventDefault();
              onAdd();
            }
          }}
          placeholder={placeholder}
          className="h-9 w-full rounded-lg border border-white/10 bg-white/[0.02] pl-8 pr-3 text-xs text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-white/25"
        />
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="h-9 shrink-0 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs font-medium text-foreground transition-colors hover:border-white/25 hover:bg-white/[0.07]"
      >
        Add link
      </button>
    </div>
  );
}

export function isHttpUrl(url: string): boolean {
  try {
    const { protocol } = new URL(url);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

export function pathFromPublicUrl(url: string): string | null {
  const marker = "/portfolio-media/";
  const idx = url.indexOf(marker);
  return idx === -1 ? null : url.slice(idx + marker.length);
}
