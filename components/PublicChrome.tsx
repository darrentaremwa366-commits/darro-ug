"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingWhatsAppWidget from "@/components/FloatingWhatsAppWidget";

/**
 * Wraps the public-facing shop chrome (Navbar / Footer / WhatsApp widget)
 * and hides it entirely for admin routes (/admin/*, /simulator).
 *
 * This keeps the root layout simple and ensures admin pages have only the
 * AdminLayout sidebar chrome, without duplicated shop menu bars or the
 * WhatsApp invite bubble distracting the console user.
 */
export default function PublicChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const isAdminRoute =
    pathname.startsWith("/admin") ||
    pathname === "/simulator";

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <FloatingWhatsAppWidget />
    </>
  );
}
