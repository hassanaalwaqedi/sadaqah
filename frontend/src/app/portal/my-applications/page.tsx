"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { formatDateTime } from "@/lib/utils";

interface ScholarshipApplication {
  id: string;
  cycle_id: string;
  status: string;
  submitted_at: string;
  cycle_name_ar: string;
  cycle_name_en: string;
}

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState<ScholarshipApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await apiClient.get("/scholarships/applications/my");
        setApplications(res.data || []);
      } catch (error) {
        console.error("Failed to fetch applications", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchApplications();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <span className="badge bg-surface-500/20 text-surface-400 border-surface-500/30">مسودة</span>;
      case "submitted":
        return <span className="badge bg-info-500/20 text-info-400 border-info-500/30">مقدم (قيد المراجعة)</span>;
      case "accepted":
        return <span className="badge bg-success-500/20 text-success-400 border-success-500/30">مقبول</span>;
      case "rejected":
        return <span className="badge bg-danger-500/20 text-danger-400 border-danger-500/30">مرفوض</span>;
      default:
        return <span className="badge bg-surface-500/20 text-surface-400 border-surface-500/30">{status}</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">طلباتي</h1>
          <p className="text-sm text-surface-500 mt-1">
            متابعة حالة طلبات التقديم الخاصة بك للمنح الدراسية.
          </p>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="py-20 text-center glass-card flex flex-col items-center justify-center">
          <div className="w-20 h-20 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-surface-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100 mb-2">
            لم تقم بتقديم أي طلبات بعد
          </h3>
          <p className="text-surface-500 max-w-sm">
            تصفح المنح الدراسية المتاحة وقدم طلبك الآن.
          </p>
          <Link href="/portal/scholarships" className="mt-6 btn-primary">
            تصفح المنح المتاحة
          </Link>
        </div>
      ) : (
        <div className="bg-surface-50 dark:bg-surface-900 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 text-sm">
                <tr>
                  <th className="px-6 py-4 font-semibold">اسم المنحة</th>
                  <th className="px-6 py-4 font-semibold">تاريخ التقديم</th>
                  <th className="px-6 py-4 font-semibold">حالة الطلب</th>
                  <th className="px-6 py-4 font-semibold text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200 dark:divide-surface-800">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-surface-100/50 dark:hover:bg-surface-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-surface-900 dark:text-surface-100">
                        {app.cycle_name_ar || app.cycle_name_en || "منحة بدون اسم"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-surface-600 dark:text-surface-400">
                      {app.submitted_at ? formatDateTime(app.submitted_at) : "-"}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(app.status)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Link 
                        href={app.status === 'draft' ? `/portal/scholarships/${app.cycle_id}/apply` : `/portal/scholarships/my-applications/${app.id}`}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        {app.status === 'draft' ? 'إكمال التقديم' : 'متابعة الطلب'}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
