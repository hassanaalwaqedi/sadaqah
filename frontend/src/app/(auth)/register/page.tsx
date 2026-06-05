"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    first_name_en: "",
    last_name_en: "",
    first_name_ar: "",
    last_name_ar: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("كلمات المرور غير متطابقة");
      return;
    }

    if (formData.password.length < 8) {
      setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      return;
    }

    setIsLoading(true);

    try {
      await register({
        email: formData.email,
        password: formData.password,
        first_name_en: formData.first_name_en,
        last_name_en: formData.last_name_en,
        first_name_ar: formData.first_name_ar || undefined,
        last_name_ar: formData.last_name_ar || undefined,
      });
      router.push("/");
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-50 mb-1">
        إنشاء حساب جديد
      </h2>
      <p className="text-sm text-surface-500 mb-6">Create your account</p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Row (Arabic) */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="first_name_ar" className="form-label">
              الاسم الأول (عربي)
            </label>
            <input
              id="first_name_ar"
              name="first_name_ar"
              type="text"
              value={formData.first_name_ar}
              onChange={handleChange}
              className="form-input"
              placeholder="أحمد"
            />
          </div>
          <div>
            <label htmlFor="last_name_ar" className="form-label">
              اسم العائلة (عربي)
            </label>
            <input
              id="last_name_ar"
              name="last_name_ar"
              type="text"
              value={formData.last_name_ar}
              onChange={handleChange}
              className="form-input"
              placeholder="محمد"
            />
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
              name="first_name_en"
              type="text"
              value={formData.first_name_en}
              onChange={handleChange}
              className="form-input"
              placeholder="Ahmed"
              required
              dir="ltr"
            />
          </div>
          <div>
            <label htmlFor="last_name_en" className="form-label">
              اسم العائلة (إنجليزي) *
            </label>
            <input
              id="last_name_en"
              name="last_name_en"
              type="text"
              value={formData.last_name_en}
              onChange={handleChange}
              className="form-input"
              placeholder="Mohammed"
              required
              dir="ltr"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="form-label">
            البريد الإلكتروني *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            className="form-input"
            placeholder="your@email.com"
            required
            dir="ltr"
          />
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="form-label">
            كلمة المرور *
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            className="form-input"
            placeholder="••••••••"
            required
            minLength={8}
            dir="ltr"
          />
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="form-label">
            تأكيد كلمة المرور *
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="form-input"
            placeholder="••••••••"
            required
            dir="ltr"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-gradient w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
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
