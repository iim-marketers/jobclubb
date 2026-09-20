import { avatarColor, initials } from "@/lib/home-data";
import { cn } from "@/lib/utils";

export function CompanyAvatar({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      style={{ backgroundColor: avatarColor(name) }}
      className={cn(
        "flex size-10 flex-none items-center justify-center rounded-full font-head text-xs font-bold text-white",
        className
      )}
    >
      {initials(name)}
    </span>
  );
}
