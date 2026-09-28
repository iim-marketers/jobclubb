import Image from "next/image";

import { cn } from "@/lib/utils";

export function CandidateAvatar({
  firstName,
  lastName,
  photoUrl,
  className,
}: {
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative flex flex-none items-center justify-center overflow-hidden rounded-full font-head font-extrabold",
        className,
      )}
    >
      {photoUrl ? (
        <Image src={photoUrl} alt="" fill unoptimized className="object-cover" />
      ) : (
        <>
          {firstName[0]}
          {lastName[0]}
        </>
      )}
    </span>
  );
}
