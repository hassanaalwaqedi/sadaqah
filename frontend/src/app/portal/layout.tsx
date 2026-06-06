"use client";

import { useAuth } from "@/providers/auth-provider";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import Image from "next/image";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    if (!isLoading && isAuthenticated && user) {
      if (!user.profile_completed && pathname !== "/portal/onboarding") {
        router.push("/portal/onboarding");
      }
    }
  }, [isAuthenticated, isLoading, user, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-surface-950">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16 animate-pulse">
            <Image src="/brand/logo.png" alt="Loading..." fill className="object-contain" priority />
          </div>
          <p className="text-sm text-surface-400">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
      <Sidebar />
      <div className="ps-64">
        <Topbar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
