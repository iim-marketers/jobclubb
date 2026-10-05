"use client";

import { useState, useTransition, type ReactElement, type ReactNode } from "react";
import { LogOut } from "lucide-react";

import { signOut } from "@/app/(auth)/sign-in/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function SignOutDialog({
  render,
  children,
  open,
  onOpenChange,
  description = "You'll need to sign in again to see your matches, applications and resume.",
}: {
  render?: ReactElement;
  children?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  description?: string;
}) {
  const [ownOpen, setOwnOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const isOpen = open ?? ownOpen;
  const setOpen = onOpenChange ?? setOwnOpen;

  return (
    <Dialog
      open={pending || isOpen}
      onOpenChange={(next) => !pending && setOpen(next)}
    >
      {render && <DialogTrigger render={render}>{children}</DialogTrigger>}
      <DialogContent showCloseButton={false}>
        <DialogHeader className="items-center text-center sm:items-start sm:text-left">
          <span className="mb-1 flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <LogOut className="size-5" />
          </span>
          <DialogTitle className="font-head text-lg font-bold">
            Sign out?
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose
            disabled={pending}
            render={<Button variant="outline" className="font-head" />}
          >
            Cancel
          </DialogClose>
          <Button
            variant="destructive"
            disabled={pending}
            className="font-head"
            onClick={() => startTransition(() => signOut())}
          >
            {pending ? "Signing out…" : "Sign out"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
