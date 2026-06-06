"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/providers/auth-provider";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";

const registerSchema = z.object({
  email: z.string().email({ message: "البريد الإلكتروني غير صالح" }),
  password: z.string().min(8, { message: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" }),
  confirmPassword: z.string(),
  first_name_en: z.string().min(2, { message: "الاسم الأول (إنجليزي) مطلوب" }),
  last_name_en: z.string().min(2, { message: "اسم العائلة (إنجليزي) مطلوب" }),
  first_name_ar: z.string().optional(),
  last_name_ar: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "كلمات المرور غير متطابقة",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register: authRegister, loginWithGoogle } = useAuth();
  const router = useRouter();
  
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      first_name_en: "",
      last_name_en: "",
      first_name_ar: "",
      last_name_ar: "",
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      await authRegister({
        email: data.email,
        password: data.password,
        first_name_en: data.first_name_en,
        last_name_en: data.last_name_en,
        first_name_ar: data.first_name_ar || undefined,
        last_name_ar: data.last_name_ar || undefined,
      });
      toast.success("تم إنشاء الحساب بنجاح");
      router.push("/portal");
    } catch (err: any) {
      toast.error(
        err.response?.data?.error?.message ||
          "Registration failed. Please try again."
      );
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);

    try {
      // Dynamically import to keep Firebase out of the initial bundle
      const { signInWithPopup } = await import("firebase/auth");
      const { auth, googleProvider } = await import("@/lib/firebase");

      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      await loginWithGoogle(idToken);
      toast.success("تم إنشاء الحساب وتسجيل الدخول بنجاح");
      router.push("/portal");
    } catch (err: any) {
      // Handle Firebase popup errors gracefully
      if (err.code === "auth/popup-closed-by-user") {
        // User closed the popup — do nothing
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
          إنشاء حساب جديد
        </h2>
        <p className="text-sm text-surface-500">
          سجل كمستخدم جديد في المنصة
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
        {/* Name Row (Arabic) */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="first_name_ar" className="form-label">
              الاسم الأول (عربي)
            </label>
            <input
              id="first_name_ar"
              type="text"
              {...register("first_name_ar")}
              className={`form-input ${errors.first_name_ar ? 'border-red-500 focus:ring-red-500' : ''}`}
              placeholder="أحمد"
            />
            {errors.first_name_ar && <p className="mt-1 text-sm text-red-500">{errors.first_name_ar.message}</p>}
          </div>
          <div>
            <label htmlFor="last_name_ar" className="form-label">
              اسم العائلة (عربي)
            </label>
            <input
              id="last_name_ar"
              type="text"
              {...register("last_name_ar")}
              className={`form-input ${errors.last_name_ar ? 'border-red-500 focus:ring-red-500' : ''}`}
              placeholder="محمد"
            />
            {errors.last_name_ar && <p className="mt-1 text-sm text-red-500">{errors.last_name_ar.message}</p>}
          </div>
        </div>

        {/* Name Row (English) */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="first_name_en" className="form-label">
              الاسم الأول (إنجليزي) *
            </label>
            <input
              id="first_name_en"
              type="text"
              {...register("first_name_en")}
              className={`form-input ${errors.first_name_en ? 'border-red-500 focus:ring-red-500' : ''}`}
              placeholder="Ahmed"
              dir="ltr"
            />
            {errors.first_name_en && <p className="mt-1 text-sm text-red-500">{errors.first_name_en.message}</p>}
          </div>
          <div>
            <label htmlFor="last_name_en" className="form-label">
              اسم العائلة (إنجليزي) *
            </label>
            <input
              id="last_name_en"
              type="text"
              {...register("last_name_en")}
              className={`form-input ${errors.last_name_en ? 'border-red-500 focus:ring-red-500' : ''}`}
              placeholder="Mohammed"
              dir="ltr"
            />
            {errors.last_name_en && <p className="mt-1 text-sm text-red-500">{errors.last_name_en.message}</p>}
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="form-label">
            البريد الإلكتروني *
          </label>
          <input
            id="email"
            type="email"
            {...register("email")}
            className={`form-input ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
            placeholder="your@email.com"
            dir="ltr"
          />
          {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="form-label">
            كلمة المرور *
          </label>
          <input
            id="password"
            type="password"
            {...register("password")}
            className={`form-input ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
            placeholder="••••••••"
            dir="ltr"
          />
          {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="form-label">
            تأكيد كلمة المرور *
          </label>
          <input
            id="confirmPassword"
            type="password"
            {...register("confirmPassword")}
            className={`form-input ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : ''}`}
            placeholder="••••••••"
            dir="ltr"
          />
          {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>}
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
              جاري الإنشاء...
            </span>
          ) : (
            "إنشاء الحساب"
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-surface-500">
          لديك حساب بالفعل؟{" "}
          <Link
            href="/login"
            className="text-primary-600 hover:text-primary-500 font-medium transition-colors"
          >
            تسجيل الدخول
          </Link>
        </p>
      </div>
    </div>
  );
}
