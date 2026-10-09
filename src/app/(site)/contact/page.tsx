import Link from "next/link";

import { PageHeader } from "@/components/page-shell";
import { CONTACT_ITEMS } from "@/components/site-footer";

export const metadata = {
  title: "Contact Us — JobClubb",
  description: "Get in touch with the JobClubb team.",
};

export default function ContactPage() {
  return (
    <>
      <PageHeader
        title="Contact Us"
        description="Questions about jobs, membership, payments or refunds? Reach us any of these ways and we'll get back to you within one working day."
      />

      <section className="px-4 py-12 sm:px-6">
        <ul className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
          {CONTACT_ITEMS.map(({ icon: Icon, text, href }) => (
            <li
              key={text}
              className="flex items-start gap-3 rounded-2xl border border-border bg-card p-5"
            >
              <Icon className="mt-0.5 size-5 flex-none text-brand" />
              {href ? (
                <Link
                  href={href}
                  className="font-medium transition-colors hover:text-brand"
                >
                  {text}
                </Link>
              ) : (
                <span className="font-medium">{text}</span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
