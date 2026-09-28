"use client";

import { useEffect } from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";

const MM = 96 / 25.4;
const PAGE_WIDTH = 210 * MM;
const PAGE_HEIGHT = 293 * MM;
const MARGIN = 14 * MM;

function fitResumeToPage() {
  const resume = document.getElementById("resume-print");
  if (!resume) return;

  const probe = resume.cloneNode(true) as HTMLElement;
  probe.removeAttribute("id");
  Object.assign(probe.style, {
    position: "absolute",
    top: "0",
    left: "-10000px",
    visibility: "hidden",
    boxSizing: "border-box",
    width: `${PAGE_WIDTH}px`,
    maxWidth: "none",
    margin: "0",
    padding: `${MARGIN}px`,
  });
  document.body.append(probe);
  const height = probe.offsetHeight;
  probe.remove();

  const scale = Math.min(1, (PAGE_HEIGHT - 2 * MARGIN) / (height - 2 * MARGIN));
  resume.style.setProperty("--print-scale", String(scale));
}

export function PrintResumeButton({ fileName }: { fileName: string }) {
  useEffect(() => {
    window.addEventListener("beforeprint", fitResumeToPage);
    return () => window.removeEventListener("beforeprint", fitResumeToPage);
  }, []);

  function print() {
    const title = document.title;
    document.title = fileName;
    window.print();
    document.title = title;
  }

  return (
    <Button
      className="bg-brand font-head text-brand-foreground hover:bg-brand-dark"
      onClick={print}
    >
      <Download className="size-4" />
      Download PDF
    </Button>
  );
}
