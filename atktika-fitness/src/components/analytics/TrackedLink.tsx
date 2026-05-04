"use client";

import { reachGoal } from "@/lib/metrika";
import type { AnchorHTMLAttributes, ReactNode } from "react";

interface Props extends AnchorHTMLAttributes<HTMLAnchorElement> {
  goal: string;
  goalParams?: Record<string, unknown>;
  children: ReactNode;
}

// Client wrapper around <a> that fires Yandex.Metrika reachGoal on click.
// Use for tel:/Telegram links anywhere on the site to track conversions.
export default function TrackedLink({
  goal,
  goalParams,
  onClick,
  children,
  ...rest
}: Props) {
  return (
    <a
      {...rest}
      onClick={(e) => {
        reachGoal(goal, goalParams);
        onClick?.(e);
      }}
    >
      {children}
    </a>
  );
}
