import { SALARY_UNDISCLOSED } from "@/lib/company-jobs";

export function Salary({ value }: { value: string }) {
  if (value !== SALARY_UNDISCLOSED) return value;
  return (
    <span className="font-sans text-[0.875em] font-normal tracking-normal text-muted-foreground">
      Not disclosed
    </span>
  );
}
