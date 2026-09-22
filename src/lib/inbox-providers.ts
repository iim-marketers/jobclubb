const INBOXES: { domains: string[]; name: string; url: string }[] = [
  { domains: ["gmail.com", "googlemail.com"], name: "Gmail", url: "https://mail.google.com/mail/u/0/#inbox" },
  { domains: ["outlook.com", "hotmail.com", "live.com", "msn.com"], name: "Outlook", url: "https://outlook.live.com/mail/0/" },
  { domains: ["yahoo.com", "yahoo.co.in", "ymail.com"], name: "Yahoo Mail", url: "https://mail.yahoo.com/" },
  { domains: ["icloud.com", "me.com", "mac.com"], name: "iCloud Mail", url: "https://www.icloud.com/mail" },
  { domains: ["rediffmail.com"], name: "Rediffmail", url: "https://mail.rediff.com/" },
];

export function inboxFor(email: string) {
  const domain = email.split("@")[1]?.toLowerCase();
  return INBOXES.find((i) => i.domains.includes(domain));
}
