"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Briefcase,
  Images,
  Tags,
  Settings,
  UserCog,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  MessageSquareQuote,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { signOut } from "@/app/admin/lib/actions/account";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/portfolio-projects", label: "Projects", icon: Briefcase },
  { href: "/admin/media", label: "Media Library", icon: Images },
  { href: "/admin/technologies", label: "Technologies", icon: Tags },
  { href: "/admin/reviews", label: "Reviews", icon: MessageSquareQuote },
  { href: "/admin/settings", label: "Portfolio Settings", icon: Settings },
  { href: "/admin/account", label: "Account", icon: UserCog },
] as const;

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
              active
                ? "bg-primary/10 text-primary shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
                : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
            )}
          >
            <Icon className={cn("size-[18px] shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminSidebar({ ownerEmail }: { ownerEmail: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar trigger */}
      <div className="flex items-center justify-between border-b border-white/[0.06] bg-[#0a0b0d] px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-primary" />
          <span className="text-sm font-semibold">Owner CMS</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-lg border border-white/10 p-2 text-muted-foreground hover:text-foreground"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </button>
      </div>

      {/* Desktop floating sidebar */}
      <aside className="fixed inset-y-4 left-4 z-40 hidden w-64 flex-col rounded-3xl border border-white/[0.07] bg-white/[0.025] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] backdrop-blur-2xl lg:flex">
        <div className="flex items-center gap-2.5 px-5 py-6">
          <div className="flex size-9 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-b from-white/10 to-white/0">
            <ShieldCheck className="size-[18px] text-primary" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">Owner CMS</p>
            <p className="truncate text-xs text-muted-foreground">{ownerEmail}</p>
          </div>
        </div>

        <NavLinks pathname={pathname} />

        <div className="p-3">
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="size-[18px]" />
              Logout
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-[#0a0b0d] shadow-2xl lg:hidden"
            >
              <div className="flex items-center justify-between px-5 py-5">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="size-5 text-primary" />
                  <span className="text-sm font-semibold">Owner CMS</span>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg border border-white/10 p-1.5 text-muted-foreground hover:text-foreground"
                  aria-label="Close menu"
                >
                  <X className="size-4" />
                </button>
              </div>
              <NavLinks pathname={pathname} onNavigate={() => setMobileOpen(false)} />
              <div className="p-3">
                <form action={signOut}>
                  <button
                    type="submit"
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <LogOut className="size-[18px]" />
                    Logout
                  </button>
                </form>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
