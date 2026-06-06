import Link from "next/link";
import Image from "next/image";
import { ReactNode } from "react";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-surface-50 dark:bg-surface-950">
      <header className="fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl z-50 bg-white/80 dark:bg-surface-900/80 backdrop-blur-xl border border-white/50 dark:border-surface-700/50 rounded-full shadow-xl shadow-primary-500/10 transition-all duration-300">
        <div className="px-6 sm:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2">
                <div className="relative w-10 h-10 flex-shrink-0">
                  <Image src="/brand/logo.png" alt="جمعية الصداقة والتعاون" fill className="object-contain" priority />
                </div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-400">
                  جمعية الصداقة والتعاون
                </span>
              </Link>

              <nav className="hidden md:flex items-center gap-6">
                <Link href="/about" className="text-sm font-medium text-surface-600 hover:text-primary-600 dark:text-surface-300 dark:hover:text-primary-400 transition-colors">
                  من نحن
                </Link>
                <Link href="/campaigns" className="text-sm font-medium text-surface-600 hover:text-primary-600 dark:text-surface-300 dark:hover:text-primary-400 transition-colors">
                  الحملات
                </Link>
                <Link href="/programs" className="text-sm font-medium text-surface-600 hover:text-primary-600 dark:text-surface-300 dark:hover:text-primary-400 transition-colors">
                  البرامج
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm font-medium text-surface-600 hover:text-primary-600 dark:text-surface-300 dark:hover:text-primary-400 transition-colors hidden sm:block">
                تسجيل الدخول
              </Link>
              <Link href="/register" className="btn-gradient text-sm px-4 py-2">
                انضم إلينا
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-24">
        {children}
      </main>

      <footer className="bg-surface-100 dark:bg-surface-900 border-t border-surface-200 dark:border-surface-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-surface-500 dark:text-surface-400 text-sm">
          <p>&copy; {new Date().getFullYear()} منصة جمعية الصداقة والتعاون الذكية. جميع الحقوق محفوظة.</p>
        </div>
      </footer>
    </div>
  );
}
