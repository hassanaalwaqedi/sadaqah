"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/providers/auth-provider";

export default function ScholarshipApplyPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { user } = useAuth();
  
  const [cycle, setCycle] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    national_id: "",
    university: "",
    major: "",
    gpa: "",
    academic_year: "1",
    family_income: "",
    family_size: "",
    transcript_file_obj: "",
    id_card_file_obj: "",
    extra_data: {} as Record<string, any>
  });

  // Load existing draft and cycle configuration
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch cycle configuration
        const cycleRes = await apiClient.get(`/scholarships/cycles/${id}`);
        setCycle(cycleRes.data);

        // Fetch user's draft if exists
        try {
          const appRes = await apiClient.get(`/scholarships/cycles/${id}/apply`);
          if (appRes.data) {
            const data = appRes.data;
            if (data.status === "submitted") {
              setHasSubmitted(true);
              setIsLoading(false);
              return;
            }
            setFormData({
              national_id: (user?.profile as any)?.national_id || "",
              university: data.university || "",
              major: data.major || "",
              gpa: data.gpa || "",
              academic_year: data.academic_year || "1",
              family_income: data.family_income || "",
              family_size: data.family_size || "",
              transcript_file_obj: data.transcript_file_obj || "",
              id_card_file_obj: data.id_card_file_obj || "",
              extra_data: data.extra_data || { declaration_accepted: false }
            });
          }
        } catch (error: any) {
          if (error.response?.status === 404) {
            // Pre-fill
            setFormData(prev => ({
              ...prev,
              national_id: (user?.profile as any)?.national_id || "",
              extra_data: { declaration_accepted: false }
            }));
          }
        }
      } catch (error) {
        console.error("Failed to fetch scholarship cycle details", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) fetchData();
  }, [id, user]);

  if (isLoading || !cycle) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (hasSubmitted) {
    return (
      <div className="max-w-3xl mx-auto py-16 animate-fade-in text-center">
        <div className="w-24 h-24 bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50 mb-2">
          لقد قمت بتقديم طلبك بالفعل!
        </h1>
        <p className="text-surface-500 mb-8 max-w-md mx-auto">
          تم استلام طلبك لهذه المنحة بنجاح وهو الآن قيد المراجعة. يمكنك متابعة حالة طلبك من خلال لوحة التحكم.
        </p>
        <button onClick={() => router.push("/portal/my-applications")} className="btn-primary">
          الانتقال إلى طلباتي
        </button>
      </div>
    );
  }

  // Build steps array dynamically
  const config = cycle.configuration || {};
  const dynamicSteps = config.form_steps || [];
  const requiredDocuments = config.documents || [];

  const hasDocumentsStep = requiredDocuments.length > 0;
  
  // Total steps = Dynamic Steps + Documents Step (if any) + Final Review Step
  const totalSteps = dynamicSteps.length + (hasDocumentsStep ? 1 : 0) + 1;

  const handleNext = () => {
    if (step === totalSteps && !formData.extra_data.declaration_accepted) {
      alert("يجب الموافقة على الإقرار قبل المتابعة");
      return;
    }
    setStep((s) => Math.min(s + 1, totalSteps));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handlePrev = () => {
    setStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExtraDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({
      ...formData,
      extra_data: { ...formData.extra_data, [e.target.name]: value }
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    // Placeholder for actual file upload to pre-signed URL logic
    const mockObjectName = `mocked-s3-path/${file.name}`;
    setFormData({
      ...formData,
      extra_data: { ...formData.extra_data, [fieldName]: mockObjectName }
    });
  };

  const saveDraft = async () => {
    setIsSavingDraft(true);
    try {
      const payload = { 
        ...formData, 
        status: "draft",
        gpa: parseFloat(formData.gpa) || 0,
        academic_year: parseInt(formData.academic_year) || 1,
        family_income: parseFloat(formData.family_income) || 0,
        family_size: parseInt(formData.family_size) || 1
      };
      await apiClient.post(`/scholarships/cycles/${id}/apply`, payload);
      alert("تم حفظ كمسودة بنجاح");
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء الحفظ");
    } finally {
      setIsSavingDraft(false);
    }
  };

  const submitApplication = async () => {
    setIsSubmitting(true);
    try {
      const payload = { 
        ...formData, 
        status: "submitted",
        gpa: parseFloat(formData.gpa) || 0,
        academic_year: parseInt(formData.academic_year) || 1,
        family_income: parseFloat(formData.family_income) || 0,
        family_size: parseInt(formData.family_size) || 1
      };
      await apiClient.post(`/scholarships/cycles/${id}/apply`, payload);
      
      alert("تم تقديم الطلب بنجاح! سيتم مراجعته قريباً.");
      router.push("/portal");
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء تقديم الطلب");
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = ((step - 1) / (totalSteps - 1)) * 100;

  // Determine what to render based on current step
  let currentStepContent = null;
  let currentStepTitle = "";

  if (step <= dynamicSteps.length) {
    const dynStep = dynamicSteps[step - 1];
    currentStepTitle = dynStep.title;
    currentStepContent = (
      <div className="space-y-6 animate-fade-in">
        <h3 className="text-lg font-bold border-b border-surface-200 dark:border-surface-700 pb-2">{dynStep.title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {dynStep.fields.map((field: any) => (
            <div key={field.id} className={field.type === 'longtext' ? 'md:col-span-2' : ''}>
              <label className="block text-sm font-medium mb-1">
                {field.label} {field.required && <span className="text-danger-500">*</span>}
              </label>
              
              {field.type === 'text' && (
                <input type="text" name={field.id} value={formData.extra_data[field.id] || ''} onChange={handleExtraDataChange} required={field.required} className="form-input" />
              )}
              {field.type === 'number' && (
                <input type="number" name={field.id} value={formData.extra_data[field.id] || ''} onChange={handleExtraDataChange} required={field.required} className="form-input" />
              )}
              {field.type === 'date' && (
                <input type="date" name={field.id} value={formData.extra_data[field.id] || ''} onChange={handleExtraDataChange} required={field.required} className="form-input" />
              )}
              {field.type === 'longtext' && (
                <textarea name={field.id} value={formData.extra_data[field.id] || ''} onChange={handleExtraDataChange} required={field.required} rows={4} className="form-input" />
              )}
              {field.type === 'select' && (
                <select name={field.id} value={formData.extra_data[field.id] || ''} onChange={handleExtraDataChange} required={field.required} className="form-input">
                  <option value="">اختر...</option>
                  {(field.options || []).map((opt: string, i: number) => <option key={i} value={opt}>{opt}</option>)}
                </select>
              )}
              {field.type === 'checkbox' && (
                <label className="flex items-center gap-2 mt-2">
                  <input type="checkbox" name={field.id} checked={formData.extra_data[field.id] || false} onChange={handleExtraDataChange} required={field.required} className="rounded text-primary-600" />
                  <span className="text-sm">نعم</span>
                </label>
              )}
              {field.type === 'file' && (
                <div>
                  <input type="file" onChange={(e) => handleFileUpload(e, field.id)} required={field.required && !formData.extra_data[field.id]} className="block w-full text-sm text-surface-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
                  {formData.extra_data[field.id] && <p className="text-xs text-success-600 mt-2">✓ تم الإرفاق</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  } else if (hasDocumentsStep && step === dynamicSteps.length + 1) {
    currentStepTitle = "المرفقات المطلوبة";
    currentStepContent = (
      <div className="space-y-6 animate-fade-in">
        <h3 className="text-lg font-bold border-b border-surface-200 dark:border-surface-700 pb-2">{currentStepTitle}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {requiredDocuments.map((doc: any) => (
            <div key={doc.id} className="border border-surface-200 dark:border-surface-700 rounded-xl p-4">
              <label className="block text-sm font-medium mb-2">{doc.name} {doc.required && <span className="text-danger-500">*</span>}</label>
              <input 
                type="file" 
                accept=".pdf,.jpg,.png"
                onChange={(e) => handleFileUpload(e, `doc_${doc.id}`)} 
                required={doc.required && !formData.extra_data[`doc_${doc.id}`]}
                className="block w-full text-sm text-surface-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" 
              />
              {formData.extra_data[`doc_${doc.id}`] && <p className="text-xs text-success-600 mt-2">✓ تم الإرفاق</p>}
            </div>
          ))}
        </div>
      </div>
    );
  } else {
    currentStepTitle = "المراجعة والإقرار النهائي";
    currentStepContent = (
      <div className="space-y-8 animate-fade-in">
        <h3 className="text-lg font-bold border-b border-surface-200 dark:border-surface-700 pb-2">{currentStepTitle}</h3>
        
        <div className="bg-surface-50 dark:bg-surface-800/50 p-6 rounded-xl border border-surface-200 dark:border-surface-700 space-y-4">
          <h4 className="font-bold text-surface-900 dark:text-surface-100">ملخص الطلب</h4>
          <p className="text-sm text-surface-500">تم حفظ جميع بياناتك بنجاح. يرجى قراءة الإقرار والموافقة عليه لتقديم الطلب.</p>
        </div>

        <div className="flex items-start gap-3 mt-6">
          <input 
            type="checkbox" 
            id="declaration" 
            name="declaration_accepted" 
            checked={formData.extra_data.declaration_accepted}
            onChange={handleExtraDataChange}
            className="mt-1 w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
          />
          <label htmlFor="declaration" className="text-sm text-surface-700 dark:text-surface-300 leading-relaxed cursor-pointer">
            أقر بأن جميع البيانات والمستندات المقدمة في هذا الطلب صحيحة ودقيقة. وأتفهم أن أي تقديم لمعلومات خاطئة قد يؤدي إلى استبعادي من المنحة أو إلغائها لاحقاً.
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
            تقديم طلب المنحة: {cycle.name_ar}
          </h1>
          <p className="text-sm text-surface-500 mt-1">
            يرجى إكمال جميع الخطوات بدقة.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={saveDraft} 
            disabled={isSavingDraft}
            className="btn-outline text-sm"
          >
            {isSavingDraft ? "جاري الحفظ..." : "حفظ كمسودة"}
          </button>
        </div>
      </div>

      {/* Progress & Stepper */}
      <div className="bg-surface-50 dark:bg-surface-900 rounded-2xl p-6 shadow-sm border border-surface-200 dark:border-surface-800">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-primary-600 dark:text-primary-400">
            الخطوة {step} من {totalSteps}: {currentStepTitle}
          </h2>
          <span className="text-sm font-medium text-surface-500">{Math.round(progress)}% مكتمل</span>
        </div>
        <div className="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-2.5">
          <div className="bg-primary-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      {/* Form Container */}
      <div className="glass-card p-6 md:p-8">
        {currentStepContent}
      </div>

      {/* Navigation Actions */}
      <div className="flex justify-between items-center mt-8">
        <button
          onClick={handlePrev}
          disabled={step === 1 || isSubmitting}
          className="btn-outline px-8 disabled:opacity-50"
        >
          السابق
        </button>

        {step < totalSteps ? (
          <button
            onClick={handleNext}
            className="btn-primary px-8"
          >
            التالي
          </button>
        ) : (
          <button
            onClick={submitApplication}
            disabled={isSubmitting || !formData.extra_data.declaration_accepted}
            className="btn-primary px-10 bg-success-600 hover:bg-success-700 disabled:opacity-50"
          >
            {isSubmitting ? "جاري التقديم..." : "تقديم الطلب النهائي"}
          </button>
        )}
      </div>
    </div>
  );
}
