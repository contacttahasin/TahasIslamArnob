import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Build er somoy TypeScript type checking error thakle-o bypass korbe
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        // Wildcarded (not the specific project ref) so this keeps working
        // if the Supabase project ever changes — every uploaded cover,
        // gallery image, logo, and OG image (app/admin/lib/upload.ts)
        // resolves to this exact path shape.
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        // The admin CMS also accepts a pasted external image URL instead
        // of an upload (ImageUploader / GalleryUploader "Add link"), and
        // those can point at any host, so the optimizer has to accept any
        // https origin. Safe here because only the single owner account
        // can ever write these values — there is no public submission path.
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;