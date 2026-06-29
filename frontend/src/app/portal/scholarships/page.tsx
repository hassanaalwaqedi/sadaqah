"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { formatDateTime } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";

export default function ScholarshipsPage() {
  const [cycles, setCycles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    const fetchCycles = async () => {
      setIsLoading(true);
      try {
        // Fetch all cycles. Non-admins will only receive 'open' ones due to backend logic.
        const res = await apiClient.get("/scholarships/cycles");
        setCycles(res.data?.data || []);
      } catch (error) {
        console.error("Failed to fetch scholarships", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCycles();
  }, []);

  // Compute status for a cycle
  const getComputedStatus = (cycle: any) => {
    const now = new Date();
    const start = new Date(cycle.application_start);
    const end = new Date(cycle.application_deadline);

    if (now < start) return { id: "upcoming", label: "قريباً", color: "badge-primary" };
    if (now > end) return { id: "closed", label: "مغلق", color: "badge-danger" };
    return { id: "open", label: "متاح للتقديم", color: "badge-success" };
  };

  // Apply filters
  const filteredCycles = cycles.filter(cycle => {
    const details = cycle.configuration?.details || {};
    const matchesSearch = cycle.name_ar.includes(searchQuery) || 
                          cycle.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (cycle.description || "").includes(searchQuery);
    const matchesCategory = categoryFilter ? details.category === categoryFilter : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
            المنح الدراسية المتاحة
          </h1>
          <p className="text-sm text-surface-500 mt-1 max-w-2xl">
            تصفح برامج المنح الدراسية المفتوحة حالياً. يمكنك استخدام خيارات البحث والتصفية للوصول السريع إلى المنحة المناسبة لك.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full md:flex-1">
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input 
            type="text" 
            placeholder="ابحث باسم المنحة أو الوصف..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input pr-10 w-full"
          />
        </div>
        <select 
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="form-input w-full md:w-64"
        >
          <option value="">جميع الفئات</option>
          <option value="منح البكالوريوس">منح البكالوريوس</option>
          <option value="منح الماجستير">منح الماجستير</option>
          <option value="منح الدكتوراه">منح الدكتوراه</option>
          <option value="دعم أبحاث">دعم أبحاث</option>
        </select>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredCycles.map((cycle) => {
              const status = getComputedStatus(cycle);
              const details = cycle.configuration?.details || {};
              const eligibility = cycle.configuration?.eligibility || {};

              return (
                <div key={cycle.id} className="glass-card flex flex-col h-full group hover:shadow-xl hover:border-primary-500/30 transition-all duration-300">
                  <div className="p-6 flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <span className={`badge ${status.color}`}>{status.label}</span>
                      {details.category && (
                        <span className="text-xs px-2 py-1 bg-surface-100 dark:bg-surface-800 rounded-md text-surface-600 dark:text-surface-300 font-medium font-sans">
                          {details.category}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100 mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {cycle.name_ar}
                    </h3>
                    <p className="text-surface-600 dark:text-surface-400 text-sm leading-relaxed mb-6 line-clamp-3">
                      {details.short_description || cycle.description}
                    </p>

                    <div className="space-y-3 text-sm text-surface-500">
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                        <span>
                          <strong>يبدأ:</strong> <span dir="ltr">{formatDateTime(cycle.application_start)}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-danger-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>
                          <strong>ينتهي:</strong> <span dir="ltr">{formatDateTime(cycle.application_deadline)}</span>
                        </span>
                      </div>
                      {eligibility.min_gpa && (
                        <div className="flex items-center gap-3 border-t border-surface-200 dark:border-surface-700 pt-3 mt-3">
                          <svg className="w-5 h-5 text-warning-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-1.81 1.838l1.18 5.485c.108.494-.407.87-1.42 1.39l-4.752-2.583a.562.562 0 00-.525 0l-4.752 2.583c-.413.225-.929-.153-.82-1.39l1.18-5.485a.563.563 0 00-1.81-1.838l-4.204-3.602c-.38-.325-.178-.948.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                          </svg>
                          <span>
                            <strong>الحد الأدنى للمعدل:</strong> {eligibility.min_gpa}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-4 border-t border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50 rounded-b-2xl flex gap-3">
                    <Link 
                      href={`/portal/scholarships/${cycle.id}`}
                      className="btn-outline flex-1 text-center"
                    >
                      التفاصيل
                    </Link>
                    {status.id === 'open' && (
                      <Link 
                        href={`/portal/scholarships/${cycle.id}/apply`}
                        className="btn-primary flex-1 text-center"
                      >
                        التقديم
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {filteredCycles.length === 0 && (
            <div className="py-20 text-center glass-card flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-surface-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm3.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100 mb-2">
                لا توجد منح دراسية متاحة
              </h3>
              <p className="text-surface-500 max-w-sm">
                عذراً، لم نتمكن من العثور على أي منح دراسية تتطابق مع معايير البحث الخاصة بك في الوقت الحالي.
              </p>
              {(searchQuery || categoryFilter) && (
                <button 
                  onClick={() => { setSearchQuery(""); setCategoryFilter(""); }}
                  className="mt-6 text-primary-600 hover:text-primary-700 font-medium"
                >
                  إلغاء عوامل التصفية
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
