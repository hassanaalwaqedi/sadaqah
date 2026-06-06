import { Heart, Target, Users } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-surface-50 dark:bg-surface-950 pt-32 pb-24">
      {/* Background Gradients */}
      <div className="absolute inset-x-0 top-0 h-[600px] overflow-hidden opacity-50 dark:opacity-30 pointer-events-none">
        <div className="absolute left-[50%] top-[-20%] h-[500px] w-[700px] -translate-x-[50%] rounded-full bg-primary-500/20 blur-[120px]"></div>
      </div>
      
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] dark:[mask-image:linear-gradient(180deg,black,rgba(0,0,0,0))]"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-surface-900 dark:text-white mb-6">
          من <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-500">نحن</span>
        </h1>
        <p className="text-xl text-surface-600 dark:text-surface-400 max-w-3xl mx-auto mb-16 leading-relaxed">
          نحن منصة متكاملة تهدف إلى تعزيز روح التعاون والتكافل بين أفراد المجتمع عبر توفير منح دراسية ومشاريع تنموية رائدة.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-right">
          <div className="bg-white/50 dark:bg-surface-800/50 backdrop-blur-xl border border-white/40 dark:border-surface-700/50 rounded-3xl p-8 shadow-xl hover:-translate-y-1 transition-all duration-300">
            <Target className="w-12 h-12 text-primary-500 mb-6" />
            <h3 className="text-2xl font-bold mb-4 text-surface-900 dark:text-white">رؤيتنا</h3>
            <p className="text-surface-600 dark:text-surface-400">
              أن نكون المنصة الرائدة في تمكين الطلاب والمجتمعات من خلال دعم مستدام ومبتكر.
            </p>
          </div>
          
          <div className="bg-white/50 dark:bg-surface-800/50 backdrop-blur-xl border border-white/40 dark:border-surface-700/50 rounded-3xl p-8 shadow-xl hover:-translate-y-1 transition-all duration-300">
            <Heart className="w-12 h-12 text-rose-500 mb-6" />
            <h3 className="text-2xl font-bold mb-4 text-surface-900 dark:text-white">رسالتنا</h3>
            <p className="text-surface-600 dark:text-surface-400">
              تقديم المساعدات والمنح بشفافية وعدالة لضمان وصول الدعم لمستحقيه.
            </p>
          </div>

          <div className="bg-white/50 dark:bg-surface-800/50 backdrop-blur-xl border border-white/40 dark:border-surface-700/50 rounded-3xl p-8 shadow-xl hover:-translate-y-1 transition-all duration-300">
            <Users className="w-12 h-12 text-secondary-500 mb-6" />
            <h3 className="text-2xl font-bold mb-4 text-surface-900 dark:text-white">قيمنا</h3>
            <p className="text-surface-600 dark:text-surface-400">
              الشفافية، الابتكار، الاستدامة، والمشاركة المجتمعية الفعالة.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
