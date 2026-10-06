import Image from "next/image";

import { avatarColor, initials } from "@/lib/home-data";
import { cn } from "@/lib/utils";

export function CompanyAvatar({
  name,
  logoUrl,
  className,
}: {
  name: string;
  logoUrl?: string | null;
  className?: string;
}) {
  if (logoUrl)
    return (
      <span
        aria-hidden
        className={cn(
          "relative flex size-10 flex-none overflow-hidden rounded-full bg-white",
          className,
        )}
      >
        <Image src={logoUrl} alt="" fill unoptimized className="object-contain" />
      </span>
    );

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
