# Supabase setup

Candidate sign-up and sign-in run on Supabase Auth, with profiles in `public.candidates`.
Supabase stores the accounts and password hashes and generates the confirmation links. The app sends the emails itself (`src/lib/email`) through Resend, both locally and in production.

## 1. Environment

In `.env` (see `.env.example`):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SECRET_KEY=...        # Project Settings → API Keys → Secret keys
NEXT_PUBLIC_SITE_URL=http://localhost:3000

RESEND_API_KEY=...
RESEND_FROM="JobClubb <no-reply@mail.example.com>"   # domain verified in Resend
```

The secret key bypasses Row Level Security. Keep it server-only and never commit it.

## 2. Database

Migrations live in `migrations/` and are applied with the Supabase CLI (installed as a dev dependency):

```
npm run db:status    # which migrations are applied on the database
npm run db:migrate   # apply the pending ones (add `-- --dry-run` to preview)
```

Both read `DATABASE_URL` from `.env`: dashboard → **Connect** → **Session pooler** connection string, with your database password filled in (percent-encode any special characters in it).

The CLI records applied migrations in `supabase_migrations.schema_migrations`. On a database whose earlier migrations were run by hand in the SQL Editor, mark those as applied once before the first `npm run db:migrate`, or it will try to run them again:

```
npm run db -- migration repair --status applied 20260922000000 20260922010000 20260922020000 20260922030000 20260922040000 20260922050000 20260922060000 20260922070000 20260922080000 20260925000000 20260928000000 20260928010000 20260930000000
```

To add a migration, create `migrations/<YYYYMMDDHHMMSS>_<name>.sql` (or run `npx supabase migration new <name>`).

### Deleting candidates

Deleting a candidate (from `public.candidates` or **Authentication → Users**) also deletes their photo, resume PDFs and student ID from Storage. A trigger does this through the Storage API, so it needs the project URL and secret key in Vault. Run this once per project in the SQL Editor:

```sql
select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
select vault.create_secret('<SUPABASE_SECRET_KEY>', 'storage_secret_key');
```

Without these secrets, deletes still work but the files stay in Storage. The database logs a warning each time this happens.

### Company accounts

Company sign-ups land in `public.companies`, with the proof document in the private `company-proofs` bucket. Sign-up only accepts company email addresses (personal providers like Gmail are refused), so `status` moves from `pending_email` to `verified` as soon as the email is confirmed — there is no admin review. `rejected` only remains on rows rejected before that change. Only `verified` companies can sign in. Deleting a company also deletes its login and files.

Companies edit most of their profile themselves. Company name, city and GSTIN go through `public.company_change_requests` instead: the company asks from Settings, support@jobclubb.com is emailed, and an admin approves or rejects it from the company's dialog in `/admin/companies`. Approving runs `approve_company_change()`, which updates `companies` and closes the request in one transaction. Only one request per field can be pending at a time.

### Job applications

Members apply from a job page into `public.job_applications`. The table has no RLS policies: only the server (secret key) reads or writes it, because a company must never see `candidate_id`, the candidate's email or phone, or the unmasked resume.

- Applying snapshots the resume twice: `resume` (as written) and `masked_resume` (name, email, phone and LinkedIn links replaced). Company pages only ever read `masked_resume`, `skills`, `city` and `experience_months`.
- Shortlisting rebuilds `masked_resume` with the name restored, and company pages then show the name. Email and phone stay hidden at every stage.
- `job_title`, `company_name` and `candidate_name` are filled in by the insert trigger and kept in step by triggers on `company_jobs`, `companies` and `candidates`. They are for reading the table in the dashboard; company pages never select `candidate_name`. `job_interviews` carries the same three columns, copied from its application on insert and kept in step through it.
- `stage` follows Applied (0) → Viewed (1) → Shortlisted (2) → Interview (3) → Offer (4), and check constraints require the matching `viewed_at` / `shortlisted_at` / `rejected_at` timestamps. An insert trigger takes `company_id` from the job and rejects jobs that aren't `live`.
- `job_interviews` holds one row per interview round, numbered by `round_no` (1–10, cancelled rounds aren't counted). Only one round per application can be open at a time, and the next can be scheduled only once the latest has the outcome `next_round`. `selected` ends the process for JobClubb to take over, and `not_selected` rejects the application.

### Placements

When a company marks an interview `selected`, a trigger creates a row in `public.placements` and the placement team gets an email. From there JobClubb runs the offer:

1. **`awaiting_offer`:** the candidate isn't told. Their dashboard shows the round as "Awaiting result", the same as any undecided interview. The company uploads the offer letter (private `placement-documents` bucket) with the fixed monthly gross, joining date and an optional accept-by date from its Selected page.
2. **`offer_received`:** the placement team checks it in **/admin/placements** and can edit the terms or add documents.
3. **`released`:** admin releases it. The fee (`fee_amount`) is fixed at the monthly gross, GST included, and the deadline defaults to 7 days (never past the joining date). The application moves to stage 4 and the candidate is emailed. They can pay or decline.
4. **`accepted`:** paying (Razorpay, `placement_payments`, invoice numbers shared with membership) unlocks the offer documents through short-lived signed links, emails the candidate a GST invoice and tells the company and the placement team.
5. **`joined` / `not_joined`:** the company or admin records it on or after the joining date.

`expired` (deadline passed unpaid), `declined` (candidate or admin) and `withdrawn` (company or admin) close a placement. A withdrawal before release rejects the application, so the candidate only ever sees "Not selected". Placement fees are non-refundable. Company-facing queries never return candidate contact details.

The **`placements`** cron job (hourly, `POST /api/cron/placements`) expires unpaid offers, sends payment reminders 3 days and 1 day before the deadline, and reminds companies who haven't uploaded an offer after 2 days. Reminders are recorded in `placement_reminders`, keyed on the date they're for, so extending a deadline makes them due again. Deleting a placement document (or anything that cascades to one) removes the file through the same Vault secrets as candidate files.

Companies are never told about the candidate's placement fee: it's in the candidate terms (`/terms`, version `2026.10.1`) only. Companies sign up under separate employer terms (`/employer-terms`, `EMPLOYER_TERMS_VERSION`), which require offers to go through JobClubb. Candidates on an older version accept the new terms on their next application; companies see a banner and can't post jobs until they accept.

## 3. Auth settings (dashboard → Authentication)

- **URL Configuration:** set **Site URL** to `https://www.jobclubb.com` (use `http://localhost:3000` only for local testing). Add `https://www.jobclubb.com/auth/confirm` and `http://localhost:3000/auth/confirm` to **Redirect URLs**.
- **Sign In / Providers → Email:** leave **Confirm email** on. Supabase won't sign in unconfirmed accounts; the sign-in page shows a "Verify your email" screen with a resend button.
- **Emails → SMTP Settings / Templates:** not used. Supabase never sends the candidate emails, because the app creates accounts with `auth.admin.generateLink()`, which returns the link without emailing it.

