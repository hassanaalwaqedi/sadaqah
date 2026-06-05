"use client";

import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";

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
        <button
          className="relative p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          title="الإشعارات"
        >
          <svg
            className="w-5 h-5 text-surface-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
            />
          </svg>
          {/* Unread indicator */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

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
