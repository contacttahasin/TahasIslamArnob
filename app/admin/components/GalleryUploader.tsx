"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { UploadCloud, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { uploadToMedia } from "@/app/admin/lib/upload";
import { deleteMediaFile } from "@/app/admin/lib/actions/media";
import { ImageLinkInput, isHttpUrl, pathFromPublicUrl } from "@/app/admin/components/ImageUploader";

export function GalleryUploader({ value, onChange }: { value: string[]; onChange: (urls: string[]) => void }) {
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
    // Gallery entries are keyed by URL below, so a duplicate would render
    // two nodes with the same React key.
    if (value.includes(url)) {
      toast.error("That image is already in the gallery");
      return;
    }
    onChange([...value, url]);
    setLinkUrl("");
  }

  async function handleFiles(files: FileList | null) {
    const list = Array.from(files ?? []);
    if (list.length === 0) return;
    setUploading(true);
    try {
      const uploaded = await Promise.all(list.map((file) => uploadToMedia(file, "gallery")));
      onChange([...value, ...uploaded.map((u) => u.url)]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove(url: string) {
    onChange(value.filter((v) => v !== url));
    const path = pathFromPublicUrl(url);
    if (path) await deleteMediaFile(path).catch(() => {});
  }

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {value.map((url) => (
            <div key={url} className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
              <Image src={url} alt="Gallery image" fill sizes="200px" className="object-cover" />
              <button
                type="button"
                onClick={() => handleRemove(url)}
                className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

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
          "flex h-28 w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed text-center transition-colors",
          dragOver ? "border-primary bg-primary/5" : "border-white/15 bg-white/[0.015] hover:border-white/25"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {uploading ? (
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        ) : (
          <>
            <UploadCloud className="size-5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Drop gallery images or click to upload</p>
          </>
        )}
      </div>

      <ImageLinkInput value={linkUrl} onValueChange={setLinkUrl} onAdd={handleAddLink} />
    </div>
  );
}
