"use client";

import {
  useId,
  useRef,
  useState,
  useTransition,
  type ReactElement,
  type ReactNode,
} from "react";
import { Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const CONFIRM_WORD = "confirm";

export function DeleteAccountDialog({
  action,
  avatar,
  name,
  email,
  description,
  render,
  children,
}: {
  action: () => Promise<{ error?: string }>;
  avatar: ReactNode;
  name: string;
  email: string;
  description: string;
  render: ReactElement;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [typed, setTyped] = useState("");
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const confirmed = typed.trim().toLowerCase() === CONFIRM_WORD;

  return (
    <Dialog
      open={pending || open}
      onOpenChange={(next) => {
        if (pending) return;
        setOpen(next);
        setError(undefined);
        setTyped("");
      }}
    >
      <DialogTrigger render={render}>{children}</DialogTrigger>
      <DialogContent
        showCloseButton={false}
        initialFocus={inputRef}
        className="gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-md"
      >
        <div className="flex items-center justify-between border-b border-border py-3 pr-3 pl-5">
          <DialogTitle className="font-head text-base font-bold">
            Delete account
          </DialogTitle>
          <DialogClose
            disabled={pending}
            render={<Button variant="ghost" size="icon-sm" />}
          >
            <X />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        <div className="flex flex-col items-center border-b border-border bg-muted/40 px-5 py-6 text-center">
          {avatar}
          <p className="mt-3 max-w-full truncate font-head text-lg font-bold tracking-tight">
            {name}
          </p>
          <p className="max-w-full truncate text-sm text-muted-foreground">
            {email}
          </p>
        </div>

        <form
          className="space-y-3 p-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (!confirmed || pending) return;
            startTransition(async () => {
              const result = await action();
              if (result?.error) setError(result.error);
            });
          }}
        >
          <DialogDescription className="leading-6">
            {description}
          </DialogDescription>
          <label
            htmlFor={inputId}
            className="block pt-1 text-sm"
          >
            To confirm, type &ldquo;
            <span className="font-semibold">{CONFIRM_WORD}</span>&rdquo; in the
            box below
          </label>
          <Input
            ref={inputRef}
            id={inputId}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            disabled={pending}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            className="h-10 border-destructive/40 focus-visible:border-destructive/60 focus-visible:ring-destructive/20"
          />
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button
            type="submit"
            disabled={pending || !confirmed}
            className="h-10 w-full bg-destructive font-head text-white hover:bg-destructive/90 disabled:bg-muted disabled:text-destructive/60 disabled:opacity-100"
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            {pending ? "Deleting…" : "Delete this account"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
