import Link from "next/link";
import { ArrowRight, Globe } from "lucide-react";

export default function CampaignsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-surface-50 dark:bg-surface-950 pt-32 pb-24">
      {/* Background Gradients */}
      <div className="absolute inset-x-0 top-0 h-[600px] overflow-hidden opacity-50 dark:opacity-30 pointer-events-none">
        <div className="absolute left-[30%] top-[-20%] h-[400px] w-[600px] -translate-x-[50%] rounded-full bg-secondary-400/20 blur-[100px]"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-surface-900 dark:text-white mb-6">
            استكشف <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-500">الحملات</span>
          </h1>
          <p className="text-xl text-surface-600 dark:text-surface-400 max-w-2xl mx-auto">
            ساهم في إحداث تغيير حقيقي من خلال دعم الحملات الجارية.
          </p>
        </div>

        {/* Empty State / Coming Soon */}
        <div className="bg-white/50 dark:bg-surface-800/50 backdrop-blur-xl border border-white/40 dark:border-surface-700/50 rounded-3xl p-16 text-center max-w-3xl mx-auto shadow-xl">
          <Globe className="w-16 h-16 text-primary-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-4">
            لا توجد حملات نشطة حالياً
          </h2>
          <p className="text-surface-600 dark:text-surface-400 mb-8">
            نقوم حالياً بتجهيز حملات جديدة لإطلاقها قريباً. يرجى العودة لاحقاً أو تسجيل الدخول كطالب للتقديم على المنح.
          </p>
          <Link href="/login" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl shadow-lg transition-all font-medium">
            الذهاب إلى البوابة <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
