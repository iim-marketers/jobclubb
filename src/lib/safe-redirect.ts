// URL parsing treats "\" like "/", so "/\evil.com" is as unsafe as "//evil.com".
export function safeRedirectPath(next: unknown, fallback: string) {
  return typeof next === "string" && /^\/(?![/\\])/.test(next) ? next : fallback;
}
