export const COMPANY_SIZES = [
  { value: "1-10", label: "1–10 employees" },
  { value: "11-50", label: "11–50 employees" },
  { value: "51-200", label: "51–200 employees" },
  { value: "201-1000", label: "201–1,000 employees" },
  { value: "1000+", label: "1,000+ employees" },
] as const;

export type CompanySize = (typeof COMPANY_SIZES)[number]["value"];

const FREE_MAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.in",
  "yahoo.in",
  "ymail.com",
  "rocketmail.com",
  "hotmail.com",
  "hotmail.co.in",
  "outlook.com",
  "outlook.in",
  "live.com",
  "live.in",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "protonmail.com",
  "proton.me",
  "pm.me",
  "zoho.com",
  "zohomail.com",
  "zohomail.in",
  "gmx.com",
  "gmx.net",
  "mail.com",
  "yandex.com",
  "yandex.ru",
  "rediffmail.com",
  "rediff.com",
  "tutanota.com",
  "fastmail.com",
  "hey.com",
  "inbox.com",
]);

export function getEmailDomain(email: string): string | null {
  const at = email.trim().lastIndexOf("@");
  if (at < 1) return null;
  const domain = email.trim().slice(at + 1).toLowerCase();
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(domain) ? domain : null;
}

export function isFreeMailDomain(domain: string): boolean {
  return FREE_MAIL_DOMAINS.has(domain.toLowerCase());
}

// "https://www.Taj-Hotels.com/careers" -> "taj-hotels.com"
export function getWebsiteDomain(website: string): string | null {
  const raw = website.trim();
  if (!raw) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    return url.hostname.toLowerCase().replace(/^www\./, "") || null;
  } catch {
    return null;
  }
}

export type CompanyEmailCheck = { ok: boolean; reason: string };

export function checkCompanyEmail(email: string): CompanyEmailCheck | null {
  const domain = getEmailDomain(email);
  if (!domain) return null;
  if (isFreeMailDomain(domain)) {
    return {
      ok: false,
      reason: `${domain} is a personal email provider. Register with your company email address.`,
    };
  }
  return {
    ok: true,
    reason: `Company email on ${domain} — we'll verify your account through a confirmation link sent to this address.`,
  };
}