## 4. Email: Resend

1. **Verify the sending domain** in Resend (**Domains**), and add the DNS records it lists.
2. **Create an API key** (**API Keys**) and set `RESEND_API_KEY` and `RESEND_FROM` in `.env`. `RESEND_FROM` must use the verified domain.
3. **Restart `next dev`** so it picks up the new variables.

Local development sends real email through the same Resend account, so test with addresses you own.

### Scheduled reminders

Three `pg_cron` jobs call the site through `public.request_cron(path)`, which sends `CRON_SECRET` as a bearer token. The app then sends whatever is due:

- **`interview-reminders`** (every 15 minutes, `POST /api/cron/interview-reminders`): a reminder about 24 hours before each interview. Interviews booked or rescheduled less than 24 hours ahead get no reminder, because the scheduled email has only just gone out.
- **`membership-reminders`** (hourly, `POST /api/cron/membership-reminders`): a reminder 15 days and 1 day before a membership expires, recorded in `membership_reminders`. A membership with under a day left gets only the 1-day one. Renewing sets a new expiry, so the next cycle's reminders go out again.
- **`placements`** (hourly, `POST /api/cron/placements`): expires unpaid offers and sends offer reminders (see Placements above).

Set it up once per project:

1. Generate a secret (`openssl rand -hex 32`) and set it as `CRON_SECRET` in the deployed app's environment.
2. In the SQL Editor, store the site URL and the same secret in Vault:

   ```sql
   select vault.create_secret('https://www.jobclubb.com', 'site_url');
   select vault.create_secret('<CRON_SECRET>', 'cron_secret');
   ```

