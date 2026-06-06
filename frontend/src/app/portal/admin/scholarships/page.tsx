"use client";

import { useState, useEffect } from "react";
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
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Cycle Form State
  const [formData, setFormData] = useState({
    name_en: "",
    name_ar: "",
    description: "",
    academic_year: "2026/2027",
    application_start: "",
    application_deadline: "",
    evaluation_deadline: "",
    total_quota: 100,
  });

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "total_quota" ? parseInt(value) || 0 : value,
    }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // API expects RFC3339 timestamps
      const payload = {
        ...formData,
        application_start: new Date(formData.application_start).toISOString(),
        application_deadline: new Date(formData.application_deadline).toISOString(),
        evaluation_deadline: formData.evaluation_deadline ? new Date(formData.evaluation_deadline).toISOString() : null,
      };

      await apiClient.post("/scholarships/cycles", payload);
      alert("تم إنشاء دورة المنحة بنجاح!");
      setIsModalOpen(false);
      fetchCycles();
    } catch (error) {
      console.error("Failed to create cycle", error);
      alert("حدث خطأ أثناء الإنشاء");
    }
  };

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
        <button onClick={() => setIsModalOpen(true)} className="btn-gradient">
          دورة منحة جديدة
        </button>
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
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-surface-500">
                  جاري التحميل...
                </td>
              </tr>
            ) : data?.data?.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-surface-500">
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

      {/* Create Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-50 dark:bg-surface-900 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-surface-200 dark:border-surface-700 flex justify-between items-center">
              <h2 className="text-xl font-bold">إنشاء دورة منحة جديدة</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-surface-400 hover:text-surface-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">الاسم (بالعربية)</label>
                  <input type="text" name="name_ar" required value={formData.name_ar} onChange={handleChange} className="form-input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الاسم (بالإنجليزية)</label>
                  <input type="text" name="name_en" required value={formData.name_en} onChange={handleChange} className="form-input" dir="ltr" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">الوصف</label>
                  <textarea name="description" rows={3} value={formData.description} onChange={handleChange} className="form-input"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">السنة الأكاديمية</label>
                  <input type="text" name="academic_year" required value={formData.academic_year} onChange={handleChange} className="form-input" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الحصة (عدد المقاعد)</label>
                  <input type="number" name="total_quota" required min="1" value={formData.total_quota} onChange={handleChange} className="form-input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">بداية التقديم</label>
                  <input type="datetime-local" name="application_start" required value={formData.application_start} onChange={handleChange} className="form-input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">نهاية التقديم</label>
                  <input type="datetime-local" name="application_deadline" required value={formData.application_deadline} onChange={handleChange} className="form-input" />
                </div>
              </div>
              
              <div className="pt-6 flex justify-end gap-3 border-t border-surface-200 dark:border-surface-700">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-outline">إلغاء</button>
                <button type="submit" className="btn-primary">حفظ وإنشاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
