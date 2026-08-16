import { Suspense } from "react";
import AdminLogin from "./AdminLogin";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F7F5F2] flex items-center justify-center p-6"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone">Loading sign in…</p></div>}>
      <AdminLogin />
    </Suspense>
  );
}
