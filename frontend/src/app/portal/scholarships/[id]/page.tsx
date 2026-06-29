"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { formatDateTime } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";

interface ScholarshipCycle {
  id: string;
  name_ar: string;
  name_en: string;
  description: string;
  academic_year: string;
  application_start: string;
  application_deadline: string;
  total_quota: number;
  status: string;
  configuration: any;
}

export default function ScholarshipDetailsPage() {
  const params = useParams();
  const id = params?.id as string;
  const { user } = useAuth();
  
  const [cycle, setCycle] = useState<ScholarshipCycle | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCycle = async () => {
      try {
        const response = await apiClient.get(`/scholarships/cycles/${id}`);
        setCycle(response.data);
      } catch (error) {
        console.error("Failed to fetch cycle details", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCycle();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!cycle) {
    return <div className="text-center py-12 text-surface-500">المنحة غير موجودة</div>;
  }

  const config = cycle.configuration || {};
  const details = config.details || {};
  const eligibility = config.eligibility || {};
  const documents = config.documents || [];

  // Dynamic eligibility calculation based on current user
  const isProfileComplete = user?.profile_completed || false;
  // For demo purposes, we assume if profile is complete they are eligible
  const eligibilityStatus = isProfileComplete ? "eligible" : "not_eligible";

  const getComputedStatus = (c: ScholarshipCycle) => {
    const now = new Date();
    const start = new Date(c.application_start);
    const end = new Date(c.application_deadline);
    if (now < start) return { id: "upcoming", label: "قريباً", color: "badge-primary" };
    if (now > end) return { id: "closed", label: "مغلق", color: "badge-danger" };
    return { id: "open", label: "متاح للتقديم", color: "badge-success" };
  };

  const computedStatus = getComputedStatus(cycle as any);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-surface-900 dark:bg-surface-950 text-white shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-l from-primary-600/30 to-surface-900 z-10"></div>
        {/* Placeholder for Cover Image */}
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070')] bg-cover bg-center"></div>
        
        <div className="relative z-20 p-8 md:p-12 lg:p-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4 max-w-3xl">
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="badge bg-primary-500/20 text-primary-200 border-primary-500/30">
                {cycle.status === "open" ? "متاح للتقديم" : cycle.status === "draft" ? "مسودة" : "مغلق"}
              </span>
              {details.category && (
                <span className="badge bg-surface-500/20 text-surface-200 border-surface-500/30">
                  {details.category}
                </span>
              )}
              {details.funding_type && (
                <span className="badge bg-surface-500/20 text-surface-200 border-surface-500/30">
                  {details.funding_type}
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight">
              {cycle.name_ar}
            </h1>
            <div className="flex flex-wrap gap-6 text-sm text-surface-300 pt-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                الموعد النهائي: <span dir="ltr">{formatDateTime(cycle.application_deadline)}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
                المقاعد المتاحة: {cycle.total_quota}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Eligibility Check Widget */}
          <div className={`p-6 rounded-2xl border-2 ${eligibilityStatus === 'eligible' ? 'border-success-200 bg-success-50 dark:border-success-900/50 dark:bg-success-900/10' : 'border-warning-200 bg-warning-50 dark:border-warning-900/50 dark:bg-warning-900/10'}`}>
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-full ${eligibilityStatus === 'eligible' ? 'bg-success-100 text-success-600 dark:bg-success-900/30' : 'bg-warning-100 text-warning-600 dark:bg-warning-900/30'}`}>
                {eligibilityStatus === 'eligible' ? (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <h3 className={`text-lg font-bold ${eligibilityStatus === 'eligible' ? 'text-success-800 dark:text-success-200' : 'text-warning-800 dark:text-warning-200'}`}>
                  {eligibilityStatus === 'eligible' ? 'أنت مؤهل مبدئياً للتقديم' : 'ملفك الشخصي غير مكتمل'}
                </h3>
                <p className={`mt-1 text-sm ${eligibilityStatus === 'eligible' ? 'text-success-700 dark:text-success-300' : 'text-warning-700 dark:text-warning-300'}`}>
                  {eligibilityStatus === 'eligible' 
                    ? 'بناءً على بيانات ملفك الشخصي، يبدو أنك تستوفي الشروط الأساسية لهذه المنحة. يمكنك البدء في إجراءات التقديم.' 
                    : 'يجب عليك استكمال بيانات ملفك الشخصي (المعلومات الأكاديمية والمالية) قبل أن تتمكن من التقديم على هذه المنحة.'}
                </p>
                
                <div className="mt-4">
                  {eligibilityStatus === 'eligible' && computedStatus.id === "open" ? (
                    <Link href={`/portal/scholarships/${id}/apply`} className="btn-primary">
                      التقديم الآن
                    </Link>
                  ) : computedStatus.id === "upcoming" ? (
                    <button disabled className="btn-outline opacity-50">التقديم يفتح قريباً</button>
                  ) : computedStatus.id === "closed" ? (
                    <button disabled className="btn-outline opacity-50">التقديم مغلق</button>
                  ) : (
                    <Link href="/portal/onboarding" className="btn-outline border-warning-300 text-warning-700 hover:bg-warning-100">
                      استكمال الملف الشخصي
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* About */}
          <section className="glass-card p-6">
            <h2 className="text-xl font-bold mb-4 text-surface-900 dark:text-surface-50">نظرة عامة</h2>
            <p className="text-surface-600 dark:text-surface-300 leading-relaxed whitespace-pre-wrap">
              {cycle.description || "لا يوجد وصف متوفر لهذه المنحة."}
            </p>
          </section>

          {/* Requirements */}
          {Object.keys(eligibility).length > 0 && (
            <section className="glass-card p-6">
              <h2 className="text-xl font-bold mb-6 text-surface-900 dark:text-surface-50">شروط التقديم (الديناميكية)</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {eligibility.min_gpa && (
                  <div>
                    <h4 className="text-sm font-medium text-surface-500 mb-1">الحد الأدنى للمعدل</h4>
                    <p className="font-semibold text-surface-900 dark:text-surface-100">{eligibility.min_gpa}</p>
                  </div>
                )}
                {eligibility.nationalities && (
                  <div>
                    <h4 className="text-sm font-medium text-surface-500 mb-1">الجنسيات</h4>
                    <p className="font-semibold text-surface-900 dark:text-surface-100">{eligibility.nationalities}</p>
                  </div>
                )}
                {eligibility.special_conditions && (
                  <div className="sm:col-span-2">
                    <h4 className="text-sm font-medium text-surface-500 mb-1">شروط خاصة</h4>
                    <p className="font-semibold text-surface-900 dark:text-surface-100">{eligibility.special_conditions}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Required Documents */}
          {documents.length > 0 && (
            <section className="glass-card p-6">
              <h2 className="text-xl font-bold mb-4 text-surface-900 dark:text-surface-50">المستندات المطلوبة</h2>
              <ul className="space-y-3">
                {documents.map((doc: any, i: number) => (
                  <li key={i} className="flex items-center gap-3 text-surface-700 dark:text-surface-300">
                    <svg className="w-5 h-5 text-surface-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    {doc.name} {doc.required && <span className="text-danger-500 text-xs">(مطلوب)</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats Widget */}
          <div className="glass-card p-6">
            <h3 className="font-bold text-lg mb-4 text-surface-900 dark:text-surface-50">إحصائيات المنحة</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-surface-500">السنة الأكاديمية</span>
                  <span className="font-bold text-surface-900 dark:text-surface-100">{cycle.academic_year}</span>
                </div>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-surface-200 dark:border-surface-700">
                <span className="text-surface-500 text-sm">حالة التقديم</span>
                <span className={`badge ${cycle.status === 'open' ? 'badge-success' : 'badge-danger'}`}>
                  {cycle.status === 'open' ? 'مفتوح' : 'مغلق'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
