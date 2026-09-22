import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Company sign-up accepts a verification document of up to 5 MB,
      // plus headroom for the rest of the multipart body.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
