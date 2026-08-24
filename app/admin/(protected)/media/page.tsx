import type { Metadata } from "next";
import { MediaLibrary } from "@/app/admin/components/MediaLibrary";
import { listMediaFolder, getStorageUsage, type MediaFile, type MediaFolder } from "@/app/admin/lib/actions/media";
import { MEDIA_FOLDERS } from "@/app/admin/lib/media-constants";

export const metadata: Metadata = { title: "Media Library" };

export default async function MediaPage() {
  const [usage, ...fileLists] = await Promise.all([
    getStorageUsage(),
    ...MEDIA_FOLDERS.map((folder) => listMediaFolder(folder)),
  ]);

  const filesByFolder = MEDIA_FOLDERS.reduce(
    (acc, folder, i) => {
      acc[folder] = fileLists[i];
      return acc;
    },
    {} as Record<MediaFolder, MediaFile[]>
  );

  return <MediaLibrary filesByFolder={filesByFolder} usage={usage} />;
}
