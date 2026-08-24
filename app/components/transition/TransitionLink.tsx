"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps, MouseEvent } from "react";
import { useTransitionRouter } from "./TransitionProvider";

type Props = ComponentProps<typeof Link>;

/**
 * Drop-in replacement for next/link that routes internal navigation
 * through the liquid page transition instead of an instant swap. External
 * links, modified clicks (cmd/ctrl/shift/middle-click), and same-page
 * links all fall back to native <Link> behavior untouched.
 */
export default function TransitionLink({ href, onClick, children, ...rest }: Props) {
  const { navigate } = useTransitionRouter();
  const pathname = usePathname();
  const targetHref = typeof href === "string" ? href : (href.pathname ?? "");

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    onClick?.(e);
    if (e.defaultPrevented) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (!targetHref.startsWith("/")) return;

    // A same-page hash link (e.g. "/#team" clicked while already on "/")
    // is still a same-page link — comparing the full href (hash and all)
    // against pathname (which never includes the hash) missed that case
    // and would run the full liquid transition just to scroll down the
    // current page. Strip the hash before comparing so it falls back to
    // native anchor-scroll behavior like every other same-page link.
    const targetPath = targetHref.split("#")[0] || "/";
    if (targetHref === pathname || targetPath === pathname) return;

    e.preventDefault();
    navigate(targetHref);
  }

  return (
    <Link href={href} onClick={handleClick} {...rest}>
      {children}
    </Link>
  );
}
