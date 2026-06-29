"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { Trophy, CheckCircle } from "lucide-react";

export default function InnovationApplyPage() {
  const params = useParams();
  const router = useRouter();
  
  const [competition, setCompetition] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  
  // Basic Fields
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [description, setDescription] = useState("");
  
  // Dynamic Fields
  const [extraData, setExtraData] = useState<Record<string, any>>({});

  useEffect(() => {
    async function loadData() {
      try {
        const eventRes = await apiClient.get(`/innovation/events/${params.id}`);
        setCompetition(eventRes.data);

        // Optional: Check if already submitted (Not implemented in backend yet for single submission per user per event, but let's assume standard flow)
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    if (params.id) loadData();
  }, [params.id]);

  const handleDynamicChange = (fieldId: string, value: any) => {
    setExtraData(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      
      const payload = {
        category_id: params.id, // Using event ID as category ID for simplicity in this version, ideally we'd select a category
        title,
        abstract,
        description,
        extra_data: extraData
      };

      await apiClient.post(`/innovation/events/${params.id}/submit`, payload);
      setHasSubmitted(true);
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء التقديم. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center">جاري التحميل...</div>;
  if (!competition) return <div className="p-8 text-center text-red-500">حدث خطأ. المسابقة غير موجودة.</div>;

  if (hasSubmitted) {
    return (
      <div className="max-w-xl mx-auto mt-12 animate-in zoom-in-95">
        <div className="glass-card p-12 text-center">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-surface-900 mb-2">تم تقديم مشروعك بنجاح!</h2>
          <p className="text-surface-600 mb-8">
            نتمنى لك التوفيق في المسابقة. يمكنك متابعة حالة طلبك من خلال لوحة التحكم.
          </p>
          <button 
            onClick={() => router.push("/portal")}
            className="btn-gradient px-8 py-3"
          >
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  const formSteps = competition.configuration?.form_steps || [];

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="text-center">
        <Trophy className="w-12 h-12 text-primary-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold gradient-text mb-2">تقديم مشروع: {competition.name_ar}</h1>
        <p className="text-surface-600 dark:text-surface-400">الرجاء إكمال جميع الحقول المطلوبة بدقة.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Project Info */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-xl font-bold mb-4">معلومات المشروع الأساسية</h2>
          <div>
            <label className="text-sm font-medium mb-1 block">اسم المشروع *</label>
            <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="form-input" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">ملخص الفكرة (Abstract) *</label>
            <textarea required value={abstract} onChange={e => setAbstract(e.target.value)} className="form-input" rows={3}></textarea>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">الوصف التفصيلي</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} className="form-input" rows={5}></textarea>
          </div>
        </div>

        {/* Dynamic Steps */}
        {formSteps.map((step: any, sIdx: number) => (
          <div key={step.id} className="glass-card p-6 space-y-4">
            <h2 className="text-xl font-bold mb-4">{sIdx + 1}. {step.title}</h2>
            {step.fields.map((field: any) => (
              <div key={field.id}>
                <label className="text-sm font-medium mb-1 block">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                
                {field.type === 'text' && (
                  <input type="text" required={field.required} onChange={e => handleDynamicChange(field.id, e.target.value)} className="form-input" />
                )}
                {field.type === 'longtext' && (
                  <textarea required={field.required} onChange={e => handleDynamicChange(field.id, e.target.value)} className="form-input" rows={4}></textarea>
                )}
                {field.type === 'number' && (
                  <input type="number" required={field.required} onChange={e => handleDynamicChange(field.id, e.target.value)} className="form-input" />
                )}
                {field.type === 'select' && (
                  <select required={field.required} onChange={e => handleDynamicChange(field.id, e.target.value)} className="form-input">
                    <option value="">اختر...</option>
                    {(field.options || []).map((opt: string, i: number) => (
                      <option key={i} value={opt}>{opt}</option>
                    ))}
                  </select>
                )}
                {field.type === 'checkbox' && (
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id={field.id} required={field.required} onChange={e => handleDynamicChange(field.id, e.target.checked)} className="rounded border-surface-300" />
                    <label htmlFor={field.id} className="text-sm cursor-pointer">نعم / موافق</label>
                  </div>
                )}
                {field.type === 'date' && (
                  <input type="date" required={field.required} onChange={e => handleDynamicChange(field.id, e.target.value)} className="form-input" />
                )}
                {field.type === 'file' && (
                  <input type="file" required={field.required} onChange={e => handleDynamicChange(field.id, "FILE_UPLOADED_NOT_IMPLEMENTED_YET")} className="form-input" />
                )}
              </div>
            ))}
          </div>
        ))}

        {/* Required Documents */}
        {(competition.configuration?.documents?.length > 0) && (
          <div className="glass-card p-6 space-y-4">
            <h2 className="text-xl font-bold mb-4">المستندات المطلوبة</h2>
            {competition.configuration.documents.map((doc: any, dIdx: number) => (
              <div key={doc.id || dIdx} className="p-4 border border-surface-200 dark:border-surface-700 rounded-xl bg-surface-50 dark:bg-surface-800/50">
                <label className="text-sm font-medium mb-2 block">
                  {doc.name} {doc.required && <span className="text-red-500">*</span>}
                </label>
                <div className="flex items-center gap-4">
                  <input 
                    type="file" 
                    required={doc.required} 
                    onChange={e => handleDynamicChange(`doc_${doc.id}`, "FILE_UPLOADED_NOT_IMPLEMENTED_YET")} 
                    className="form-input flex-1" 
                  />
                  <span className="text-xs text-surface-500">حجم الملف الأقصى: 10MB</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-4">
          <button type="submit" disabled={isSubmitting} className="w-full btn-gradient py-3 text-lg font-bold">
            {isSubmitting ? "جاري الإرسال..." : "اعتماد وتقديم المشروع"}
          </button>
        </div>
      </form>
    </div>
  );
}
