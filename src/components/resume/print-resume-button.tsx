"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";

export function PrintResumeButton({ fileName }: { fileName: string }) {
  function print() {
    // Browsers use document.title as the default "Save as PDF" file name.
    const title = document.title;
    document.title = fileName;
    window.print();
    document.title = title;
  }

  return (
    <Button className="bg-brand font-head text-brand-foreground hover:bg-brand-dark" onClick={print}>
      <Download className="size-4" />
      Download PDF
    </Button>
  );
}