Without these secrets the jobs log a warning and send nothing. Runs show up under **Integrations → Cron**. To test locally, set `CRON_SECRET` in `.env` and call the endpoint yourself:

```
curl -X POST http://localhost:3000/api/cron/interview-reminders -H "Authorization: Bearer $CRON_SECRET"
curl -X POST http://localhost:3000/api/cron/membership-reminders -H "Authorization: Bearer $CRON_SECRET"
```

Limits:
- **Per address** (enforced by the app, in `src/server/auth/confirmation-email.ts` using the `email_sends` table): one confirmation email a minute, and at most 5 an hour, and the same again for password reset emails. A resend cancels the previous link.
- **Resend's own cap:** depends on the Resend plan (see **Settings → Usage**).

## 5. Email template

The confirmation email is `src/lib/email/templates/confirm-signup.ts`: email-safe HTML plus a plain-text version, greeting the candidate by first name. The link confirms the email and opens the sign-in page with the email filled in; it doesn't sign the candidate in.

- The logo is attached to the email as an inline image (`src/lib/email/assets/logo.ts`, a 348×88 copy of `public/brand/jobclubb-logo.png` on a rounded chip in the page colour, so the dark wordmark stays readable when Gmail switches the email to dark mode). It shows on any Site URL, including localhost. If the logo changes, regenerate that file.
- The password reset email is `src/lib/email/templates/reset-password.ts`. Its link opens `/reset-password`; the token is only used when the candidate submits a new password, so email scanners that open links can't use it up. Resetting signs the candidate out everywhere and opens the sign-in page with the email filled in.
- The emails say the link expires in 1 hour, which is Supabase's default (**Authentication → Providers → Email → Email OTP Expiration**). If you change that setting, update the text too.

## 6. Payments: Razorpay

Candidates pay for membership on `/onboarding/membership` after verifying their email. `POST /api/create-order` creates a Razorpay order for the candidate's plan and records it in `membership_payments`; `POST /api/verify-payment` checks the checkout signature and then activates the membership.

Prices include 18% GST. Each order stores who it's billed to and its GST split (CGST + SGST for West Bengal, where JobClubb is registered, or IGST for any other state, worked out from the candidate's pincode), so an issued invoice never changes. The receipt email attaches a PDF tax invoice. Whichever confirmation (browser callback or webhook) claims `receipt_sent_at` first sends it, and a failed send releases the claim for the next one to retry. `GET /api/invoices/<payment id>` serves the invoice again from the Billing table. The supplier details and SAC code live in `src/lib/gst.ts`.

When a membership expires, the candidate goes straight to the renewal checkout. The exception is a candidate with interviews scheduled after their expiry date: they keep view-only access to Applications, Interviews, Membership and Settings until 3 days after the last of those interviews. Either way they can't change anything: the RLS policies on `public.candidates` and the `candidate-photos` bucket only allow writes while `membership_expires_at` is in the future.

- Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` from the Razorpay dashboard (**Account & Settings → API Keys**), and `NEXT_PUBLIC_RAZORPAY_KEY_ID` to the same key ID. The secret is server-only.
- Use `rzp_test_` keys locally; test cards and UPI IDs are listed at <https://razorpay.com/docs/payments/payments/test-card-details/>.
