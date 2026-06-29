"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";
import { ChevronRight, FileText, User, LayoutGrid, List } from "lucide-react";

type ScholarshipApplication = {
  id: string;
  cycle_id: string;
  applicant_id: string;
  status: string;
  priority: string;
  assigned_to: string | null;
  created_at: string;
};

type ScholarshipCycle = {
  id: string;
  name_en: string;
  name_ar: string;
  status: string;
  application_deadline: string;
};

export default function AdminScholarshipApplications() {
  const params = useParams();
  const cycleId = params.id as string;
  
  const [cycle, setCycle] = useState<ScholarshipCycle | null>(null);
  const [applications, setApplications] = useState<ScholarshipApplication[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  useEffect(() => {
    async function loadData() {
      try {
        const [cycleRes, appsRes, staffRes] = await Promise.all([
          apiClient.get<ScholarshipCycle>(`/scholarships/cycles/${cycleId}`),
          apiClient.get<ScholarshipApplication[]>(`/scholarships/cycles/${cycleId}/applications`),
          apiClient.get('/admin/users')
        ]);
        setCycle(cycleRes.data);
        setApplications(appsRes.data || []);
        setStaff(staffRes.data?.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [cycleId]);

  const getStaffName = (id: string | null) => {
    if (!id) return "غير معين";
    const user = staff.find(u => u.id === id);
    return user ? `${user.first_name} ${user.last_name}` : id.slice(0, 8);
  };

  const priorityInfo: Record<string, { label: string, color: string }> = {
    critical: { label: 'حرجة', color: 'bg-red-100 text-red-800 border-red-200' },
    urgent: { label: 'عاجلة', color: 'bg-orange-100 text-orange-800 border-orange-200' },
    high: { label: 'مرتفعة', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    normal: { label: 'عادية', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    low: { label: 'منخفضة', color: 'bg-gray-100 text-gray-800 border-gray-200' },
  };
  const getPriority = (p: string) => priorityInfo[p] || priorityInfo['normal'];

  if (isLoading) return <div className="p-8 text-center">جاري التحميل...</div>;
  if (!cycle) return <div className="p-8 text-center">لم يتم العثور على دورة المنحة</div>;

  const statuses = ['submitted', 'under_review', 'missing_documents', 'approved', 'interview', 'awarded', 'rejected'];
  const statusLabels: Record<string, string> = {
    submitted: 'مقدم',
    under_review: 'قيد المراجعة',
    missing_documents: 'نواقص',
    approved: 'مقبول مبدئياً',
    interview: 'مقابلة',
    awarded: 'ممنوح',
    rejected: 'مرفوض'
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-2 text-sm text-surface-500 mb-4">
        <Link href="/portal/admin/scholarships" className="hover:text-primary-600">
          إدارة دورات المنح
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-surface-900 dark:text-surface-100">{cycle.name_ar}</span>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text">{cycle.name_ar}</h1>
          <p className="text-surface-600 dark:text-surface-400 mt-1">
            إدارة طلبات التقديم للمنحة وتوزيع المهام
          </p>
        </div>
        <div className="flex bg-surface-100 dark:bg-surface-800 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md flex items-center gap-2 text-sm transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-surface-700 shadow text-primary-600' : 'text-surface-600'}`}
          >
            <List className="w-4 h-4" /> قائمة
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`p-2 rounded-md flex items-center gap-2 text-sm transition-colors ${viewMode === 'kanban' ? 'bg-white dark:bg-surface-700 shadow text-primary-600' : 'text-surface-600'}`}
          >
            <LayoutGrid className="w-4 h-4" /> كانبان
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-right text-sm">
            <thead className="bg-surface-50 dark:bg-surface-800/50 text-surface-600 dark:text-surface-400 border-b">
              <tr>
                <th className="px-6 py-4 font-medium">رقم الطلب</th>
                <th className="px-6 py-4 font-medium">مقدم الطلب</th>
                <th className="px-6 py-4 font-medium">الحالة</th>
                <th className="px-6 py-4 font-medium">الأولوية</th>
                <th className="px-6 py-4 font-medium">المسؤول (Case Worker)</th>
                <th className="px-6 py-4 font-medium">تاريخ التقديم</th>
                <th className="px-6 py-4 font-medium text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-surface-500">لا توجد طلبات تقديم حتى الآن.</td>
                </tr>
              ) : applications.map((app) => (
                <tr key={app.id} className="hover:bg-surface-50 dark:hover:bg-surface-800/20 transition-colors">
                  <td className="px-6 py-4 font-medium flex items-center gap-3">
                    <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg text-primary-600 dark:text-primary-400">
                      <FileText className="w-4 h-4" />
                    </div>
                    {app.id.slice(0, 8)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-surface-400" />
                      <span>{app.applicant_id.slice(0, 8)}...</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="badge badge-neutral capitalize">{app.status}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriority(app.priority).color}`}>
                      {getPriority(app.priority).label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-surface-600">
                    {getStaffName(app.assigned_to)}
                  </td>
                  <td className="px-6 py-4 text-surface-500">{formatDateTime(app.created_at)}</td>
                  <td className="px-6 py-4 text-left">
                    <Link 
                      href={`/portal/admin/scholarships/applications/${app.id}`}
                      className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                    >
                      فتح الملف
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 px-1 min-h-[500px] snap-x">
          {statuses.map(status => {
            const columnApps = applications.filter(a => a.status === status);
            return (
              <div key={status} className="flex-none w-80 bg-surface-100 dark:bg-surface-800/50 rounded-xl p-4 flex flex-col max-h-[80vh] snap-center">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-surface-900 dark:text-surface-100">{statusLabels[status] || status}</h3>
                  <span className="bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-300 px-2 py-1 rounded-full text-xs font-bold">
                    {columnApps.length}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {columnApps.map(app => (
                    <Link 
                      href={`/portal/admin/scholarships/applications/${app.id}`}
                      key={app.id} 
                      className="block bg-white dark:bg-surface-800 p-4 rounded-lg shadow-sm border border-surface-200 dark:border-surface-700 hover:border-primary-300 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-mono text-xs text-surface-500">{app.id.slice(0, 8)}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${getPriority(app.priority).color}`}>
                          {getPriority(app.priority).label}
                        </span>
                      </div>
                      <div className="text-sm font-medium mb-3">مقدم: {app.applicant_id.slice(0, 8)}...</div>
                      <div className="flex items-center gap-2 text-xs text-surface-500 border-t border-surface-100 dark:border-surface-700 pt-2 mt-2">
                        <User className="w-3 h-3" />
                        {getStaffName(app.assigned_to)}
                      </div>
                    </Link>
                  ))}
                  {columnApps.length === 0 && (
                    <div className="text-center text-sm text-surface-400 py-8 border-2 border-dashed border-surface-200 dark:border-surface-700 rounded-lg">
                      فارغ
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
