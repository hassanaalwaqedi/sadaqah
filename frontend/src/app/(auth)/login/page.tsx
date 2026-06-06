"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/providers/auth-provider";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";

const loginSchema = z.object({
  email: z.string().email({ message: "البريد الإلكتروني غير صالح" }),
  password: z.string().min(6, { message: "يجب أن تكون كلمة المرور 6 أحرف على الأقل" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginContent() {
  const { login, loginWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/portal";
  
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      await login(data.email, data.password);
      toast.success("تم تسجيل الدخول بنجاح");
      router.push(redirectPath);
    } catch (err: any) {
      toast.error(
        err.response?.data?.error?.message || "Login failed. Please try again."
      );
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);

    try {
      const { signInWithPopup } = await import("firebase/auth");
      const { auth, googleProvider } = await import("@/lib/firebase");

      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      await loginWithGoogle(idToken);
      toast.success("تم تسجيل الدخول بنجاح");
      router.push(redirectPath);
    } catch (err: any) {
      if (err.code === "auth/popup-closed-by-user") {
        return;
      }
      toast.error(
        err.response?.data?.error?.message ||
          err.message ||
          "فشل تسجيل الدخول بواسطة Google. يرجى المحاولة مرة أخرى."
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col items-center mb-8">
        <div className="relative w-16 h-16 mb-4">
          <Image src="/brand/logo.png" alt="جمعية الصداقة والتعاون" fill className="object-contain" priority />
        </div>
        <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-50 mb-1">
          تسجيل الدخول
        </h2>
        <p className="text-sm text-surface-500">
          سجل الدخول إلى حسابك
        </p>
      </div>

      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isGoogleLoading || isSubmitting}
        className="w-full py-2.5 px-4 bg-white dark:bg-surface-800 text-surface-900 dark:text-white border border-surface-200 dark:border-surface-700 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors shadow-sm flex items-center justify-center gap-3 disabled:opacity-50"
      >
        {isGoogleLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            جاري التحقق...
          </span>
        ) : (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </>
        )}
      </button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-surface-200 dark:border-surface-700"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-surface-900 text-surface-500">أو باستخدام البريد الإلكتروني</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="email" className="form-label">
            البريد الإلكتروني
          </label>
          <input
            id="email"
            type="email"
            {...register("email")}
            className={`form-input ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
            placeholder="your@email.com"
            autoComplete="email"
            dir="ltr"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="form-label mb-0">
              كلمة المرور
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-primary-600 hover:text-primary-500 transition-colors"
            >
              نسيت كلمة المرور؟
            </Link>
          </div>
          <input
            id="password"
            type="password"
            {...register("password")}
            className={`form-input ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
            placeholder="••••••••"
            autoComplete="current-password"
            dir="ltr"
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-gradient w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              جاري تسجيل الدخول...
            </span>
          ) : (
            "تسجيل الدخول"
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-surface-500">
          ليس لديك حساب؟{" "}
          <Link
            href="/register"
            className="text-primary-600 hover:text-primary-500 font-medium transition-colors"
          >
            إنشاء حساب جديد
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="animate-pulse bg-surface-200 dark:bg-surface-800 h-96 w-full rounded-xl"></div>}>
      <LoginContent />
    </Suspense>
  );
}
