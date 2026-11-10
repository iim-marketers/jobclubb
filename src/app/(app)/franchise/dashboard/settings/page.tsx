import { changeFranchisePassword } from "@/app/(app)/franchise/dashboard/actions";
import { Panel } from "@/components/candidate/dashboard-ui";
import { PasswordForm } from "@/components/candidate/settings-forms";
import { CopyCode } from "@/components/copy-code";
import {
  FRANCHISE_SETTINGS,
  FRANCHISE_STATUS_LABELS,
  constitutionLabel,
  lastDayOf,
} from "@/lib/franchise";
import { formatDateOnly } from "@/lib/placements";
import { requireFranchise } from "@/server/franchises/current";

export const metadata = { title: "Settings — JobClubb franchise" };

function Details({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt className="text-xs text-muted-foreground">{label}</dt>
          <dd className="mt-0.5 text-sm leading-6 break-words">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

const mask = (accountNo: string) => `•••• ${accountNo.slice(-4)}`;

export default async function FranchiseSettingsPage() {
  const f = await requireFranchise(FRANCHISE_SETTINGS);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-head text-2xl font-extrabold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your details as recorded in your franchise agreement. To change anything except your
          password, email support@jobclubb.com.
        </p>
      </div>

      <Panel title="Franchise" description="Schedule A of your agreement.">
        <Details
          rows={[
            ["Franchise", f.name],
            ["Code", <CopyCode key="code" code={f.code} />],
            ["Legal name", `${f.legalName} (${constitutionLabel(f.constitution)})`],
            ["Represented by", f.ownerName],
            ["PAN", f.pan],
            ["GSTIN", f.gstin ?? "—"],
            ["Outlet", f.outletAddress],
            ["Territory", `${f.territory} (${f.exclusive ? "exclusive" : "non-exclusive"})`],
            [
              "Agreement",
              `${formatDateOnly(f.startsOn)} to ${formatDateOnly(lastDayOf(f))} · ${FRANCHISE_STATUS_LABELS[f.status]}`,
            ],
            ["Phone", f.phone],
          ]}
        />
      </Panel>

      <Panel title="Bank account for commission" description="Where JobClubb transfers your commission.">
        {f.bankAccountNo && f.bankIfsc ? (
          <Details
            rows={[
              ["Account name", f.bankAccountName],
              ["Bank and branch", f.bankName],
              ["Account number", mask(f.bankAccountNo)],
              ["IFSC", f.bankIfsc],
            ]}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            Not added yet. Email your bank details to support@jobclubb.com so JobClubb can pay your
            commission.
          </p>
        )}
      </Panel>

      <PasswordForm
        action={changeFranchisePassword}
        description={`Choose a new password for signing in as ${f.email}.`}
      />
    </div>
  );
}
