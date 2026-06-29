"use client";

import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";
import { NotificationDropdown } from "./notification-dropdown";

export function Topbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-surface-900/80 backdrop-blur-xl border-b border-surface-200 dark:border-surface-700 flex items-center justify-between px-6">
      {/* Left: Breadcrumb / Title */}
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
          لوحة التحكم
        </h1>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Notifications Bell */}
        <NotificationDropdown />

        {/* Language Toggle */}
        <button
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors border border-surface-200 dark:border-surface-700"
          title="Switch language"
        >
          EN
        </button>

        {/* User Menu */}
        <div className="flex items-center gap-3 ps-3 border-s border-surface-200 dark:border-surface-700">
          <div className="text-end">
            <p className="text-sm font-medium text-surface-900 dark:text-surface-50">
              {user?.profile?.first_name_ar || user?.profile?.first_name_en || "User"}
            </p>
            <p className="text-xs text-surface-400">
              {user?.roles?.[0]?.display_name_ar || "مستخدم"}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-surface-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            title="تسجيل الخروج"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
