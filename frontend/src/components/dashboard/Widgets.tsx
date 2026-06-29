import { DashboardAction } from "@/hooks/useDashboard";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { 
  PlusIcon, 
  UserPlusIcon, 
  DocumentTextIcon, 
  BoltIcon 
} from "@heroicons/react/24/outline";
import Link from "next/link";

export function ActivityFeed({ activities }: { activities: DashboardAction[] }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="glass-card p-6 h-full flex flex-col items-center justify-center text-center">
        <BoltIcon className="w-10 h-10 text-surface-300 mb-2" />
        <p className="text-surface-500 text-sm">لا يوجد نشاط حديث.</p>
      </div>
    );
  }

  return (
    <div className="glass-card h-full flex flex-col">
      <div className="p-5 border-b border-surface-200 dark:border-surface-800">
        <h3 className="font-bold text-surface-900 dark:text-surface-50 flex items-center gap-2">
          <BoltIcon className="w-5 h-5 text-primary-500" />
          النشاطات الأخيرة
        </h3>
      </div>
      <div className="p-5 flex-1 overflow-y-auto">
        <div className="relative border-l-2 border-surface-200 dark:border-surface-700 mr-3 ml-3 space-y-6">
          {activities.map((activity) => (
            <div key={activity.id} className="relative pl-6 -ml-[9px] rtl:pr-6 rtl:pl-0 rtl:-mr-[9px] rtl:ml-0">
              <span className="absolute top-1 left-0 rtl:right-0 w-4 h-4 rounded-full bg-primary-100 border-2 border-primary-500"></span>
              <p className="text-sm text-surface-900 dark:text-surface-100 font-medium">
                {activity.description}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                  {activity.module === "scholarship" ? "المنح" : activity.module === "innovation" ? "الابتكار" : "النظام"}
                </span>
                <span className="text-xs text-surface-500">
                  {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: ar })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function QuickActions({ roles }: { roles: string[] }) {
  const isAdmin = roles.includes("super_admin") || roles.includes("admin");
  const isInnovation = roles.includes("innovation_manager") || isAdmin;
  const isScholarship = roles.includes("scholarship_manager") || isAdmin;

  return (
    <div className="glass-card p-5">
      <h3 className="font-bold text-surface-900 dark:text-surface-50 mb-4">إجراءات سريعة</h3>
      <div className="grid grid-cols-2 gap-3">
        {isScholarship && (
          <Link href="/portal/admin/scholarships/create" className="flex items-center gap-2 p-3 rounded-xl bg-surface-50 dark:bg-surface-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-sm font-medium transition-colors border border-transparent hover:border-primary-100">
            <PlusIcon className="w-5 h-5 text-primary-500" />
            إنشاء دورة منح
          </Link>
        )}
        {isInnovation && (
          <Link href="/portal/admin/innovation/create" className="flex items-center gap-2 p-3 rounded-xl bg-surface-50 dark:bg-surface-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-sm font-medium transition-colors border border-transparent hover:border-primary-100">
            <PlusIcon className="w-5 h-5 text-primary-500" />
            إطلاق مسابقة ابتكار
          </Link>
        )}
        {isAdmin && (
          <Link href="/portal/admin/users/create" className="flex items-center gap-2 p-3 rounded-xl bg-surface-50 dark:bg-surface-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-sm font-medium transition-colors border border-transparent hover:border-primary-100">
            <UserPlusIcon className="w-5 h-5 text-primary-500" />
            إضافة مستخدم
          </Link>
        )}
        <Link href="/portal/reports" className="flex items-center gap-2 p-3 rounded-xl bg-surface-50 dark:bg-surface-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-sm font-medium transition-colors border border-transparent hover:border-primary-100">
          <DocumentTextIcon className="w-5 h-5 text-primary-500" />
          توليد تقرير
        </Link>
      </div>
    </div>
  );
}
