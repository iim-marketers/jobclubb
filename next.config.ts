import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "jobclubb.com" }],
        destination: "https://www.jobclubb.com/:path*",
        permanent: true,
      },
      {
        source: "/dashboard",
        destination: "/candidate/dashboard",
        permanent: false,
      },
      {
        source: "/dashboard/:path*",
        destination: "/candidate/dashboard/:path*",
        permanent: false,
      },
      {
        source: "/company",
        destination: "/company/dashboard",
        permanent: false,
      },
    ];
  },
  experimental: {
    serverActions: {
      // Company sign-up accepts a verification document of up to 5 MB,
      // plus headroom for the rest of the multipart body.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
