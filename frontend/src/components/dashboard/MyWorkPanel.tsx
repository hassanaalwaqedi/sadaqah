import { format } from "date-fns";
import { ar } from "date-fns/locale";
import Link from "next/link";
import { BriefcaseIcon, ExclamationCircleIcon, ClipboardDocumentListIcon } from "@heroicons/react/24/outline";

export function MyWorkPanel({ work }: { work: any }) {
  const hasWork = work?.assigned_cases?.length > 0 || work?.pending_tasks?.length > 0;

  if (!hasWork) {
    return (
      <div className="glass-card p-6 flex flex-col items-center justify-center text-center py-12">
        <ClipboardDocumentListIcon className="w-16 h-16 text-surface-300 mb-4" />
        <h3 className="text-lg font-bold text-surface-900 dark:text-surface-50 mb-2">لا يوجد عمل قيد الانتظار</h3>
        <p className="text-surface-500 max-w-sm">
          أنت حالياً لا تملك أي حالات مسندة إليك أو مهام تتطلب إجراء. 
          يمكنك تصفح الطلبات المفتوحة أو التواصل مع مديرك لتعيين المهام.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-6 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between">
        <h3 className="text-lg font-bold text-surface-900 dark:text-surface-50 flex items-center gap-2">
          <BriefcaseIcon className="w-6 h-6 text-primary-500" />
          عملي الحالي
        </h3>
        <span className="bg-primary-100 text-primary-700 text-xs px-2 py-1 rounded-full font-semibold">
          {work?.assigned_cases?.length + work?.pending_tasks?.length} مهمة
        </span>
      </div>

      <div className="divide-y divide-surface-100 dark:divide-surface-800 max-h-96 overflow-y-auto">
        {/* Cases */}
        {work?.assigned_cases?.map((c: any) => (
          <div key={c.id} className="p-4 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors">
            <div className="flex justify-between items-start mb-1">
              <Link href={`/portal/admin/scholarships/applications/${c.id}`} className="font-semibold text-primary-600 hover:underline">
                {c.title || "طلب منحة"} - {c.applicant}
              </Link>
              {c.priority === "high" && (
                <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
                  <ExclamationCircleIcon className="w-4 h-4" /> عالي الأهمية
                </span>
              )}
            </div>
            <div className="text-sm text-surface-500 flex items-center gap-3 mt-2">
              <span className="capitalize px-2 py-0.5 bg-surface-100 dark:bg-surface-700 rounded-md text-xs">{c.status}</span>
              <span>تم الإنشاء: {format(new Date(c.created_at), "dd MMM yyyy", { locale: ar })}</span>
            </div>
          </div>
        ))}

        {/* Tasks */}
        {work?.pending_tasks?.map((t: any) => (
          <div key={t.id} className="p-4 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors">
            <div className="flex justify-between items-start mb-1">
              <Link href={`/portal/admin/innovation/evaluations/${t.id}`} className="font-semibold text-primary-600 hover:underline">
                {t.title}
              </Link>
              <span className="text-xs text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-md font-medium">
                بانتظار التقييم
              </span>
            </div>
            <div className="text-sm text-surface-500 flex items-center gap-3 mt-2">
              <span className="px-2 py-0.5 bg-surface-100 dark:bg-surface-700 rounded-md text-xs">{t.description}</span>
              <span>موعد التسليم: {format(new Date(t.due_date), "dd MMM yyyy", { locale: ar })}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
