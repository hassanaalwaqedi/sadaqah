"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { Award, Target, FileText, CheckCircle2, TrendingUp, History, Download } from "lucide-react";

export default function MyImpactDashboard() {
  const [impactData, setImpactData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchImpactData();
  }, []);

  const fetchImpactData = async () => {
    try {
      const res = await apiClient.get('/donations/impact/me');
      if (res.data) {
        setImpactData(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch impact data", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!impactData || impactData.total_donated === 0) {
    return (
      <div className="text-center py-20">
        <Award className="w-16 h-16 text-surface-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold">لا يوجد أثر بعد</h2>
        <p className="text-surface-500 mt-2">قم بالتبرع لترى أثرك الإيجابي هنا.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">أثري وإسهاماتي</h1>
          <p className="text-surface-600 dark:text-surface-400 mt-2">
            تابع أثر تبرعاتك وكيف ساهمت في دعم برامج ومبادرات الجمعية.
          </p>
        </div>
        <button className="btn-outline flex items-center gap-2">
          <Download className="w-5 h-5" />
          تحميل تقرير الأثر
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-full flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6" />
          </div>
          <span className="text-surface-500 text-sm mb-1">إجمالي التبرعات</span>
          <span className="text-2xl font-bold text-success-600">{impactData.total_donated.toLocaleString()} USD</span>
        </div>
        <div className="card p-6 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <span className="text-surface-500 text-sm mb-1">إجمالي المخصص</span>
          <span className="text-2xl font-bold">{impactData.total_allocated.toLocaleString()} USD</span>
        </div>
        <div className="card p-6 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-full flex items-center justify-center mb-4">
            <Target className="w-6 h-6" />
          </div>
          <span className="text-surface-500 text-sm mb-1">البرامج المدعومة</span>
          <span className="text-2xl font-bold">{impactData.programs_supported?.length || 0}</span>
        </div>
        <div className="card p-6 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-full flex items-center justify-center mb-4">
            <Award className="w-6 h-6" />
          </div>
          <span className="text-surface-500 text-sm mb-1">الحملات المدعومة</span>
          <span className="text-2xl font-bold">{impactData.campaigns_supported || 0}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="col-span-2 space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-500" />
            تحديثات البرامج المدعومة
          </h2>
          {impactData.impact_updates?.length > 0 ? (
            <div className="space-y-4">
              {impactData.impact_updates.map((update: any) => (
                <div key={update.id} className="card p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-xs font-bold text-primary-600 bg-primary-50 dark:bg-primary-900/20 px-2 py-1 rounded mb-2 inline-block">
                        {update.program}
                      </span>
                      <h3 className="text-lg font-bold">{update.title_ar}</h3>
                    </div>
                    <span className="text-sm text-surface-500">
                      {new Date(update.created_at).toLocaleDateString('ar-SA')}
                    </span>
                  </div>
                  <p className="text-surface-600 dark:text-surface-400">
                    {update.content_ar}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-8 text-center text-surface-500">
              لا توجد تحديثات حالياً.
            </div>
          )}
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <History className="w-5 h-5 text-primary-500" />
            سجل التخصيص
          </h2>
          {impactData.recent_allocations?.length > 0 ? (
            <div className="card p-0 overflow-hidden relative">
              <div className="absolute right-6 top-4 bottom-4 w-px bg-surface-200 dark:bg-surface-800"></div>
              <ul className="space-y-0 relative z-10">
                {impactData.recent_allocations.map((alloc: any, i: number) => (
                  <li key={alloc.id} className="relative pr-12 pl-6 py-6 border-b border-surface-100 dark:border-surface-800 last:border-0 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                    <div className="absolute right-5 translate-x-[4px] top-7 w-2.5 h-2.5 rounded-full bg-primary-500 ring-4 ring-white dark:ring-surface-900"></div>
                    <div className="flex flex-col">
                      <span className="text-xs text-surface-500 mb-1">
                        {new Date(alloc.created_at).toLocaleDateString('ar-SA')}
                      </span>
                      <span className="font-bold text-lg">
                        تم تخصيص {alloc.amount} USD لبرنامج {alloc.program}
                      </span>
                      {alloc.notes && (
                        <span className="text-sm text-surface-600 dark:text-surface-400 mt-2 bg-surface-100 dark:bg-surface-800 p-2 rounded">
                          {alloc.notes}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="card p-6 text-center text-surface-500">
              لم يتم تخصيص التبرعات بعد.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
