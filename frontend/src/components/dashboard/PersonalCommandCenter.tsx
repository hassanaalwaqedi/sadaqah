import { useAuth } from "@/providers/auth-provider";
import { DashboardData } from "@/hooks/useDashboard";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import Link from "next/link";
import { 
  ClipboardDocumentCheckIcon, 
  BellAlertIcon, 
  ClockIcon 
} from "@heroicons/react/24/outline";

export function PersonalCommandCenter({ data }: { data: DashboardData }) {
  const { user } = useAuth();
  
  const pendingTasksCount = data.my_work?.pending_tasks?.length || 0;
  const assignedCasesCount = data.my_work?.assigned_cases?.length || 0;
  const unreadAlertsCount = data.alerts?.length || 0;

  return (
    <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute -right-20 -top-20 opacity-10">
        <svg viewBox="0 0 200 200" className="w-64 h-64">
          <path fill="#FFFFFF" d="M42.7,-73.4C56.1,-65.4,68.2,-55.1,78.2,-42.6C88.2,-30.1,96.1,-15.1,96.5,0.2C96.9,15.5,89.8,31,80.1,44.2C70.4,57.4,58.1,68.3,44.3,75.1C30.5,81.9,15.3,84.6,0.3,84.1C-14.7,83.6,-29.3,79.9,-42.6,72.7C-55.9,65.5,-67.9,54.8,-76.3,41.6C-84.7,28.4,-89.5,14.2,-89.8,-0.2C-90.1,-14.6,-85.9,-29.2,-77.3,-41.8C-68.7,-54.4,-55.7,-65,-41.9,-72.7C-28.1,-80.4,-14,-85.2,0.5,-86C15,-86.8,30,-83.6,42.7,-73.4Z" transform="translate(100 100)" />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2">
            مرحباً بك، {user?.profile?.first_name_ar || user?.profile?.first_name_en || "مستخدم"} 👋
          </h2>
          <p className="text-primary-100 mb-4">
            {format(new Date(), "EEEE، d MMMM yyyy", { locale: ar })}
          </p>
          <div className="flex gap-4">
            <div className="bg-white/20 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/20 flex items-center gap-2">
              <ClipboardDocumentCheckIcon className="w-5 h-5 text-primary-100" />
              <span><strong className="text-xl">{pendingTasksCount + assignedCasesCount}</strong> مهام جارية</span>
            </div>
            <div className="bg-white/20 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/20 flex items-center gap-2">
              <BellAlertIcon className="w-5 h-5 text-yellow-300" />
              <span><strong className="text-xl">{unreadAlertsCount}</strong> تنبيهات جديدة</span>
            </div>
          </div>
        </div>

        <div className="bg-white/10 rounded-xl p-5 backdrop-blur-md border border-white/10 max-w-sm w-full">
          <h3 className="font-semibold text-lg flex items-center gap-2 mb-3">
            <ClockIcon className="w-5 h-5" />
            إجراءات عاجلة
          </h3>
          {(data.alerts?.length || 0) > 0 ? (
            <ul className="space-y-2">
              {data.alerts.slice(0, 2).map((alert) => (
                <li key={alert.id} className="text-sm bg-black/20 p-2 rounded-lg truncate flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-400 shrink-0"></span>
                  {alert.message}
                </li>
              ))}
              {data.alerts.length > 2 && (
                <li className="text-xs text-primary-200 mt-2 text-center">
                  + {data.alerts.length - 2} تنبيهات أخرى
                </li>
              )}
            </ul>
          ) : (
            <div className="text-center text-primary-200 text-sm py-2">
              لا توجد إجراءات عاجلة تتطلب انتباهك.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
