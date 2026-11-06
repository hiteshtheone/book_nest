"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/actions";

type Viewer = { name: string } | null;

const signedOut = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/sign-in", label: "Sign in" },
  { href: "/sign-up", label: "Sign up" },
];

const signedIn = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/pair", label: "Pair" },
  { href: "/reading-log", label: "Reading log" },
];

export function Header({ user }: { user: Viewer }) {
  const pathname = usePathname();
  const links = user ? signedIn : signedOut;

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="brand">
          <span className="logo" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path
                d="M12 6.2c-1.2-1-2.6-1.6-4.4-1.7H4.5V17c1.8.1 3.3.7 4.5 1.7"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
              <path
                d="M12 6.2c1.2-1 2.6-1.6 4.4-1.7h3.1V17c-1.8.1-3.3.7-4.5 1.7"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
              <path d="M12 6.2V18.7" fill="none" stroke="currentColor" strokeWidth="1.7" />
            </svg>
          </span>
          Jade Book Nest
        </Link>
        <nav className="nav" aria-label="Pages">
          {links.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link key={link.href} href={link.href} className={active ? "active" : undefined} aria-current={active ? "page" : undefined}>
                {link.label}
              </Link>
            );
          })}
        </nav>
        {user ? (
          <div className="header-end">
            <span className="whoami">{user.name}</span>
            <form action={signOut}>
              <button className="sign-out" type="submit">
                Sign out
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </header>
  );
}
