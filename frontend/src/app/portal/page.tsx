"use client";

import { useAuth } from "@/providers/auth-provider";
import { useDashboard } from "@/hooks/useDashboard";
import { PersonalCommandCenter } from "@/components/dashboard/PersonalCommandCenter";
import { MyWorkPanel } from "@/components/dashboard/MyWorkPanel";
import { SmartAlertsPanel } from "@/components/dashboard/SmartAlertsPanel";
import { SummaryCenters } from "@/components/dashboard/Centers";
import { ActivityFeed, QuickActions } from "@/components/dashboard/Widgets";

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-48 bg-surface-200 dark:bg-surface-800 rounded-2xl w-full"></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-96 bg-surface-200 dark:bg-surface-800 rounded-2xl w-full"></div>
        <div className="h-96 bg-surface-200 dark:bg-surface-800 rounded-2xl w-full"></div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, hasAnyRole } = useAuth();
  const { data, isLoading } = useDashboard();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Fallback to empty if no data (e.g., student with no data yet, or an error)
  if (!data) {
    return (
      <div className="space-y-6">
        <div className="glass-card p-6 text-center text-surface-500 py-12">
          <p>لا يمكن تحميل بيانات لوحة التحكم في الوقت الحالي.</p>
        </div>
      </div>
    );
  }

  const roleNames = user?.roles?.map((r) => r.name) || [];

  return (
    <div className="space-y-6 pb-12 animate-fade-in" dir="rtl">
      {/* 1. Personal Command Center (Top row) */}
      <PersonalCommandCenter data={data} />

      {/* 2. Middle Row: My Work & Smart Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MyWorkPanel work={data.my_work} />
        </div>
        <div>
          <SmartAlertsPanel alerts={data.alerts} />
        </div>
      </div>

      {/* 3. Summary Centers (Scholarships, Innovation, Finance) */}
      {data.summary && (
        <SummaryCenters summary={data.summary} health={data.health} />
      )}

      {/* 4. Bottom Row: Activity Feed & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActivityFeed activities={data.activities} />
        </div>
        <div>
          <QuickActions roles={roleNames} />
        </div>
      </div>
    </div>
  );
}
