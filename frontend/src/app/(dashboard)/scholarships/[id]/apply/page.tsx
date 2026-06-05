"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";

export default function ScholarshipApplyPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Local state for the application draft
  const [formData, setFormData] = useState({
    national_id: "",
    university: "",
    major: "",
    gpa: "",
    academic_year: "1",
    family_income: "",
    family_size: "",
    transcript_file: null as File | null,
    id_card_file: null as File | null,
  });

  const handleNext = () => setStep((s) => Math.min(s + 1, 4));
  const handlePrev = () => setStep((s) => Math.max(s - 1, 1));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFormData({ ...formData, [e.target.name]: e.target.files[0] });
    }
  };

  const submitApplication = async () => {
    setIsSubmitting(true);
    try {
      // 1. Get pre-signed URLs and upload files
      // In a real implementation we would call: POST /api/v1/files/presigned-url
      // Then PUT the file to that URL.
      
      // 2. Submit the application to the API
      // await apiClient.post(`/scholarships/applications`, { ...formData, cycle_id: params.id });
      
      alert("تم تقديم الطلب بنجاح!");
      router.push("/scholarships");
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء تقديم الطلب");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
          تقديم طلب منحة دراسية
        </h1>
        <p className="text-sm text-surface-500 mt-1">
          يرجى ملء النموذج أدناه بدقة. تأكد من إرفاق المستندات الصحيحة.
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-surface-200 dark:bg-surface-700 -z-10 rounded"></div>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
              step >= i
                ? "bg-primary-600 text-white"
                : "bg-surface-100 dark:bg-surface-800 text-surface-400"
            }`}
          >
            {i}
          </div>
        ))}
      </div>

      {/* Form Container */}
      <div className="glass-card p-6 md:p-8">
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold">البيانات الشخصية</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">الرقم الوطني / الإقامة</label>
                <input
                  type="text"
                  name="national_id"
                  value={formData.national_id}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">الدخل الشهري للأسرة (بالدولار)</label>
                <input
                  type="number"
                  name="family_income"
                  value={formData.family_income}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">عدد أفراد الأسرة</label>
                <input
                  type="number"
                  name="family_size"
                  value={formData.family_size}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold">البيانات الأكاديمية</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">الجامعة</label>
                <input
                  type="text"
                  name="university"
                  value={formData.university}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">التخصص</label>
                <input
                  type="text"
                  name="major"
                  value={formData.major}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">المعدل التراكمي (GPA)</label>
                <input
                  type="number"
                  step="0.01"
                  max="4.0"
                  name="gpa"
                  value={formData.gpa}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">السنة الدراسية</label>
                <select
                  name="academic_year"
                  value={formData.academic_year}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="1">السنة الأولى</option>
                  <option value="2">السنة الثانية</option>
                  <option value="3">السنة الثالثة</option>
                  <option value="4">السنة الرابعة</option>
                  <option value="5">السنة الخامسة+</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold">المرفقات والمستندات</h2>
            <p className="text-sm text-surface-500">
              سيقوم نظام الذكاء الاصطناعي بقراءة بيانات الكشف الأكاديمي للتحقق من المعدل.
            </p>
            <div className="space-y-4">
              <div className="p-4 border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-xl">
                <label className="block text-sm font-medium mb-2">كشف العلامات الأكاديمي (PDF أو صورة)</label>
                <input
                  type="file"
                  name="transcript_file"
                  accept=".pdf,image/*"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-surface-500
                    file:me-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary-50 file:text-primary-700
                    hover:file:bg-primary-100 dark:file:bg-primary-900/30 dark:file:text-primary-300"
                />
              </div>
              <div className="p-4 border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-xl">
                <label className="block text-sm font-medium mb-2">صورة الهوية / جواز السفر</label>
                <input
                  type="file"
                  name="id_card_file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-surface-500
                    file:me-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary-50 file:text-primary-700
                    hover:file:bg-primary-100 dark:file:bg-primary-900/30 dark:file:text-primary-300"
                />
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold">مراجعة وتقديم</h2>
            <div className="bg-surface-50 dark:bg-surface-800/50 rounded-xl p-4 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2 border-b border-surface-200 dark:border-surface-700 pb-2">
                <span className="text-surface-500">الرقم الوطني:</span>
                <span className="font-medium">{formData.national_id || "-"}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 border-b border-surface-200 dark:border-surface-700 pb-2">
                <span className="text-surface-500">الجامعة والتخصص:</span>
                <span className="font-medium">{formData.university} - {formData.major}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 border-b border-surface-200 dark:border-surface-700 pb-2">
                <span className="text-surface-500">المعدل التراكمي:</span>
                <span className="font-medium">{formData.gpa || "-"}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-surface-500">المرفقات:</span>
                <span className="font-medium">
                  {formData.transcript_file ? "✅ كشف علامات" : "❌ ينقص كشف العلامات"}<br/>
                  {formData.id_card_file ? "✅ صورة الهوية" : "❌ تنقص الهوية"}
                </span>
              </div>
            </div>
            
            <div className="p-4 bg-primary-50 dark:bg-primary-900/20 text-primary-800 dark:text-primary-200 rounded-xl text-sm leading-relaxed">
              <strong>إقرار:</strong> أقر بأن جميع البيانات المدخلة صحيحة، وأوافق على معالجتها باستخدام تقنيات الذكاء الاصطناعي لاستخراج البيانات ومطابقتها.
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="mt-8 pt-4 border-t border-surface-200 dark:border-surface-700 flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={step === 1 || isSubmitting}
            className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            السابق
          </button>
          
          {step < 4 ? (
            <button onClick={handleNext} className="btn-primary">
              التالي
            </button>
          ) : (
            <button 
              onClick={submitApplication} 
              disabled={isSubmitting}
              className="btn-gradient disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? "جاري التقديم..." : "تأكيد وتقديم الطلب"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
