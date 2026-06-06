import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function ProgramsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-surface-50 dark:bg-surface-950 pt-32 pb-24">
      {/* Background Gradients */}
      <div className="absolute inset-x-0 top-0 h-[600px] overflow-hidden opacity-50 dark:opacity-30 pointer-events-none">
        <div className="absolute left-[70%] top-[-10%] h-[400px] w-[600px] -translate-x-[50%] rounded-full bg-primary-400/20 blur-[100px]"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-surface-900 dark:text-white mb-6">
            برامج <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-500">الجمعية</span>
          </h1>
          <p className="text-xl text-surface-600 dark:text-surface-400 max-w-2xl mx-auto">
            مجموعة من البرامج المصممة خصيصاً لدعم وتطوير قدرات الطلاب في شتى المجالات.
          </p>
        </div>

        {/* Empty State / Coming Soon */}
        <div className="bg-white/50 dark:bg-surface-800/50 backdrop-blur-xl border border-white/40 dark:border-surface-700/50 rounded-3xl p-16 text-center max-w-3xl mx-auto shadow-xl">
          <Sparkles className="w-16 h-16 text-primary-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-4">
            قريباً: برامج 2026
          </h2>
          <p className="text-surface-600 dark:text-surface-400 mb-8">
            نقوم بتحديث برامجنا لتشمل مسارات ابتكار، ريادة أعمال، ومنح سكنية متميزة. سيتم الإعلان عنها قريباً.
          </p>
          <Link href="/" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-surface-200 dark:border-surface-700 hover:border-primary-500 text-surface-900 dark:text-white rounded-xl shadow-sm transition-all font-medium">
            العودة للصفحة الرئيسية <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
