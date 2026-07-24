"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth-provider";

const links = [
  ["/dashboard", "Home"],
  ["/buddies", "Study Buddy"],
  ["/spots", "Study Spots"],
  ["/requests", "Requests"],
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  return (
    <>
      <header className="app-header">
        <nav className="nav" aria-label="Primary">
          <Link href="/dashboard" className="brand">
            <span className="brandmark" aria-hidden="true" />
            Waseda Study Hub
          </Link>
          <div className="nav-links">
            {links.slice(1).map(([href, label]) => (
              <Link key={href} href={href}>
                {label}
              </Link>
            ))}
          </div>
          <Link href="/profile" className="secondary">
            {user?.displayName ?? "Profile"}
          </Link>
          {user && (
            <button
              className="text-button"
              onClick={async () => {
                await signOut();
                router.replace("/sign-in");
              }}
            >
              Sign out
            </button>
          )}
        </nav>
      </header>
      <main className="shell">{children}</main>
      <nav className="mobile-nav" aria-label="Mobile primary">
        {links.map(([href, label]) => (
          <Link key={href} href={href}>
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
