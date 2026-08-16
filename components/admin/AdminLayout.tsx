"use client";

import { ReactNode } from "react";
import Sidebar from "./Sidebar";

interface AdminLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export default function AdminLayout({
  title,
  subtitle,
  children,
}: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar />
      <div className="lg:pl-64 pb-20 lg:pb-0">
        <div className="px-6 lg:px-10 py-8 max-w-[1400px] mx-auto">
          <header className="mb-8 pb-6 border-b border-[var(--color-sand)]">
            <h1 className="font-heading text-2xl lg:text-3xl uppercase tracking-[0.18em] text-[var(--color-ink)]">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 font-mono text-xs uppercase tracking-[0.12em] text-[var(--color-stone)]">
                {subtitle}
              </p>
            )}
          </header>
          {children}
        </div>
      </div>
    </div>
  );
}
