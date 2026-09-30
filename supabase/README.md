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

Migrations live in `migrations/` and are applied with the Supabase CLI (installed as a dev dependency):

```
pnpm db:status    # which migrations are applied on the database
pnpm db:migrate   # apply the pending ones (add --dry-run to preview)
```

Both read `DATABASE_URL` from `.env`: dashboard → **Connect** → **Session pooler** connection string, with your database password filled in (percent-encode any special characters in it).

The CLI records applied migrations in `supabase_migrations.schema_migrations`. On a database whose earlier migrations were run by hand in the SQL Editor, mark those as applied once before the first `pnpm db:migrate`, or it will try to run them again:

```
pnpm db migration repair --status applied 20260922000000 20260922010000 20260922020000 20260922030000 20260922040000 20260922050000 20260922060000 20260922070000 20260922080000 20260925000000 20260928000000 20260928010000 20260930000000
```

To add a migration, create `migrations/<YYYYMMDDHHMMSS>_<name>.sql` (or run `pnpm exec supabase migration new <name>`).

### Deleting candidates

Deleting a candidate (from `public.candidates` or **Authentication → Users**) also deletes their photo, resume PDFs and student ID from Storage. A trigger does this through the Storage API, so it needs the project URL and secret key in Vault. Run this once per project in the SQL Editor:

```sql
select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
select vault.create_secret('<SUPABASE_SECRET_KEY>', 'storage_secret_key');
```

Without these secrets, deletes still work but the files stay in Storage. The database logs a warning each time this happens.

## 3. Auth settings (dashboard → Authentication)

- **URL Configuration:** set **Site URL** to `http://localhost:3000` for now and to the live domain later. Add `http://localhost:3000/auth/confirm` (and the live equivalent) to **Redirect URLs**.
- **Sign In / Providers → Email:** leave **Confirm email** on. Supabase won't sign in unconfirmed accounts; the sign-in page shows a "Verify your email" screen with a resend button.
- **Emails → SMTP Settings / Templates:** not used. Supabase never sends the candidate emails, because the app creates accounts with `auth.admin.generateLink()`, which returns the link without emailing it.

## 4. Email: Nodemailer + Gmail

1. **Create an app password.** On the Google account that will send the email, turn on 2-Step Verification, then go to <https://myaccount.google.com/apppasswords> and create one named "JobClubb". Gmail SMTP won't accept your normal Google password.
2. **Fill in the `SMTP_*` variables** in `.env`. Paste the app password without its spaces. `SMTP_FROM` must use the same Gmail address, because Gmail rewrites any other From address.
3. **Restart `next dev`** so it picks up the new variables.

Limits:
- **Per address** (enforced by the app, in `src/server/auth/confirmation-email.ts` using the `email_sends` table): one confirmation email a minute, and at most 5 an hour, and the same again for password reset emails. A resend cancels the previous link.
- **Gmail's own cap:** about 500 emails a day for a free Gmail account, or 2,000 for Google Workspace.

For launch, send from a Google Workspace address on your own domain (e.g. `noreply@jobclubb.com`), with the same settings and its own app password. Mail sent from a `@gmail.com` address on behalf of a business is more likely to be marked as spam.

## 5. Email template

The confirmation email is `src/lib/email/templates/confirm-signup.ts`: email-safe HTML plus a plain-text version, greeting the candidate by first name. The link confirms the email and opens the sign-in page with the email filled in; it doesn't sign the candidate in.

- The logo is attached to the email as an inline image (`src/lib/email/assets/logo.ts`, a 284×52 copy of `public/brand/jobclubb-logo.png`). It shows on any Site URL, including localhost. If the logo changes, regenerate that file.
- The password reset email is `src/lib/email/templates/reset-password.ts`. Its link opens `/reset-password`; the token is only used when the candidate submits a new password, so email scanners that open links can't use it up. Resetting signs the candidate out everywhere and opens the sign-in page with the email filled in.
- The emails say the link expires in 1 hour, which is Supabase's default (**Authentication → Providers → Email → Email OTP Expiration**). If you change that setting, update the text too.

## 6. Payments: Razorpay

Candidates pay for membership on `/onboarding/membership` after verifying their email. `POST /api/create-order` creates a Razorpay order for the candidate's plan and records it in `membership_payments`; `POST /api/verify-payment` checks the checkout signature and then activates the membership.

- Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` from the Razorpay dashboard (**Account & Settings → API Keys**), and `NEXT_PUBLIC_RAZORPAY_KEY_ID` to the same key ID. The secret is server-only.
- Use `rzp_test_` keys locally; test cards and UPI IDs are listed at <https://razorpay.com/docs/payments/payments/test-card-details/>.
