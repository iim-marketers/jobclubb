export const COMPANY_SIZES = [
  { value: "1-10", label: "1–10 employees", large: false },
  { value: "11-50", label: "11–50 employees", large: false },
  { value: "51-200", label: "51–200 employees", large: false },
  { value: "201-1000", label: "201–1,000 employees", large: true },
  { value: "1000+", label: "1,000+ employees", large: true },
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

export function isLargeCompany(size: string): boolean {
  return COMPANY_SIZES.some((s) => s.value === size && s.large);
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

function domainsMatch(emailDomain: string, websiteDomain: string): boolean {
  return (
    emailDomain === websiteDomain ||
    emailDomain.endsWith(`.${websiteDomain}`) ||
    websiteDomain.endsWith(`.${emailDomain}`)
  );
}

export type VerificationRoute =
  | "email"
  | "manual"
  | "blocked";

export type VerificationAssessment = {
  route: VerificationRoute;
  reason: string;
};

export function assessCompanyVerification({
  email,
  size,
  website,
}: {
  email: string;
  size: string;
  website: string;
}): VerificationAssessment | null {
  const emailDomain = getEmailDomain(email);
  if (!emailDomain) return null;

  if (isFreeMailDomain(emailDomain)) {
    if (isLargeCompany(size)) {
      return {
        route: "blocked",
        reason: `Companies with 200+ employees must register with a corporate email address, not ${emailDomain}.`,
      };
    }
    return {
      route: "manual",
      reason: `${emailDomain} is a personal email provider, so our team will verify your company manually. Upload a business document below to speed this up.`,
    };
  }

  const websiteDomain = getWebsiteDomain(website);
  if (websiteDomain && !domainsMatch(emailDomain, websiteDomain)) {
    return {
      route: "manual",
      reason: `Your email domain (${emailDomain}) doesn't match your website (${websiteDomain}), so our team will verify your company manually.`,
    };
  }

  return {
    route: "email",
    reason: `Corporate email on ${emailDomain} — we'll verify your account through a confirmation link sent to this address.`,
  };
}
