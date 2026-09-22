# Supabase setup

Candidate sign-up and sign-in run on Supabase Auth, with profiles in `public.candidates`.
Supabase stores the accounts and password hashes and generates the confirmation links. The app sends the emails itself, through Nodemailer (`src/lib/email`).

## 1. Environment

In `.env` (see `.env.example`):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SECRET_KEY=...        # Project Settings → API Keys → Secret keys
NEXT_PUBLIC_SITE_URL=http://localhost:3000

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASSWORD=...              # 16-character Gmail app password
SMTP_FROM="JobClubb <you@gmail.com>"
```

The secret key bypasses Row Level Security. Keep it server-only and never commit it.

## 2. Database

Run every file in `migrations/` in order: open the dashboard's **SQL Editor**, paste the file's contents and click **Run**.
With the Supabase CLI you can run `supabase link` and then `supabase db push` instead.

## 3. Auth settings (dashboard → Authentication)

- **URL Configuration:** set **Site URL** to `http://localhost:3000` for now and to the live domain later. Add `http://localhost:3000/auth/confirm` (and the live equivalent) to **Redirect URLs**.
- **Sign In / Providers → Email:** leave **Confirm email** on. Supabase won't sign in unconfirmed accounts; the sign-in page shows a "Verify your email" screen with a resend button.
- **Emails → SMTP Settings / Templates:** not used. Supabase never sends the candidate emails, because the app creates accounts with `auth.admin.generateLink()`, which returns the link without emailing it.

## 4. Email: Nodemailer + Gmail

1. **Create an app password.** On the Google account that will send the email, turn on 2-Step Verification, then go to <https://myaccount.google.com/apppasswords> and create one named "JobClubb". Gmail SMTP won't accept your normal Google password.
2. **Fill in the `SMTP_*` variables** in `.env`. Paste the app password without its spaces. `SMTP_FROM` must use the same Gmail address, because Gmail rewrites any other From address.
3. **Restart `next dev`** so it picks up the new variables.

Limits:
- **Per address** (enforced by the app, in `src/server/auth/confirmation-email.ts` using the `email_sends` table): one confirmation email a minute, and at most 5 an hour. A resend cancels the previous link.
- **Gmail's own cap:** about 500 emails a day for a free Gmail account, or 2,000 for Google Workspace.

For launch, send from a Google Workspace address on your own domain (e.g. `noreply@jobclubb.com`), with the same settings and its own app password. Mail sent from a `@gmail.com` address on behalf of a business is more likely to be marked as spam.

## 5. Email template

The confirmation email is `src/lib/email/templates/confirm-signup.ts`: email-safe HTML plus a plain-text version, greeting the candidate by first name. The link confirms the email and opens the sign-in page with the email filled in; it doesn't sign the candidate in.

- The logo is attached to the email as an inline image (`src/lib/email/assets/logo.ts`, a 284×52 copy of `public/brand/jobclubb-logo.png`). It shows on any Site URL, including localhost. If the logo changes, regenerate that file.
- The email says the link expires in 1 hour, which is Supabase's default (**Authentication → Providers → Email → Email OTP Expiration**). If you change that setting, update the text too.
