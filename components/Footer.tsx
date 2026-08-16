"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import brand from "@/data/brand.json";

export default function Footer() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <footer className="bg-[#2C2C2C] text-[#F0EDE8] border-t border-[#E8E4DD]/30 mt-10">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="font-heading text-[#F0EDE8] tracking-[0.18em] text-xl">DARRO</span>
            </div>
            <p className="text-[#8A8680] text-sm leading-relaxed mb-4">
              The World of the Builder. Premium football jerseys for those who put in the work.
            </p>
            <p className="text-[#8A8680] text-xs">Kampala, Uganda</p>
          </div>

          <div>
            <h4 className="text-[#F0EDE8] text-xs font-heading tracking-[0.18em] mb-4 uppercase">Shop</h4>
            <ul className="space-y-2 text-sm text-[#8A8680]">
              <li><Link href="/shop" className="hover:text-[#E8E4DD] transition-colors">All Jerseys</Link></li>
              <li><Link href="/shop?collection=2026/27" className="hover:text-[#E8E4DD] transition-colors">2026/27 Collection</Link></li>
              <li><Link href="/shop?collection=World%20Cup" className="hover:text-[#E8E4DD] transition-colors">World Cup Jerseys</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[#F0EDE8] text-xs font-heading tracking-[0.18em] mb-4 uppercase">Darro</h4>
            <ul className="space-y-2 text-sm text-[#8A8680]">
              <li><Link href="/membership" className="hover:text-[#E8E4DD] transition-colors">Darro Club</Link></li>
              <li><Link href="/faq" className="hover:text-[#E8E4DD] transition-colors">FAQ</Link></li>
              <li><Link href="/cart" className="hover:text-[#E8E4DD] transition-colors">Cart</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[#F0EDE8] text-xs font-heading tracking-[0.18em] mb-4 uppercase">Search & Contact</h4>
            <form onSubmit={handleSearch} className="mb-4">
              <div className="flex border border-[#8A8680]/30">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search jerseys..."
                  className="flex-1 px-3 py-2 bg-transparent text-sm text-[#F0EDE8] placeholder:text-[#8A8680]/60 focus:outline-none"
                />
                <button
                  type="submit"
                  aria-label="Search"
                  className="px-3 bg-[#1A1A1A] hover:bg-[#0F0F0F] transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-[#F0EDE8]">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                </button>
              </div>
            </form>
            <ul className="space-y-2 text-sm text-[#8A8680]">
              <li>WhatsApp: {brand.contact.whatsapp}</li>
              <li>{brand.contact.email}</li>
              <li>{brand.contact.address}</li>
            </ul>
            <div className="flex gap-4 mt-4">
              <a href={brand.social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-[#8A8680] hover:text-[#E8E4DD] transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a href={`https://wa.me/${brand.contact.whatsapp}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="text-[#8A8680] hover:text-[#E8E4DD] transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M20.52 3.48A11.88 11.88 0 0012.04 0C5.46 0 .1 5.36.1 11.94c0 2.1.56 4.14 1.62 5.94L0 24l6.3-1.66a11.92 11.92 0 005.74 1.48h.01c6.58 0 11.94-5.36 11.94-11.94 0-3.18-1.24-6.17-3.47-8.4z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-[#8A8680]/30 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#8A8680]">
          <p>© 2026 Darro. All rights reserved. Quiet discipline. Earned belonging.</p>
          <p className="font-mono uppercase tracking-[0.18em]">The World of the Builder</p>
        </div>
      </div>
    </footer>
  );
}
