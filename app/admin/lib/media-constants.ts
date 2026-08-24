export const MEDIA_BUCKET = "portfolio-media";
export const MEDIA_FOLDERS = ["covers", "gallery", "resume", "branding"] as const;
export type MediaFolder = (typeof MEDIA_FOLDERS)[number];
