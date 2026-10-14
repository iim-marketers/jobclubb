import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "JobClubb — Find your dream job";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const logo = `data:image/png;base64,${await readFile(
  join(process.cwd(), "public/brand/jobclubb-logo.png"),
  "base64",
)}`;

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "0 96px",
        background: "#f9fcff",
        borderBottom: "16px solid #00789f",
      }}
    >
      <img src={logo} width={494} height={90} alt="" />
      <div
        style={{
          marginTop: 56,
          fontSize: 64,
          fontWeight: 800,
          lineHeight: 1.1,
          color: "#0b1b2b",
          maxWidth: 900,
        }}
      >
        Find your dream job with verified employers
      </div>
      <div style={{ marginTop: 24, fontSize: 32, color: "#00789f" }}>
        Airlines · Hospitality · Travel & Tourism · Cruise Lines
      </div>
    </div>,
    size,
  );
}
