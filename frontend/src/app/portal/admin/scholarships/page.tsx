"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { formatDateTime } from "@/lib/utils";

interface ScholarshipCycle {
  id: string;
  name_en: string;
  name_ar: string;
  academic_year: string;
  application_start: string;
  application_deadline: string;
  total_quota: number;
  status: string;
  created_at: string;
}

interface PaginatedResponse {
  data: ScholarshipCycle[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export default function AdminScholarshipsPage() {
  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchCycles = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get("/scholarships/cycles", {
        params: { page, page_size: 10 },
      });
      setData(response.data);
    } catch (error) {
      console.error("Failed to fetch scholarship cycles", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCycles();
  }, [page]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
            إدارة دورات المنح
          </h1>
          <p className="text-sm text-surface-500 mt-1">
            إنشاء وإدارة دورات المنح الدراسية ومتابعة حالتها
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/portal/admin/scholarships/my-workload" className="btn-outline flex items-center gap-2">
            مهامي والطلبات المسندة إلي
          </Link>
          <Link href="/portal/admin/scholarships/create" className="btn-gradient">
            دورة منحة جديدة (Builder)
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-x-auto">
        <table className="w-full text-start text-sm">
          <thead className="bg-surface-50 dark:bg-surface-800/50 text-surface-500 border-b border-surface-200 dark:border-surface-700">
            <tr>
              <th className="px-6 py-4 font-medium">الاسم</th>
              <th className="px-6 py-4 font-medium">السنة الأكاديمية</th>
              <th className="px-6 py-4 font-medium">فترة التقديم</th>
              <th className="px-6 py-4 font-medium">الحصة (Quota)</th>
              <th className="px-6 py-4 font-medium text-center">الحالة</th>
              <th className="px-6 py-4 font-medium text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-surface-500">
                  جاري التحميل...
                </td>
              </tr>
            ) : data?.data?.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-surface-500">
                  لا توجد دورات منح حالياً
                </td>
              </tr>
            ) : (
              data?.data?.map((cycle) => (
                <tr key={cycle.id} className="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-surface-900 dark:text-surface-100">
                    {cycle.name_ar}
                  </td>
                  <td className="px-6 py-4 text-surface-600 dark:text-surface-400" dir="ltr">
                    {cycle.academic_year}
                  </td>
                  <td className="px-6 py-4 text-surface-500 text-xs">
                    <div>بدء: <span dir="ltr">{formatDateTime(cycle.application_start)}</span></div>
                    <div>انتهاء: <span dir="ltr">{formatDateTime(cycle.application_deadline)}</span></div>
                  </td>
                  <td className="px-6 py-4 text-surface-600 dark:text-surface-400">
                    {cycle.total_quota} مقعد
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`badge ${
                      cycle.status === 'open' ? 'badge-success' : 
                      cycle.status === 'draft' ? 'badge-primary' : 'badge-danger'
                    }`}>
                      {cycle.status === 'open' ? 'مفتوح' : 
                       cycle.status === 'draft' ? 'مسودة' : 'مغلق'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center space-x-2 space-x-reverse">
                    <Link href={`/portal/admin/scholarships/${cycle.id}/edit`} className="text-primary-600 hover:text-primary-700 text-sm font-medium">تعديل</Link>
                    <Link 
                      href={`/portal/admin/scholarships/${cycle.id}`} 
                      className="inline-flex items-center gap-1 text-surface-600 hover:text-primary-700 bg-surface-100 dark:bg-surface-800 px-2 py-1 rounded transition-colors text-xs font-medium"
                    >
                      عرض الطلبات
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {/* Pagination */}
        {data && data.total_pages > 1 && (
          <div className="p-4 border-t border-surface-200 dark:border-surface-700 flex items-center justify-between">
            <span className="text-sm text-surface-500">إجمالي {data.total} دورة</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50">السابق</button>
              <button disabled={page === data.total_pages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50">التالي</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
