import { createClient, type EmailOtpType } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { SITE_URL } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/server";
import { PENDING_EMAIL_COOKIE } from "@/lib/supabase/session";

export async function GET(request: NextRequest) {
  // Behind the host's reverse proxy, request.nextUrl.origin can resolve to localhost.
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const expired = () =>
    NextResponse.redirect(new URL("/sign-in?error=link-expired", SITE_URL));

  if (!tokenHash || !type) return expired();

  // verifyOtp() always starts a session; keep it out of cookies and revoke it.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { data, error } = await supabase.auth.verifyOtp({
    type,
    token_hash: tokenHash,
  });

  if (error || !data.user?.email) return expired();
  if (data.session) await supabase.auth.signOut({ scope: "local" });

  (await cookies()).set(PENDING_EMAIL_COOKIE, data.user.email, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });
  // A franchise can't sign in until admin approves it, so tell it what happens next instead.
  if (data.user.user_metadata?.role === "franchise") {
    const { data: franchise } = await createAdminClient()
      .from("franchises")
      .select("status")
      .eq("id", data.user.id)
      .maybeSingle();
    if (franchise?.status !== "approved")
      return NextResponse.redirect(new URL("/sign-up/submitted?route=franchise&confirmed=1", SITE_URL));
    return NextResponse.redirect(new URL("/sign-in?verified=1&as=franchise", SITE_URL));
  }
  return NextResponse.redirect(new URL("/sign-in?verified=1", SITE_URL));
}
