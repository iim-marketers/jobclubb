import Link from "next/link";
import { CircleAlert, LogOut, Trash2 } from "lucide-react";

import { deleteAccount } from "@/app/(app)/candidate/dashboard/settings/actions";
import { CandidateAvatar } from "@/components/candidate/candidate-avatar";
import { DashboardHeader, Panel } from "@/components/candidate/dashboard-ui";
import { CANDIDATE_HOME } from "@/components/candidate/nav";
import {
  PasswordForm,
  PersonalDetailsForm,
  PhotoForm,
  PreferencesForm,
  type ProfileDefaults,
} from "@/components/candidate/settings-forms";
import { SettingsNav } from "@/components/candidate/settings-nav";
import { DeleteAccountDialog } from "@/components/delete-account-dialog";
import { SignOutDialog } from "@/components/sign-out-dialog";
import { Button } from "@/components/ui/button";
import { CHECKOUT_PATH } from "@/lib/membership";
import { cn } from "@/lib/utils";
import { requireMember } from "@/server/auth/current-candidate";
import { getCandidatePhotoUrl } from "@/server/candidates/photo";

export const metadata = { title: "Settings — JobClubb" };

export default async function SettingsPage() {
  const candidate = await requireMember(`${CANDIDATE_HOME}/settings`, {
    allowLapsed: true,
  });
  const photoUrl = await getCandidatePhotoUrl(candidate.photo_path);
  const defaults: ProfileDefaults = {
    firstName: candidate.first_name,
    lastName: candidate.last_name,
    email: candidate.email,
    phone: candidate.phone,
    city: candidate.city,
    pincode: candidate.pincode,
    industry: candidate.industry,
    roles: candidate.preferred_roles ?? [],
  };

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Settings"
        description="Manage your profile, job preferences and sign-in details."
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[16rem_minmax(0,52rem)] xl:gap-8">
        <SettingsNav />

        <div className="min-w-0 space-y-6">
          {candidate.lapsed && (
            <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-amber-50 p-4 dark:bg-amber-500/10">
              <span className="flex size-9 flex-none items-center justify-center rounded-xl bg-amber-500/15 text-amber-600">
                <CircleAlert className="size-4.5" />
              </span>
              <p className="min-w-0 flex-1 basis-48 text-sm leading-6 text-muted-foreground">
                <span className="font-semibold text-foreground">
                  Your membership has expired, so these settings are view-only.
                </span>{" "}
                Renew to update your profile, preferences or password.
              </p>
              <Button
                className="w-full bg-brand font-head text-brand-foreground hover:bg-brand-dark sm:w-auto sm:flex-none"
                nativeButton={false}
                render={<Link href={CHECKOUT_PATH} />}
              >
                Renew
              </Button>
            </div>
          )}
          <fieldset disabled={candidate.lapsed} className="min-w-0 space-y-6">
            <PhotoForm
              firstName={candidate.first_name}
              lastName={candidate.last_name}
              photoUrl={photoUrl}
            />
            <PersonalDetailsForm defaults={defaults} />
            <PreferencesForm defaults={defaults} />
            <PasswordForm />
          </fieldset>

          <Panel
            id="account"
            title="Account"
            description="Session and account controls."
          >
            <ul className="divide-y divide-border -mx-5">
              <AccountRow
                title="Sign out"
                description={`You're signed in as ${candidate.email}.`}
                className="pb-5 px-5"
              >
                <SignOutDialog
                  render={
                    <Button
                      variant="outline"
                      className="h-10 w-full font-head sm:w-44"
                    />
                  }
                >
                  <LogOut className="size-4" /> Sign out
                </SignOutDialog>
              </AccountRow>
              <AccountRow
                title="Delete account"
                description="Permanently delete your profile, resume and applications. This can't be undone."
                destructive
                className="pt-4 px-5"
              >
                <DeleteAccountDialog
                  action={deleteAccount}
                  avatar={
                    <CandidateAvatar
                      firstName={candidate.first_name}
                      lastName={candidate.last_name}
                      photoUrl={photoUrl}
                      className="size-14 bg-primary/10 text-lg text-primary"
                    />
                  }
                  name={`${candidate.first_name} ${candidate.last_name}`}
                  email={candidate.email}
                  description="Your profile, resume, applications, interviews and membership will be permanently deleted. This can't be undone. We keep copies of your GST invoices, as the law requires."
                  render={
                    <Button
                      variant="destructive"
                      className="h-10 w-full font-head sm:w-44"
                    />
                  }
                >
                  <Trash2 className="size-4" /> Delete account
                </DeleteAccountDialog>
              </AccountRow>
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function AccountRow({
  title,
  description,
  destructive,
  className,
  children,
}: {
  title: string;
  description: string;
  destructive?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <li
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6",
        className,
      )}
    >
      <div className="min-w-0">
        <p
          className={cn(
            "font-head text-sm font-bold",
            destructive && "text-destructive",
          )}
        >
          {title}
        </p>
        <p className="mt-0.5 max-w-md text-sm wrap-break-word text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="flex-none">{children}</div>
    </li>
  );
}
