import { DashboardAlert } from "@/hooks/useDashboard";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import Link from "next/link";
import { BellAlertIcon, ExclamationTriangleIcon, InformationCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";

export function SmartAlertsPanel({ alerts }: { alerts: DashboardAlert[] }) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="glass-card p-6 flex flex-col items-center justify-center text-center py-8 h-full">
        <BellAlertIcon className="w-12 h-12 text-surface-300 mb-3" />
        <h3 className="text-base font-bold text-surface-900 dark:text-surface-50 mb-1">لا يوجد تنبيهات</h3>
        <p className="text-surface-500 text-sm">
          جميع الأنظمة تعمل بشكل طبيعي ولا يوجد شيء عاجل.
        </p>
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "danger": return <XCircleIcon className="w-6 h-6 text-red-500" />;
      case "warning": return <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500" />;
      case "info":
      default: return <InformationCircleIcon className="w-6 h-6 text-blue-500" />;
    }
  };

  const getBg = (type: string) => {
    switch (type) {
      case "danger": return "bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500";
      case "warning": return "bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-500";
      case "info":
      default: return "bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500";
    }
  };

  return (
    <div className="glass-card h-full flex flex-col">
      <div className="p-5 border-b border-surface-200 dark:border-surface-800 flex items-center gap-2">
        <BellAlertIcon className="w-6 h-6 text-surface-600" />
        <h3 className="font-bold text-surface-900 dark:text-surface-50">تنبيهات ذكية</h3>
      </div>
      <div className="p-4 flex-1 overflow-y-auto space-y-3">
        {alerts.map((alert) => (
          <div key={alert.id} className={`p-4 rounded-lg flex gap-4 ${getBg(alert.type)}`}>
            <div className="shrink-0 mt-0.5">
              {getIcon(alert.type)}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-surface-900 dark:text-white text-sm">
                {alert.action_url ? (
                  <Link href={alert.action_url} className="hover:underline">{alert.title}</Link>
                ) : (
                  alert.title
                )}
              </h4>
              <p className="text-surface-600 dark:text-surface-300 text-sm mt-1">{alert.message}</p>
              <div className="text-xs text-surface-400 mt-2">
                {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: ar })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
