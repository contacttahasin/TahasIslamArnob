"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { UploadCloud, Trash2, Loader2, HardDrive, FileText } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/format";
import { uploadToMedia } from "@/app/admin/lib/upload";
import { deleteMediaFile, type MediaFile, type MediaFolder } from "@/app/admin/lib/actions/media";
import { MEDIA_FOLDERS } from "@/app/admin/lib/media-constants";

import { PageHeader } from "@/app/admin/components/PageHeader";
import { EmptyState } from "@/app/admin/components/EmptyState";
import { ConfirmDialog } from "@/app/admin/components/ConfirmDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

const FOLDER_LABELS: Record<MediaFolder, string> = {
  covers: "Covers",
  gallery: "Gallery",
  resume: "Resume",
  branding: "Branding",
};

export function MediaLibrary({
  filesByFolder,
  usage,
}: {
  filesByFolder: Record<MediaFolder, MediaFile[]>;
  usage: { folder: MediaFolder; count: number; bytes: number }[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<MediaFolder>("covers");
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MediaFile | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const totalBytes = usage.reduce((sum, u) => sum + u.bytes, 0);

  async function handleFiles(files: FileList | null) {
    const list = Array.from(files ?? []);
    if (list.length === 0) return;
    setUploading(true);
    try {
      await Promise.all(list.map((file) => uploadToMedia(file, tab)));
      toast.success(`${list.length} file${list.length === 1 ? "" : "s"} uploaded`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    startTransition(async () => {
      const result = await deleteMediaFile(target.path);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("File deleted");
      setDeleteTarget(null);
      router.refresh();
    });
  }

  return (
    <div>
      <PageHeader title="Media Library" description="Cover images, gallery photos, your resume, and brand assets." />

      <div className="mb-6 flex items-center gap-2 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-5 py-3.5">
        <HardDrive className="size-4 text-muted-foreground" />
        <span className="text-sm text-foreground">{formatBytes(totalBytes)} used</span>
        <span className="text-xs text-muted-foreground">
          · {usage.reduce((s, u) => s + u.count, 0)} files across {MEDIA_FOLDERS.length} folders
        </span>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as MediaFolder)}>
        <TabsList>
          {MEDIA_FOLDERS.map((folder) => (
            <TabsTrigger key={folder} value={folder}>
              {FOLDER_LABELS[folder]}
              <span className="ml-1.5 text-muted-foreground">({filesByFolder[folder].length})</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {MEDIA_FOLDERS.map((folder) => (
          <TabsContent key={folder} value={folder} className="mt-5">
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
                "mb-5 flex h-28 w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed text-center transition-colors",
                dragOver ? "border-primary bg-primary/5" : "border-white/15 bg-white/[0.015] hover:border-white/25"
              )}
            >
              <input
                ref={inputRef}
                type="file"
                accept={folder === "resume" ? ".pdf,.doc,.docx" : "image/*"}
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
              {uploading ? (
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <UploadCloud className="size-5 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Drop files here or click to upload to {FOLDER_LABELS[folder]}</p>
                </>
              )}
            </div>

            {filesByFolder[folder].length === 0 ? (
              <EmptyState icon={UploadCloud} title="Nothing here yet" description="Uploaded files will appear in this grid." />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {filesByFolder[folder].map((file) => (
                  <div
                    key={file.path}
                    className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]"
                  >
                    {file.name.match(/\.(png|jpe?g|webp|gif|svg)$/i) ? (
                      <Image src={file.url} alt={file.name} fill sizes="200px" className="object-cover" />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-2 p-3 text-center">
                        <FileText className="size-6 text-muted-foreground" />
                        <span className="truncate text-[10px] text-muted-foreground">{file.name}</span>
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/60 px-2 py-1 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                      <span className="truncate text-[10px] text-white">{formatBytes(file.size)}</span>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="text-white hover:text-destructive"
                        onClick={() => setDeleteTarget(file)}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete file?"
        description={`"${deleteTarget?.name}" will be permanently removed from storage.`}
        loading={pending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
