import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "JobClubb",
    short_name: "JobClubb",
    description:
      "India-first recruitment and career-membership platform: verified employers, guided applications, and membership benefits.",
    start_url: "/",
    display: "standalone",
    background_color: "#f9fcff",
    theme_color: "#00789f",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
