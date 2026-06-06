import Link from "next/link";
import Image from "next/image";
import { ArrowRight, GraduationCap, DollarSign, Heart } from "lucide-react";

async function getMetrics() {
  try {
    const baseUrl = process.env.SSR_API_URL || process.env.NEXT_PUBLIC_API_URL || "https://sadaqah-api.duckdns.org/api/v1";
    // SSR Fetch from the Go backend public endpoint
    const res = await fetch(`${baseUrl}/public/metrics`, {
      next: { revalidate: 60 } // Cache aggressively in Next.js as well
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch public metrics:", error);
    return null;
  }
}

export default async function PublicLandingPage() {
  const metrics = await getMetrics();

  return (
    <div className="flex flex-col min-h-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-surface-50 dark:bg-surface-950 pt-32 pb-24 lg:pt-40 lg:pb-32">
        {/* Background Gradients */}
        <div className="absolute inset-x-0 top-0 h-[800px] overflow-hidden opacity-50 dark:opacity-30 pointer-events-none">
          <div className="absolute left-[50%] top-[-20%] h-[600px] w-[800px] -translate-x-[50%] rounded-full bg-primary-500/20 blur-[120px]"></div>
          <div className="absolute left-[30%] top-[10%] h-[400px] w-[600px] rounded-full bg-secondary-400/20 blur-[100px]"></div>
        </div>
        
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] dark:[mask-image:linear-gradient(180deg,black,rgba(0,0,0,0))]"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 dark:bg-surface-900/60 backdrop-blur-md border border-primary-100 dark:border-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium mb-8 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
            </span>
            الوصول كزائر مفعل
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-surface-900 dark:text-white mb-6 leading-tight">
            تمكين المستقبل من خلال <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-500">العطاء الذكي</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-surface-600 dark:text-surface-400 max-w-3xl mx-auto mb-10 leading-relaxed font-light">
            تربط جمعية الصداقة والتعاون الطلاب الطموحين بالمتبرعين الأسخياء من خلال منصة ذكية، شفافة، وموثوقة.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <Link href="/campaigns/latest" className="group relative px-8 py-4 text-lg w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white rounded-2xl shadow-xl shadow-primary-500/25 hover:shadow-primary-500/40 transition-all duration-300 hover:-translate-y-0.5 active:scale-95 font-semibold">
              ادعم حملة 
              <ArrowRight className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            </Link>
            <Link href="/login?redirect=/portal/apply" className="px-8 py-4 text-lg w-full sm:w-auto flex items-center justify-center gap-2 bg-white dark:bg-surface-800 text-surface-900 dark:text-white border-2 border-surface-200 dark:border-surface-700 hover:border-primary-500 dark:hover:border-primary-500 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 active:scale-95 font-medium">
              قدم على منحة دراسية
            </Link>
          </div>

          {/* Dashboard Mockup */}
          <div className="relative max-w-5xl mx-auto">
            <div className="rounded-3xl border border-surface-200/50 dark:border-surface-800/50 bg-white/40 dark:bg-surface-900/40 backdrop-blur-2xl shadow-2xl shadow-primary-900/10 p-2 sm:p-4 transition-transform duration-700 hover:scale-[1.02]">
              <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
                <Image 
                  src="/brand/dashboard-mockup.png" 
                  alt="Sadaqah Platform Dashboard" 
                  fill 
                  className="object-cover"
                  priority
                />
              </div>
            </div>
            {/* Ambient shadow for mockup */}
            <div className="absolute -inset-x-20 -bottom-20 -z-10 h-1/2 bg-gradient-to-t from-surface-50 dark:from-surface-950 pt-[10%]"></div>
          </div>
        </div>
      </section>

      {/* Dynamic Metrics Section */}
      <section className="py-20 bg-white dark:bg-surface-900 border-y border-surface-200 dark:border-surface-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-surface-900 dark:text-white mb-4">تأثيرنا حتى الآن</h2>
            <p className="text-surface-600 dark:text-surface-400">مدعوم بالبيانات الحية ودعمكم المستمر.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/50 dark:bg-surface-800/50 backdrop-blur-xl border border-white/40 dark:border-surface-700/50 rounded-3xl p-8 text-center relative overflow-hidden group shadow-xl shadow-surface-200/20 dark:shadow-none hover:-translate-y-1 transition-all duration-300">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-primary-500/10 blur-2xl group-hover:bg-primary-500/20 transition-colors"></div>
              <GraduationCap className="w-12 h-12 text-primary-500 mx-auto mb-6" />
              <div className="text-4xl font-bold text-surface-900 dark:text-white mb-2">
                {metrics ? metrics.active_students : "1,200+"}
              </div>
              <div className="text-sm font-medium text-surface-500 uppercase tracking-wider">الطلاب النشطين</div>
            </div>

            <div className="bg-white/50 dark:bg-surface-800/50 backdrop-blur-xl border border-white/40 dark:border-surface-700/50 rounded-3xl p-8 text-center relative overflow-hidden group shadow-xl shadow-surface-200/20 dark:shadow-none hover:-translate-y-1 transition-all duration-300">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-emerald-500/10 blur-2xl group-hover:bg-emerald-500/20 transition-colors"></div>
              <DollarSign className="w-12 h-12 text-emerald-500 mx-auto mb-6" />
              <div className="text-4xl font-bold text-surface-900 dark:text-white mb-2">
                {metrics ? `$${(metrics.funds_raised / 1000).toFixed(1)}k` : "$2.5M+"}
              </div>
              <div className="text-sm font-medium text-surface-500 uppercase tracking-wider">الأموال المجموعة</div>
            </div>

            <div className="bg-white/50 dark:bg-surface-800/50 backdrop-blur-xl border border-white/40 dark:border-surface-700/50 rounded-3xl p-8 text-center relative overflow-hidden group shadow-xl shadow-surface-200/20 dark:shadow-none hover:-translate-y-1 transition-all duration-300">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-rose-500/10 blur-2xl group-hover:bg-rose-500/20 transition-colors"></div>
              <Heart className="w-12 h-12 text-rose-500 mx-auto mb-6" />
              <div className="text-4xl font-bold text-surface-900 dark:text-white mb-2">
                99%
              </div>
              <div className="text-sm font-medium text-surface-500 uppercase tracking-wider">نسبة النجاح</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
