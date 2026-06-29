"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { formatDateTime } from "@/lib/utils";
import { Trophy, Calendar, Users, Briefcase, FileText, CheckCircle2 } from "lucide-react";

type InnovationEvent = {
  id: string;
  name_en: string;
  name_ar: string;
  description: string;
  status: string;
  submission_deadline: string;
  configuration: any;
};

export default function CompetitionDetailsPage() {
  const params = useParams();
  const [competition, setCompetition] = useState<InnovationEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await apiClient.get<InnovationEvent>(`/innovation/events/${params.id}`);
        setCompetition(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    if (params.id) loadData();
  }, [params.id]);

  if (isLoading) return <div className="p-8 text-center">جاري التحميل...</div>;
  if (!competition) return <div className="p-8 text-center text-red-500">لم يتم العثور على المسابقة</div>;

  const config = competition.configuration || {};
  const details = config.details || {};
  const eligibility = config.eligibility || {};

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="glass-card p-8 border-t-4 border-t-primary-500 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Trophy className="w-48 h-48" />
        </div>
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <span className={`badge ${competition.status === 'open' ? 'badge-success' : 'badge-neutral'}`}>
              {competition.status === "open" ? "مفتوح للتقديم" : competition.status}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-surface-900 dark:text-white mb-4">
            {competition.name_ar}
          </h1>
          <p className="text-lg text-surface-600 dark:text-surface-400">
            {competition.description}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-500" />
              تفاصيل المسابقة والتحدي
            </h2>
            <div className="prose dark:prose-invert max-w-none text-surface-600 dark:text-surface-400 whitespace-pre-wrap">
              {details.short_description || "لا يوجد تفاصيل إضافية."}
            </div>
          </div>

          <div className="glass-card p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary-500" />
              شروط التقديم
            </h2>
            <ul className="space-y-2 text-surface-600 dark:text-surface-400 list-disc list-inside">
              {eligibility.academic_level && <li>المستوى الأكاديمي: {eligibility.academic_level}</li>}
              {eligibility.special_conditions && eligibility.special_conditions.split('\n').map((cond: string, i: number) => (
                <li key={i}>{cond}</li>
              ))}
              {!eligibility.academic_level && !eligibility.special_conditions && (
                <li>التقديم متاح للجميع</li>
              )}
            </ul>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="font-bold mb-4">معلومات سريعة</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Briefcase className="w-5 h-5 text-surface-400" />
                <div>
                  <p className="text-xs text-surface-500">الفئة</p>
                  <p className="font-medium text-sm">{details.category || "عام"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-surface-400" />
                <div>
                  <p className="text-xs text-surface-500">حجم الفريق</p>
                  <p className="font-medium text-sm">
                    {details.min_team_size} - {details.max_team_size} أعضاء
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary-500" />
                <div>
                  <p className="text-xs text-surface-500">آخر موعد للتقديم</p>
                  <p className="font-medium text-sm">{formatDateTime(competition.submission_deadline)}</p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              {competition.status === 'open' ? (
                <Link 
                  href={`/portal/innovation/${competition.id}/apply`}
                  className="w-full btn-gradient py-3 flex justify-center text-lg font-bold shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50"
                >
                  التقديم الآن
                </Link>
              ) : (
                <button disabled className="w-full btn-neutral py-3 cursor-not-allowed">
                  التقديم مغلق
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
