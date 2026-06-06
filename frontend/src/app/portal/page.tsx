"use client";

import { useAuth } from "@/providers/auth-provider";
import { cn } from "@/lib/utils";

function StatCard({
  label,
  value,
  change,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  change?: string;
  icon: React.ReactNode;
  color: "primary" | "secondary" | "accent" | "danger";
}) {
  const colorMap = {
    primary:
      "from-primary-500 to-primary-600 shadow-primary-500/20",
    secondary:
      "from-secondary-500 to-secondary-600 shadow-secondary-500/20",
    accent:
      "from-accent-500 to-accent-600 shadow-accent-500/20",
    danger:
      "from-red-500 to-red-600 shadow-red-500/20",
  };

  return (
    <div className="glass-card p-6 hover-lift">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-surface-500 dark:text-surface-400 mb-1">
            {label}
          </p>
          <p className="text-3xl font-bold text-surface-900 dark:text-surface-50">
            {value}
          </p>
          {change && (
            <p
              className={cn(
                "text-xs mt-2 font-medium",
                change.startsWith("+")
                  ? "text-emerald-600"
                  : "text-red-500"
              )}
            >
              {change} من الشهر الماضي
            </p>
          )}
        </div>
        <div
          className={cn(
            "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg",
            colorMap[color]
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, hasAnyRole } = useAuth();

  const isAdmin = hasAnyRole("super_admin", "admin");
  const isStudent = hasAnyRole("student");

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
          مرحباً، {user?.profile?.first_name_ar || user?.profile?.first_name_en || "مستخدم"} 👋
        </h1>
        <p className="text-surface-500 mt-1">
          إليك ملخص لوحة التحكم الخاصة بك
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {isAdmin && (
          <>
            <StatCard
              label="إجمالي الطلاب"
              value="2,847"
              change="+12%"
              color="primary"
              icon={
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                </svg>
              }
            />
            <StatCard
              label="طلبات المنح النشطة"
              value="543"
              change="+8%"
              color="secondary"
              icon={
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
              }
            />
            <StatCard
              label="نسبة إشغال السكن"
              value="87%"
              change="+3%"
              color="accent"
              icon={
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
                </svg>
              }
            />
            <StatCard
              label="إجمالي التبرعات"
              value="$125K"
              change="+22%"
              color="primary"
              icon={
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                </svg>
              }
            />
          </>
        )}

        {isStudent && (
          <>
            <StatCard
              label="طلباتي النشطة"
              value="2"
              color="primary"
              icon={
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
              }
            />
            <StatCard
              label="الإشعارات غير المقروءة"
              value="5"
              color="accent"
              icon={
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>
              }
            />
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-4">
          إجراءات سريعة
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {isStudent && (
            <>
              <QuickAction
                label="تقديم طلب منحة"
                href="/scholarships"
                color="primary"
              />
              <QuickAction
                label="تقديم طلب سكن"
                href="/housing"
                color="secondary"
              />
            </>
          )}
          {isAdmin && (
            <>
              <QuickAction
                label="إدارة المنح"
                href="/scholarships"
                color="primary"
              />
              <QuickAction
                label="إدارة السكن"
                href="/housing"
                color="secondary"
              />
              <QuickAction
                label="عرض التقارير"
                href="/reports"
                color="accent"
              />
              <QuickAction
                label="إدارة المستخدمين"
                href="/admin/users"
                color="danger"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  label,
  href,
  color,
}: {
  label: string;
  href: string;
  color: "primary" | "secondary" | "accent" | "danger";
}) {
  const colorMap = {
    primary: "border-primary-200 dark:border-primary-800 hover:bg-primary-50 dark:hover:bg-primary-950/30 text-primary-700 dark:text-primary-300",
    secondary: "border-secondary-200 dark:border-secondary-800 hover:bg-secondary-50 dark:hover:bg-secondary-950/30 text-secondary-700 dark:text-secondary-300",
    accent: "border-accent-200 dark:border-accent-800 hover:bg-accent-50 dark:hover:bg-accent-950/30 text-accent-700 dark:text-accent-300",
    danger: "border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-700 dark:text-red-300",
  };

  return (
    <a
      href={href}
      className={cn(
        "block p-4 rounded-xl border-2 border-dashed text-center text-sm font-medium transition-all duration-200",
        colorMap[color]
      )}
    >
      {label}
    </a>
  );
}
