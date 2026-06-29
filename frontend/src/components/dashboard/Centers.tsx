import { ChartBarIcon, HomeModernIcon, CurrencyDollarIcon, LightBulbIcon, AcademicCapIcon, ServerIcon } from "@heroicons/react/24/outline";

export function SummaryCenters({ summary, health }: { summary: any, health?: any }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {summary?.scholarships && (
          <div className="glass-card p-5">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-surface-500 text-sm">إجمالي طلبات المنح</p>
                <h4 className="text-3xl font-bold">{summary.scholarships.total}</h4>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <AcademicCapIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-surface-50 dark:bg-surface-800 p-2 rounded-lg text-center">
                <span className="block text-surface-500 text-xs">قيد المراجعة</span>
                <span className="font-semibold text-yellow-600">{summary.scholarships.under_review}</span>
              </div>
              <div className="bg-surface-50 dark:bg-surface-800 p-2 rounded-lg text-center">
                <span className="block text-surface-500 text-xs">بانتظار الإجراء</span>
                <span className="font-semibold text-orange-600">{summary.scholarships.pending}</span>
              </div>
            </div>
          </div>
        )}

        {summary?.innovation && (
          <div className="glass-card p-5">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-surface-500 text-sm">مشاريع الابتكار</p>
                <h4 className="text-3xl font-bold">{summary.innovation.total_applications}</h4>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <LightBulbIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-surface-50 dark:bg-surface-800 p-2 rounded-lg text-center">
                <span className="block text-surface-500 text-xs">فعاليات مفتوحة</span>
                <span className="font-semibold text-purple-600">{summary.innovation.open_events}</span>
              </div>
              <div className="bg-surface-50 dark:bg-surface-800 p-2 rounded-lg text-center">
                <span className="block text-surface-500 text-xs">تقييمات معلقة</span>
                <span className="font-semibold text-red-600">{summary.innovation.pending_evaluations}</span>
              </div>
            </div>
          </div>
        )}

        {summary?.finance && (
          <div className="glass-card p-5">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-surface-500 text-sm">الرصيد المتاح</p>
                <h4 className="text-2xl font-bold">${summary.finance.net_balance.toLocaleString()}</h4>
              </div>
              <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CurrencyDollarIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-surface-50 dark:bg-surface-800 p-2 rounded-lg text-center">
                <span className="block text-surface-500 text-xs">إجمالي الدخل</span>
                <span className="font-semibold text-green-600">${summary.finance.total_income.toLocaleString()}</span>
              </div>
              <div className="bg-surface-50 dark:bg-surface-800 p-2 rounded-lg text-center">
                <span className="block text-surface-500 text-xs">النفقات</span>
                <span className="font-semibold text-red-600">${summary.finance.total_expense.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {health && (
        <div className="glass-card p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
          <div className="flex items-center gap-2 mb-4">
            <ServerIcon className="w-5 h-5" />
            <h3 className="font-bold">صحة النظام (للمسؤولين فقط)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm border border-white/10">
              <p className="text-xs text-slate-400">قاعدة البيانات</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="font-semibold">{health.database_status}</span>
              </div>
            </div>
            <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm border border-white/10">
              <p className="text-xs text-slate-400">Redis ذاكرة التخزين المؤقت</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="font-semibold">{health.redis_status}</span>
              </div>
            </div>
            <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm border border-white/10">
              <p className="text-xs text-slate-400">مدة التشغيل</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-semibold">{Math.floor(health.uptime_seconds / 60)} دقيقة</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
