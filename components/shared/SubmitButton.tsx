"use client";

import { useFormStatus } from "react-dom";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Spinner } from "./Spinner";

export function SubmitButton({
  children,
  pendingLabel,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending || props.disabled} className={className} {...props}>
      {pending ? (
        <span className="inline-flex items-center gap-2">
          <Spinner className="h-4 w-4" />
          {pendingLabel ?? "Working…"}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
