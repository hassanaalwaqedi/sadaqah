"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await apiClient.post("/auth/forgot-password", { email });
      setIsSubmitted(true);
    } catch (err: any) {
      // Always show success to prevent email enumeration
      setIsSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">
            تحقق من بريدك الإلكتروني
          </h1>
          <p className="text-surface-600 dark:text-surface-400">
            إذا كان الحساب موجودًا، فقد أرسلنا رابط إعادة تعيين كلمة المرور إلى
          </p>
          <p className="font-medium text-surface-900 dark:text-white mt-1">{email}</p>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          العودة لتسجيل الدخول
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">
          نسيت كلمة المرور؟
        </h1>
        <p className="text-surface-600 dark:text-surface-400 text-sm">
          أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="forgot-email" className="form-label">البريد الإلكتروني</label>
          <div className="relative">
            <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input
              id="forgot-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="form-input w-full pr-10"
              dir="ltr"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-gradient w-full py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {isLoading ? (
            <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          ) : (
            <>
              إرسال رابط إعادة التعيين
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      <div className="text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          العودة لتسجيل الدخول
        </Link>
      </div>
    </div>
  );
}
