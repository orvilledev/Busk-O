import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Client router cache: reuse visited pages for 30s instead of refetching
    // on every tab switch. Server Actions (revalidatePath) still bust this
    // cache immediately, so favorites/setlist edits stay fresh.
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
};

export default nextConfig;
