"use client";

import { useState, useEffect } from "react";
import { FileText, Trophy, Clock, ChevronLeft } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";

type ProjectSubmission = {
  id: string;
  category_id: string;
  submitter_id: string;
  title: string;
  abstract: string;
  status: string;
  created_at: string;
};

export default function MyApplications() {
  const [applications, setApplications] = useState<ProjectSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await apiClient.get<ProjectSubmission[]>("/innovation/projects/my");
        setApplications(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  if (isLoading) {
    return <div className="p-8 text-center">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold gradient-text">طلباتي</h1>
        <p className="text-surface-600 dark:text-surface-400 mt-1">
          متابعة حالة طلبات المشاركة في مسابقات الابتكار
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {applications.length === 0 ? (
          <div className="col-span-full p-12 text-center glass-card">
            <Trophy className="w-12 h-12 text-surface-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-surface-700">لا توجد طلبات</h3>
            <p className="text-surface-500 mb-6">لم تقم بالتقديم على أي مسابقة حتى الآن.</p>
            <Link href="/portal/innovation" className="btn-gradient px-6 py-2">
              استكشف المسابقات المتاحة
            </Link>
          </div>
        ) : (
          applications.map((app) => (
            <Link 
              key={app.id}
              href={`/portal/innovation/my-applications/${app.id}`}
              className="glass-card p-6 block hover:border-primary-500 transition-colors group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-xl text-primary-600 dark:text-primary-400">
                  <FileText className="w-6 h-6" />
                </div>
                <span className={`badge ${
                  ['accepted', 'winner'].includes(app.status) ? 'badge-success' : 
                  ['rejected'].includes(app.status) ? 'badge-error' :
                  ['submitted'].includes(app.status) ? 'badge-warning' : 'badge-neutral'
                } capitalize`}>
                  {app.status}
                </span>
              </div>
              
              <h3 className="text-lg font-bold mb-2 group-hover:text-primary-600 transition-colors">
                {app.title}
              </h3>
              
              <div className="flex items-center gap-2 text-sm text-surface-500 mt-4">
                <Clock className="w-4 h-4" />
                <span>تم التقديم: {formatDateTime(app.created_at)}</span>
              </div>
              
              <div className="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700 flex items-center justify-between text-primary-600 font-medium text-sm">
                <span>تتبع الطلب</span>
                <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
