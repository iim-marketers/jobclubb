"use client";

import { Accordion } from "@base-ui/react/accordion";
import { ChevronDown } from "lucide-react";

export type AccordionSection = {
  value: string;
  title: string;
  description?: string;
  badge?: React.ReactNode;
  content: React.ReactNode;
};

export function AccordionSections({
  sections,
  defaultOpen = sections[0]?.value,
}: {
  sections: AccordionSection[];
  defaultOpen?: string;
}) {
  return (
    <Accordion.Root defaultValue={defaultOpen ? [defaultOpen] : []} className="space-y-4">
      {sections.map((s) => (
        <Accordion.Item
          key={s.value}
          value={s.value}
          className="overflow-hidden rounded-3xl border border-border bg-card"
        >
          <Accordion.Header>
            <Accordion.Trigger className="group flex w-full items-center gap-3 px-5 py-4 text-left transition-colors outline-none hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-inset sm:px-6">
              <span className="min-w-0 flex-1">
                <span className="block font-head font-bold tracking-tight">{s.title}</span>
                {s.description && (
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {s.description}
                  </span>
                )}
              </span>
              {s.badge}
              <ChevronDown className="size-4 flex-none text-muted-foreground transition-transform duration-200 group-data-panel-open:rotate-180" />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel
            keepMounted
            className="h-(--accordion-panel-height) overflow-hidden transition-[height] duration-200 ease-out data-ending-style:h-0 data-starting-style:h-0"
          >
            <div className="border-t border-border">{s.content}</div>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
