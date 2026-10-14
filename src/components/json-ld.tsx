import { SITE_URL } from "@/lib/site-url";

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

export function SiteJsonLd() {
  const sameAs = [
    process.env.NEXT_PUBLIC_FACEBOOK_URL,
    process.env.NEXT_PUBLIC_INSTAGRAM_URL,
  ].filter(Boolean);

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Organization",
            "@id": `${SITE_URL}/#organization`,
            name: "JobClubb",
            url: SITE_URL,
            logo: `${SITE_URL}/brand/jobclubb-logo.png`,
            email: "support@jobclubb.com",
            telephone: "+91-7439922120",
            ...(sameAs.length > 0 && { sameAs }),
          },
          {
            "@type": "WebSite",
            "@id": `${SITE_URL}/#website`,
            name: "JobClubb",
            url: SITE_URL,
            inLanguage: "en-IN",
            publisher: { "@id": `${SITE_URL}/#organization` },
          },
        ],
      }}
    />
  );
}
