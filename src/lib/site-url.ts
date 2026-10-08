const PRODUCTION_SITE_URL = "https://www.jobclubb.com";

// Never the request's Origin header: it can be forged to point email links elsewhere.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NODE_ENV === "production" ? PRODUCTION_SITE_URL : "http://localhost:3000")
).replace(/\/$/, "");
