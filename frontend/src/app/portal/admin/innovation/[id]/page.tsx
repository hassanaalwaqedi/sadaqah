"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";
import { ChevronRight, FileText, User } from "lucide-react";

type ProjectSubmission = {
  id: string;
  category_id: string;
  submitter_id: string;
  title: string;
  abstract: string;
  status: string;
  created_at: string;
};

type InnovationEvent = {
  id: string;
  name_en: string;
  name_ar: string;
  status: string;
  submission_deadline: string;
};

export default function AdminCompetitionDetails() {
  const params = useParams();
  const eventId = params.id as string;
  
  const [event, setEvent] = useState<InnovationEvent | null>(null);
  const [applications, setApplications] = useState<ProjectSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [eventRes, appsRes] = await Promise.all([
          apiClient.get<InnovationEvent>(`/innovation/events/${eventId}`),
          apiClient.get<ProjectSubmission[]>(`/innovation/events/${eventId}/applications`)
        ]);
        setEvent(eventRes.data);
        setApplications(appsRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [eventId]);

  if (isLoading) return <div className="p-8 text-center">جاري التحميل...</div>;
  if (!event) return <div className="p-8 text-center">لم يتم العثور على المسابقة</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-2 text-sm text-surface-500 mb-4">
        <Link href="/portal/admin/innovation" className="hover:text-primary-600">
          مسابقات الابتكار
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-surface-900 dark:text-surface-100">{event.name_ar}</span>
      </div>

      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold gradient-text">{event.name_ar}</h1>
          <p className="text-surface-600 dark:text-surface-400 mt-1">
            إدارة طلبات المشاركة للمسابقة
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="text-surface-500 text-sm mb-1">إجمالي الطلبات</div>
          <div className="text-2xl font-bold text-primary-600">{applications.length}</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-surface-500 text-sm mb-1">الطلبات الجديدة</div>
          <div className="text-2xl font-bold text-amber-500">
            {applications.filter(a => a.status === 'submitted').length}
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="text-surface-500 text-sm mb-1">قيد التحكيم</div>
          <div className="text-2xl font-bold text-blue-500">
            {applications.filter(a => a.status === 'under_judging').length}
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="text-surface-500 text-sm mb-1">المقبولين</div>
          <div className="text-2xl font-bold text-green-500">
            {applications.filter(a => a.status === 'accepted').length}
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="glass-card overflow-hidden">
        <table className="w-full text-right text-sm">
          <thead className="bg-surface-50 dark:bg-surface-800/50 text-surface-600 dark:text-surface-400 border-b">
            <tr>
              <th className="px-6 py-4 font-medium">عنوان المشروع</th>
              <th className="px-6 py-4 font-medium">مقدم الطلب</th>
              <th className="px-6 py-4 font-medium">الحالة</th>
              <th className="px-6 py-4 font-medium">تاريخ التقديم</th>
              <th className="px-6 py-4 font-medium text-left">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
            {applications.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-surface-500">لا توجد طلبات مشاركة حتى الآن.</td>
              </tr>
            ) : applications.map((app) => (
              <tr key={app.id} className="hover:bg-surface-50 dark:hover:bg-surface-800/20 transition-colors">
                <td className="px-6 py-4 font-medium flex items-center gap-3">
                  <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg text-primary-600 dark:text-primary-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  {app.title}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-surface-400" />
                    <span>{app.submitter_id.slice(0, 8)}...</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`badge ${
                    ['accepted', 'winner'].includes(app.status) ? 'badge-success' : 
                    ['rejected'].includes(app.status) ? 'badge-error' :
                    ['submitted'].includes(app.status) ? 'badge-warning' : 'badge-neutral'
                  } capitalize`}>
                    {app.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-surface-500">{formatDateTime(app.created_at)}</td>
                <td className="px-6 py-4 text-left">
                  <Link 
                    href={`/portal/admin/innovation/applications/${app.id}`}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    عرض التفاصيل
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
