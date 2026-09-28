import { LogOut, Trash2 } from "lucide-react";

import { signOut } from "@/app/(auth)/sign-in/actions";
import { DashboardHeader, Panel } from "@/components/candidate/dashboard-ui";
import { CANDIDATE_HOME } from "@/components/candidate/nav";
import {
  PasswordForm,
  PersonalDetailsForm,
  PreferencesForm,
  type ProfileDefaults,
} from "@/components/candidate/settings-forms";
import { SettingsNav } from "@/components/candidate/settings-nav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { requireMember } from "@/server/auth/current-candidate";

export const metadata = { title: "Settings — JobClubb" };

export default async function SettingsPage() {
  const candidate = await requireMember(`${CANDIDATE_HOME}/settings`);
  const defaults: ProfileDefaults = {
    firstName: candidate.first_name,
    lastName: candidate.last_name,
    email: candidate.email,
    phone: candidate.phone,
    city: candidate.city,
    pincode: candidate.pincode,
    vertical: candidate.vertical,
  };

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Settings"
        description="Manage your profile, job preferences and sign-in details."
      />

      <div className="grid items-start gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[16rem_minmax(0,52rem)] xl:gap-8">
        <SettingsNav />

        <div className="min-w-0 space-y-6">
          <PersonalDetailsForm defaults={defaults} />
          <PreferencesForm defaults={defaults} />
          <PasswordForm />

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
                <form action={signOut}>
                  <Button
                    type="submit"
                    variant="outline"
                    className="h-10 w-full font-head sm:w-44"
                  >
                    <LogOut className="size-4" /> Sign out
                  </Button>
                </form>
              </AccountRow>
              <AccountRow
                title="Delete account"
                description="Permanently remove your profile, resume and applications. Our team will confirm with you before anything is deleted."
                destructive
                className="pt-4 px-5"
              >
                <Button
                  variant="destructive"
                  className="h-10 w-full font-head sm:w-44"
                  nativeButton={false}
                  render={
                    <a
                      href={`mailto:contact@jobclubb.com?subject=${encodeURIComponent(
                        "Delete my JobClubb account",
                      )}&body=${encodeURIComponent(
                        `Please delete the account registered to ${candidate.email}.`,
                      )}`}
                    />
                  }
                >
                  <Trash2 className="size-4" /> Request deletion
                </Button>
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
