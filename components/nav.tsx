"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/today", label: "Today" },
  { href: "/week", label: "Week" },
  { href: "/month", label: "Month" },
  { href: "/year", label: "Year" },
  { href: "/review/history", label: "Reviews" },
]

export function Nav() {
  const path = usePathname()

  return (
    <nav
      style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        gap: "4px",
        height: "48px",
      }}
    >
      <Link href="/dashboard" style={{ fontWeight: 600, color: "var(--text)", marginRight: "16px", fontSize: "15px" }}>
        Goals
      </Link>
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          style={{
            padding: "4px 10px",
            borderRadius: "6px",
            fontSize: "13px",
            color: path.startsWith(l.href) ? "var(--text)" : "var(--text-muted)",
            background: path.startsWith(l.href) ? "var(--surface-2)" : "transparent",
            fontWeight: path.startsWith(l.href) ? 500 : 400,
          }}
        >
          {l.label}
        </Link>
      ))}
      <div style={{ marginLeft: "auto", display: "flex", gap: "8px", alignItems: "center" }}>
        <Link
          href="/settings"
          style={{ padding: "4px 10px", borderRadius: "6px", fontSize: "13px", color: path === "/settings" ? "var(--text)" : "var(--text-muted)" }}
        >
          Settings
        </Link>
        <Link
          href="/goals/new"
          style={{ padding: "5px 12px", borderRadius: "6px", background: "var(--accent)", color: "#fff", fontSize: "13px", fontWeight: 500 }}
        >
          + New goal
        </Link>
      </div>
    </nav>
  )
}
