"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Home,
  MapPin,
  ShieldCheck,
  UserRound,
  UserRoundSearch,
  Users,
} from "lucide-react";
import { useAuth } from "@/features/auth/auth-provider";
import { api } from "@/lib/api/client";

const links = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/buddies", label: "Study Buddy", icon: UserRoundSearch },
  { href: "/spots", label: "Study Spots", icon: MapPin },
  { href: "/requests", label: "Requests", icon: Users },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, token, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const incoming = useQuery({
    queryKey: ["requests", user?.uid, "incoming", "badge"],
    enabled: Boolean(user?.emailVerified),
    queryFn: async ({ signal }) =>
      api.requests("incoming", (await token())!, undefined, signal),
    staleTime: 15_000,
  });
  const badge =
    incoming.data?.items.filter((item) => item.status === "pending").length ??
    0;
  const badgeLabel = incoming.data?.next_cursor ? `${badge}+` : String(badge);
  const initials = (user?.email?.split("@")[0] ?? "WS")
    .slice(0, 2)
    .toUpperCase();

  const active = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <>
      <header className="app-header">
        <nav className="nav" aria-label="Primary">
          <Link href="/dashboard" className="brand">
            <span className="brandmark" aria-hidden="true" />
            <span>Waseda Study Hub</span>
          </Link>
          <div className="nav-links">
            {links.slice(1).map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                aria-current={active(href) ? "page" : undefined}
              >
                <Icon aria-hidden="true" />
                {label}
                {href === "/requests" && badge > 0 && (
                  <span
                    className="nav-badge"
                    aria-label={`${badgeLabel} pending`}
                  >
                    {badgeLabel}
                  </span>
                )}
              </Link>
            ))}
          </div>
          <details className="profile-menu">
            <summary aria-label="Open profile menu">
              <span className="avatar">{initials}</span>
            </summary>
            <div className="profile-popover">
              <div className="menu-identity">
                <strong>Student account</strong>
                <span>{user?.email}</span>
              </div>
              <Link href="/profile">
                <UserRound aria-hidden="true" /> Profile
              </Link>
              <Link href="/privacy">
                <ShieldCheck aria-hidden="true" /> Privacy
              </Link>
              <button
                onClick={async () => {
                  await signOut();
                  router.replace("/sign-in");
                }}
              >
                Sign out
              </button>
            </div>
          </details>
        </nav>
      </header>
      <main className="shell">{children}</main>
      <nav className="mobile-nav" aria-label="Mobile primary">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={active(href) ? "page" : undefined}
          >
            <Icon aria-hidden="true" />
            <span>{label}</span>
            {href === "/requests" && badge > 0 && (
              <span className="nav-badge" aria-label={`${badgeLabel} pending`}>
                {badgeLabel}
              </span>
            )}
          </Link>
        ))}
      </nav>
    </>
  );
}
