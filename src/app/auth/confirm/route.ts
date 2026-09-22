import { createClient, type EmailOtpType } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { PENDING_EMAIL_COOKIE } from "@/lib/supabase/session";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const expired = () =>
    NextResponse.redirect(new URL("/sign-in?error=link-expired", origin));

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
  return NextResponse.redirect(new URL("/sign-in?verified=1", origin));
}
