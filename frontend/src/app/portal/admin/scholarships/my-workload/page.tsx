"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { formatDateTime } from "@/lib/utils";
import { Clock, AlertCircle } from "lucide-react";

interface AssignedApplication {
  id: string;
  cycle_id: string;
  cycle_name_ar: string;
  applicant_id: string;
  status: string;
  priority: string;
  sla_deadline: string | null;
  created_at: string;
}

export default function MyWorkloadDashboard() {
  const [applications, setApplications] = useState<AssignedApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAssignedApplications();
  }, []);

  async function fetchAssignedApplications() {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/scholarships/applications/assigned-to-me');
      setApplications(res.data || []);
    } catch (err) {
      console.error("Failed to load assigned applications", err);
    } finally {
      setIsLoading(false);
    }
  }

  // Priority helpers
  const priorityInfo: Record<string, { label: string, color: string }> = {
    critical: { label: 'حرجة', color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800' },
    urgent: { label: 'عاجلة', color: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800' },
    high: { label: 'مرتفعة', color: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800' },
    normal: { label: 'عادية', color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' },
    low: { label: 'منخفضة', color: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700' },
  };

  const getPriorityInfo = (p: string) => priorityInfo[p] || priorityInfo['normal'];

  // SLA helpers
  const isSlaBreached = (deadline: string | null) => {
    if (!deadline) return false;
    return new Date(deadline).getTime() < new Date().getTime();
  };

  const isSlaWarning = (deadline: string | null) => {
    if (!deadline) return false;
    const timeRemaining = new Date(deadline).getTime() - new Date().getTime();
    return timeRemaining > 0 && timeRemaining < 24 * 60 * 60 * 1000; // Less than 24 hours
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
            لوحة مهامي (My Workload)
          </h1>
          <p className="text-sm text-surface-500 mt-1">
            متابعة طلبات المنح المسندة إليك ومواعيد الإنجاز (SLA)
          </p>
        </div>
        <Link href="/portal/admin/scholarships" className="btn-outline">
          العودة لإدارة المنح
        </Link>
      </div>

      <div className="glass-card overflow-x-auto">
        <table className="w-full text-start text-sm">
          <thead className="bg-surface-50 dark:bg-surface-800/50 text-surface-500 border-b border-surface-200 dark:border-surface-700">
            <tr>
              <th className="px-6 py-4 font-medium">رقم الطلب</th>
              <th className="px-6 py-4 font-medium">الدورة</th>
              <th className="px-6 py-4 font-medium text-center">الأولوية</th>
              <th className="px-6 py-4 font-medium">الحالة</th>
              <th className="px-6 py-4 font-medium">تاريخ التقديم</th>
              <th className="px-6 py-4 font-medium text-center">SLA / موعد الإنجاز</th>
              <th className="px-6 py-4 font-medium text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-surface-500">
                  جاري التحميل...
                </td>
              </tr>
            ) : applications.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-surface-500">
                  لا توجد طلبات مسندة إليك حالياً
                </td>
              </tr>
            ) : (
              applications.map((app) => (
                <tr key={app.id} className="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-surface-900 dark:text-surface-100">
                    {app.id.slice(0, 8)}
                  </td>
                  <td className="px-6 py-4 font-medium text-surface-900 dark:text-surface-100">
                    {app.cycle_name_ar || 'غير معروف'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityInfo(app.priority).color}`}>
                      {getPriorityInfo(app.priority).label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="capitalize badge badge-neutral">
                      {app.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-surface-500 text-xs" dir="ltr">
                    {formatDateTime(app.created_at)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {app.sla_deadline ? (
                      <div className="flex items-center justify-center gap-2">
                        {isSlaBreached(app.sla_deadline) ? (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        ) : isSlaWarning(app.sla_deadline) ? (
                          <Clock className="w-4 h-4 text-orange-500" />
                        ) : null}
                        <span dir="ltr" className={`text-xs font-medium ${
                          isSlaBreached(app.sla_deadline) ? 'text-red-600 dark:text-red-400 font-bold' : 
                          isSlaWarning(app.sla_deadline) ? 'text-orange-600 dark:text-orange-400' : 'text-surface-600 dark:text-surface-400'
                        }`}>
                          {formatDateTime(app.sla_deadline)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-surface-400 text-xs">غير محدد</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Link 
                      href={`/portal/admin/scholarships/applications/${app.id}`} 
                      className="btn-outline px-3 py-1 text-xs"
                    >
                      معالجة الطلب
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
