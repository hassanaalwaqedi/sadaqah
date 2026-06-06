"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service like Sentry in production
    console.error("Global boundary caught error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950 p-4">
      <div className="max-w-md w-full bg-white dark:bg-surface-900 shadow-xl rounded-2xl p-8 text-center border border-surface-200 dark:border-surface-800 animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <ExclamationTriangleIcon className="w-8 h-8" />
        </div>
        
        <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-3">
          حدث خطأ غير متوقع
        </h2>
        
        <p className="text-surface-600 dark:text-surface-400 mb-8">
          نعتذر، واجهنا مشكلة فنية أثناء معالجة طلبك. يرجى المحاولة مرة أخرى أو العودة للصفحة الرئيسية.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors"
          >
            إعادة المحاولة
          </button>
          
          <Link
            href="/"
            className="px-6 py-2.5 bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700 text-surface-900 dark:text-white font-medium rounded-xl transition-colors"
          >
            الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
