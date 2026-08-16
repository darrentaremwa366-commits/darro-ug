"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

const navLinks = [
  { label: "Dashboard", href: "/admin/overview" },
  { label: "Products", href: "/admin/products" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Conversations", href: "/admin/conversations" },
  { label: "Customers", href: "/admin/customers" },
  { label: "Marketing", href: "/admin/marketing" },
  { label: "Analytics", href: "/admin/analytics" },
  { label: "Simulator →", href: "/simulator" },
  { label: "← View Site", href: "/" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-[var(--color-sand)] bg-[var(--background)] py-3 px-4"
        aria-label="Open admin navigation"
      >
        {navLinks.slice(0, 5).map((link) => {
          const active = isActive(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-1 ${
                active ? "text-[var(--color-ink)]" : "text-[var(--color-stone)]"
              }`}
            >
              <span className="font-mono text-[9px] uppercase tracking-[0.18em]">
                {link.label.replace("← View Site", "Home")}
              </span>
            </Link>
          );
        })}
      </button>

      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 flex-col bg-[var(--color-bone)] border-r border-[var(--color-sand)] z-30">
        <div className="px-6 py-5 border-b border-[var(--color-sand)]">
          <Link href="/" className="flex flex-col items-start">
            <span
              className="text-2xl leading-none text-[var(--color-ink)]"
              style={{ fontFamily: "'Great Vibes', cursive" }}
            >
              Darro
            </span>
            <span className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-stone)]">
              Admin Console
            </span>
          </Link>
        </div>

        <nav className="flex-1 py-4 px-3">
          <ul className="flex flex-col gap-1">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`block font-mono text-[11px] uppercase tracking-[0.18em] px-4 py-3 transition-colors ${
                      active
                        ? "bg-[var(--color-ink)] text-white"
                        : "text-[var(--color-charcoal)] hover:bg-[var(--color-sand)]"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="px-6 py-4 border-t border-[var(--color-sand)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[var(--color-sand)] flex items-center justify-center">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--color-ink)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ink)]">
                Admin
              </span>
              <span className="font-mono text-[10px] text-[var(--color-stone)]">
                hello@darro.co
              </span>
            </div>
          </div>
        </div>
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-[var(--color-ink)]/50 lg:hidden"
              onClick={() => setMobileOpen(false)}
              aria-hidden
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 left-0 z-50 w-[85%] max-w-sm bg-[var(--color-bone)] shadow-xl lg:hidden overflow-y-auto"
              aria-label="Admin mobile navigation"
            >
              <div className="flex items-center justify-between px-5 py-5 border-b border-[var(--color-sand)]">
                <Link
                  href="/"
                  className="flex flex-col items-start"
                  onClick={() => setMobileOpen(false)}
                >
                  <span
                    className="text-2xl leading-none text-[var(--color-ink)]"
                    style={{ fontFamily: "'Great Vibes', cursive" }}
                  >
                    Darro
                  </span>
                  <span className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-stone)]">
                    Admin Console
                  </span>
                </Link>
                <button
                  type="button"
                  aria-label="Close navigation"
                  onClick={() => setMobileOpen(false)}
                  className="p-1"
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--color-ink)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <nav className="px-3 py-6">
                <ul className="flex flex-col gap-1">
                  {navLinks.map((link) => {
                    const active = isActive(link.href);
                    return (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          onClick={() => setMobileOpen(false)}
                          className={`block font-mono text-[11px] uppercase tracking-[0.18em] px-4 py-3 ${
                            active
                              ? "bg-[var(--color-ink)] text-white"
                              : "text-[var(--color-charcoal)] hover:bg-[var(--color-sand)]"
                          }`}
                        >
                          {link.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
