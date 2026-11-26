"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/lib/store";
import { useUI } from "@/lib/ui";
import brand from "@/data/brand.json";

const navLinks = [
  { label: "Shop", href: "/shop" },
  { label: "Darro Club", href: "/membership" },
];

type Offer = { text: string; href?: string };

export default function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const router = useRouter();
  const { totalQuantity } = useCart();
  const { openCart } = useUI();

  // Moving offer strip
  const offers = (brand.offers ?? []) as Offer[];

  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      setSearchOpen(false);
      setSearchValue("");
      router.push(`/shop?q=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  const stripText = offers.map((o) => o.text).join("   •   ");

  return (
    <header className="sticky top-0 z-40 w-full bg-[#F7F5F2] border-b border-[#E8E4DD]">
      {/* --- MOVING OFFER STRIP (scrolling left → right to left) --- */}
      <div className="w-full bg-[#0F0F0F] text-[#F7F5F2] overflow-hidden relative">
        <div className="relative whitespace-nowrap overflow-hidden">
          <div className="banner-track inline-flex whitespace-nowrap">
            <span className="inline-block py-2 px-8 font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.18em] flex-shrink-0">
              ● {stripText}
            </span>
            <span className="inline-block py-2 px-8 font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.18em] flex-shrink-0" aria-hidden>
              ● {stripText}
            </span>
          </div>
        </div>
        <style jsx global>{`
          @keyframes bannerScroll {
            from { transform: translateX(0); }
            to   { transform: translateX(-50%); }
          }
          .banner-track {
            animation: bannerScroll 40s linear infinite;
            display: inline-flex;
            width: max-content;
          }
        `}</style>
      </div>

      {/* Search overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full border-b border-[#E8E4DD] bg-[#F7F5F2]"
          >
            <form onSubmit={handleSearch} className="mx-auto max-w-4xl px-4 py-5 flex gap-3">
              <div className="relative flex-1">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8A8680" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.3-4.3" />
                </svg>
                <input type="text" autoFocus value={searchValue} onChange={(e) => setSearchValue(e.target.value)} placeholder="Search t-shirts — Black, Gray, White..." className="w-full pl-12 pr-4 py-3.5 bg-[#F0EDE8] border border-[#E8E4DD] text-sm placeholder:text-[#8A8680] focus:outline-none focus:border-[#1A1A1A]" />
              </div>
              <button type="button" onClick={() => { setSearchOpen(false); setSearchValue(""); }} className="px-4 py-3.5 border border-[#E8E4DD] bg-transparent hover:bg-[#E8E4DD] transition-colors" aria-label="Close search">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-3 items-center py-4">
          <div className="flex items-center justify-start gap-2">
            <button type="button" aria-label="Open menu" onClick={() => setDrawerOpen(true)} className="md:hidden inline-flex items-center gap-2">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0F0F0F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
              <span className="font-heading text-[11px] uppercase tracking-[0.18em] text-[#0F0F0F]">Menu</span>
            </button>
          </div>

          <Link href="/" className="flex flex-col items-center justify-center justify-self-center" aria-label="Darro home">
            <span className="text-3xl leading-none text-[#0F0F0F]" style={{ fontFamily: "'Great Vibes', cursive" }}>
              Darro
            </span>
            <span className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.22em] text-[#8A8680]">
              World of a Builder
            </span>
          </Link>

          <div className="flex items-center justify-end gap-4">
            <button type="button" aria-label="Search t-shirts" onClick={() => setSearchOpen((s) => !s)} className="p-1 hover:opacity-70 transition-opacity" title="Search t-shirts">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F0F0F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
            </button>
            <button type="button" aria-label="Open cart" onClick={openCart} className="relative p-1 hover:opacity-70 transition-opacity" title="Cart">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F0F0F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 01-8 0" /></svg>
              {totalQuantity > 0 && (
                <span className="absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#A63D2F] px-1 font-mono text-[9px] font-medium text-white">
                  {totalQuantity > 99 ? "99+" : totalQuantity}
                </span>
              )}
            </button>
          </div>
        </div>

        <nav className="hidden md:flex items-center justify-center py-3 border-t border-[#E8E4DD]">
          <ul className="flex items-center gap-10">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="font-heading text-xs uppercase tracking-[0.18em] text-[#0F0F0F] hover:text-[#A63D2F] transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-[#0F0F0F]/50 md:hidden" onClick={() => setDrawerOpen(false)} aria-hidden />
            <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "tween", duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 left-0 z-50 w-[85%] max-w-sm bg-[#F7F5F2] shadow-xl md:hidden overflow-y-auto" aria-label="Mobile menu">
              <div className="flex items-center justify-between px-5 py-5 border-b border-[#E8E4DD]">
                <Link href="/" className="flex flex-col items-start" onClick={() => setDrawerOpen(false)}>
                  <span className="text-2xl leading-none text-[#0F0F0F]" style={{ fontFamily: "'Great Vibes', cursive" }}>Darro</span>
                  <span className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.22em] text-[#8A8680]">World of a Builder</span>
                </Link>
                <button type="button" aria-label="Close menu" onClick={() => setDrawerOpen(false)} className="p-1">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0F0F0F" strokeWidth="1.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </div>
              <nav className="px-5 py-6">
                <ul className="flex flex-col gap-1">
                  {navLinks.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} onClick={() => setDrawerOpen(false)}
                        className="block py-3 font-heading text-sm uppercase tracking-[0.18em] text-[#0F0F0F] border-b border-[#E8E4DD]/70">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                  <li className="pt-4 mt-2 border-t border-[#E8E4DD]">
                    <Link href="/cart" onClick={() => setDrawerOpen(false)}
                      className="flex items-center justify-between py-3 font-heading text-sm uppercase tracking-[0.18em] text-[#0F0F0F]">
                      <span>Cart</span>
                      {totalQuantity > 0 && (
                        <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#A63D2F] px-1.5 font-mono text-[10px] font-medium text-white">{totalQuantity}</span>
                      )}
                    </Link>
                  </li>
                </ul>
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
