"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { Plus, Trash, ArrowLeft, ArrowRight, Save, LayoutTemplate } from "lucide-react";

// Define our types
type FieldType = 'text' | 'longtext' | 'number' | 'date' | 'select' | 'checkbox' | 'file';

interface FormField {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  options?: string[]; // for select
}

interface FormStep {
  id: string;
  title: string;
  fields: FormField[];
}

interface DocumentReq {
  id: string;
  name: string;
  required: boolean;
}

interface JudgingCriteria {
  id: string;
  name: string;
  weight: number;
}

export default function InnovationBuilderPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic'|'details'|'eligibility'|'documents'|'judging'|'form'>('basic');

  // Basic Info
  const [basicInfo, setBasicInfo] = useState({
    name_ar: "",
    name_en: "",
    description: "",
    submission_deadline: "",
  });

  // Details
  const [details, setDetails] = useState({
    category: "Artificial Intelligence",
    min_team_size: 1,
    max_team_size: 5,
    short_description: "",
  });

  // Eligibility
  const [eligibility, setEligibility] = useState({
    academic_level: "",
    special_conditions: ""
  });

  // Documents
  const [documents, setDocuments] = useState<DocumentReq[]>([]);
  
  // Judging
  const [judging, setJudging] = useState<JudgingCriteria[]>([
    { id: crypto.randomUUID(), name: "Innovation", weight: 40 },
    { id: crypto.randomUUID(), name: "Technical Execution", weight: 30 },
    { id: crypto.randomUUID(), name: "Market Potential", weight: 30 },
  ]);

  // Dynamic Form Steps
  const [formSteps, setFormSteps] = useState<FormStep[]>([]);

  // Helpers
  const handleBasicChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setBasicInfo({...basicInfo, [e.target.name]: e.target.value});
  };

  const handleDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setDetails({...details, [e.target.name]: e.target.value});
  };

  const handleEligibilityChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEligibility({...eligibility, [e.target.name]: e.target.value});
  };

  const addDocument = () => {
    setDocuments([...documents, { id: crypto.randomUUID(), name: "", required: true }]);
  };

  const updateDocument = (id: string, field: keyof DocumentReq, value: any) => {
    setDocuments(documents.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  const removeDocument = (id: string) => {
    setDocuments(documents.filter(d => d.id !== id));
  };

  const addCriteria = () => {
    setJudging([...judging, { id: crypto.randomUUID(), name: "", weight: 10 }]);
  };

  const updateCriteria = (id: string, field: keyof JudgingCriteria, value: any) => {
    setJudging(judging.map(j => j.id === id ? { ...j, [field]: value } : j));
  };

  const removeCriteria = (id: string) => {
    setJudging(judging.filter(j => j.id !== id));
  };

  // Form Builders
  const addStep = () => {
    setFormSteps([...formSteps, { id: crypto.randomUUID(), title: "مرحلة جديدة", fields: [] }]);
  };

  const updateStepTitle = (id: string, title: string) => {
    setFormSteps(formSteps.map(s => s.id === id ? { ...s, title } : s));
  };

  const removeStep = (id: string) => {
    setFormSteps(formSteps.filter(s => s.id !== id));
  };

  const addField = (stepId: string) => {
    setFormSteps(formSteps.map(s => {
      if (s.id === stepId) {
        return {
          ...s,
          fields: [...s.fields, { id: crypto.randomUUID(), type: 'text', label: "سؤال جديد", required: true }]
        };
      }
      return s;
    }));
  };

  const updateField = (stepId: string, fieldId: string, updates: Partial<FormField>) => {
    setFormSteps(formSteps.map(s => {
      if (s.id === stepId) {
        return {
          ...s,
          fields: s.fields.map(f => f.id === fieldId ? { ...f, ...updates } : f)
        };
      }
      return s;
    }));
  };

  const removeField = (stepId: string, fieldId: string) => {
    setFormSteps(formSteps.map(s => {
      if (s.id === stepId) {
        return {
          ...s,
          fields: s.fields.filter(f => f.id !== fieldId)
        };
      }
      return s;
    }));
  };

  const addOption = (stepId: string, fieldId: string) => {
    setFormSteps(formSteps.map(s => {
      if (s.id === stepId) {
        return {
          ...s,
          fields: s.fields.map(f => {
            if (f.id === fieldId) {
              return { ...f, options: [...(f.options || []), "خيار جديد"] };
            }
            return f;
          })
        };
      }
      return s;
    }));
  };

  const updateOption = (stepId: string, fieldId: string, optIndex: number, val: string) => {
    setFormSteps(formSteps.map(s => {
      if (s.id === stepId) {
        return {
          ...s,
          fields: s.fields.map(f => {
            if (f.id === fieldId && f.options) {
              const newOpts = [...f.options];
              newOpts[optIndex] = val;
              return { ...f, options: newOpts };
            }
            return f;
          })
        };
      }
      return s;
    }));
  };

  const removeOption = (stepId: string, fieldId: string, optIndex: number) => {
    setFormSteps(formSteps.map(s => {
      if (s.id === stepId) {
        return {
          ...s,
          fields: s.fields.map(f => {
            if (f.id === fieldId && f.options) {
              const newOpts = [...f.options];
              newOpts.splice(optIndex, 1);
              return { ...f, options: newOpts };
            }
            return f;
          })
        };
      }
      return s;
    }));
  };

  // Submit
  const handlePublish = async () => {
    if (!basicInfo.name_ar || !basicInfo.submission_deadline) {
      alert("يرجى تعبئة الحقول الإجبارية (الاسم والموعد النهائي).");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        name_en: basicInfo.name_en || basicInfo.name_ar,
        name_ar: basicInfo.name_ar,
        description: basicInfo.description,
        submission_deadline: new Date(basicInfo.submission_deadline).toISOString(),
        configuration: {
          details,
          eligibility,
          documents,
          judging_criteria: judging,
          form_steps: formSteps
        }
      };

      await apiClient.post("/innovation/events", payload);
      router.push("/portal/admin/innovation");
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء حفظ المسابقة.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div className="flex justify-between items-center bg-white dark:bg-surface-900 p-6 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-800">
        <div>
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <LayoutTemplate className="w-6 h-6 text-primary-500" /> منشئ المسابقات
          </h1>
          <p className="text-surface-600 dark:text-surface-400 mt-1">بناء مسابقة ابتكار جديدة بجميع مراحلها ونماذجها.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => router.back()} className="btn-outline px-4 py-2">إلغاء</button>
          <button 
            onClick={handlePublish}
            disabled={isSubmitting}
            className="btn-gradient px-6 py-2 flex items-center gap-2"
          >
            {isSubmitting ? "جاري الحفظ..." : <><Save className="w-4 h-4" /> نشر المسابقة</>}
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Nav */}
        <div className="w-64 shrink-0">
          <div className="glass-card p-2 flex flex-col gap-1 sticky top-6">
            {[
              { id: 'basic', label: 'المعلومات الأساسية' },
              { id: 'details', label: 'التفاصيل والوصف' },
              { id: 'eligibility', label: 'شروط التقديم' },
              { id: 'documents', label: 'المستندات المطلوبة' },
              { id: 'judging', label: 'معايير التحكيم' },
              { id: 'form', label: 'نموذج التقديم (مخصص)' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`p-3 rounded-xl text-right transition-colors ${
                  activeTab === tab.id 
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-bold' 
                  : 'text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 min-w-0">
          <div className="glass-card p-6 min-h-[500px]">
            {activeTab === 'basic' && (
              <div className="space-y-6 animate-in slide-in-from-right-4">
                <h2 className="text-xl font-bold">المعلومات الأساسية</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">اسم المسابقة (بالعربية) *</label>
                    <input type="text" name="name_ar" value={basicInfo.name_ar} onChange={handleBasicChange} className="form-input mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">اسم المسابقة (بالإنجليزية)</label>
                    <input type="text" name="name_en" value={basicInfo.name_en} onChange={handleBasicChange} className="form-input mt-1" dir="ltr" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium">وصف مختصر</label>
                    <textarea name="description" value={basicInfo.description} onChange={handleBasicChange} className="form-input mt-1" rows={3}></textarea>
                  </div>
                  <div>
                    <label className="text-sm font-medium">الموعد النهائي للتقديم *</label>
                    <input type="datetime-local" name="submission_deadline" value={basicInfo.submission_deadline} onChange={handleBasicChange} className="form-input mt-1" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'details' && (
              <div className="space-y-6 animate-in slide-in-from-right-4">
                <h2 className="text-xl font-bold">التفاصيل والوصف</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">الفئة</label>
                    <input type="text" name="category" value={details.category} onChange={handleDetailsChange} className="form-input mt-1" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-sm font-medium">الحد الأدنى للفريق</label>
                      <input type="number" name="min_team_size" value={details.min_team_size} onChange={handleDetailsChange} className="form-input mt-1" min={1} />
                    </div>
                    <div>
                      <label className="text-sm font-medium">الحد الأقصى للفريق</label>
                      <input type="number" name="max_team_size" value={details.max_team_size} onChange={handleDetailsChange} className="form-input mt-1" min={1} />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium">نبذة عن المسابقة والتحديات (يظهر للطلاب)</label>
                    <textarea name="short_description" value={details.short_description} onChange={handleDetailsChange} className="form-input mt-1" rows={8}></textarea>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'eligibility' && (
              <div className="space-y-6 animate-in slide-in-from-right-4">
                <h2 className="text-xl font-bold">شروط التقديم والأهلية</h2>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-sm font-medium">المستوى الأكاديمي المطلوب</label>
                    <input type="text" name="academic_level" placeholder="مثال: بكالوريوس، دراسات عليا..." value={eligibility.academic_level} onChange={handleEligibilityChange} className="form-input mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">شروط خاصة أخرى</label>
                    <textarea name="special_conditions" value={eligibility.special_conditions} onChange={handleEligibilityChange} className="form-input mt-1" rows={4} placeholder="- أن يكون المشروع في مجال الذكاء الاصطناعي..."></textarea>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="space-y-6 animate-in slide-in-from-right-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold">المستندات المطلوبة</h2>
                  <button onClick={addDocument} className="btn-outline px-3 py-1 text-sm flex items-center gap-1">
                    <Plus className="w-4 h-4" /> إضافة مستند
                  </button>
                </div>
                
                {documents.length === 0 ? (
                  <div className="p-8 text-center text-surface-500 border-2 border-dashed border-surface-200 rounded-xl">
                    لا توجد مستندات مطلوبة للتقديم.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {documents.map((doc, idx) => (
                      <div key={doc.id} className="flex gap-4 items-end p-4 bg-surface-50 dark:bg-surface-800 rounded-xl">
                        <div className="flex-1">
                          <label className="text-xs font-medium text-surface-500 mb-1 block">اسم المستند (مثال: نموذج العرض التقديمي)</label>
                          <input type="text" value={doc.name} onChange={(e) => updateDocument(doc.id, 'name', e.target.value)} className="form-input" />
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <input type="checkbox" id={`req-${doc.id}`} checked={doc.required} onChange={(e) => updateDocument(doc.id, 'required', e.target.checked)} className="rounded border-surface-300 text-primary-600 focus:ring-primary-600" />
                          <label htmlFor={`req-${doc.id}`} className="text-sm cursor-pointer">مطلوب إجبارياً</label>
                        </div>
                        <button onClick={() => removeDocument(doc.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg mb-1">
                          <Trash className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'judging' && (
              <div className="space-y-6 animate-in slide-in-from-right-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold">معايير التحكيم والتسجيل</h2>
                  <button onClick={addCriteria} className="btn-outline px-3 py-1 text-sm flex items-center gap-1">
                    <Plus className="w-4 h-4" /> إضافة معيار
                  </button>
                </div>
                
                <div className="space-y-3">
                  {judging.map((crit, idx) => (
                    <div key={crit.id} className="flex gap-4 items-end p-4 bg-surface-50 dark:bg-surface-800 rounded-xl">
                      <div className="flex-1">
                        <label className="text-xs font-medium text-surface-500 mb-1 block">المعيار (مثال: الابتكار والتفرد)</label>
                        <input type="text" value={crit.name} onChange={(e) => updateCriteria(crit.id, 'name', e.target.value)} className="form-input" />
                      </div>
                      <div className="w-32">
                        <label className="text-xs font-medium text-surface-500 mb-1 block">الوزن (النقاط)</label>
                        <input type="number" value={crit.weight} onChange={(e) => updateCriteria(crit.id, 'weight', parseInt(e.target.value))} className="form-input" min={1} />
                      </div>
                      <button onClick={() => removeCriteria(crit.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg mb-1">
                        <Trash className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                  <div className="p-4 flex justify-between font-bold text-surface-600">
                    <span>إجمالي النقاط:</span>
                    <span className={judging.reduce((sum, c) => sum + (c.weight||0), 0) !== 100 ? "text-amber-500" : "text-emerald-500"}>
                      {judging.reduce((sum, c) => sum + (c.weight||0), 0)} / 100
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'form' && (
              <div className="space-y-6 animate-in slide-in-from-right-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold">نموذج التقديم المخصص</h2>
                    <p className="text-sm text-surface-500 mt-1">قم ببناء نموذج تقديم المشروع الديناميكي خطوة بخطوة.</p>
                  </div>
                  <button onClick={addStep} className="btn-gradient px-4 py-2 flex items-center gap-2 text-sm">
                    <Plus className="w-4 h-4" /> خطوة جديدة
                  </button>
                </div>

                {formSteps.length === 0 ? (
                  <div className="p-12 text-center text-surface-500 border-2 border-dashed border-surface-200 rounded-xl">
                    لا يوجد نموذج مخصص حالياً. انقر على "خطوة جديدة" للبدء بإنشاء نموذج التقديم.
                  </div>
                ) : (
                  <div className="space-y-8">
                    {formSteps.map((step, sIdx) => (
                      <div key={step.id} className="border border-surface-200 dark:border-surface-700 rounded-2xl overflow-hidden bg-white dark:bg-surface-800">
                        {/* Step Header */}
                        <div className="bg-surface-50 dark:bg-surface-900/50 p-4 border-b border-surface-200 dark:border-surface-700 flex justify-between items-center">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-sm">
                              {sIdx + 1}
                            </div>
                            <input 
                              type="text" 
                              value={step.title} 
                              onChange={(e) => updateStepTitle(step.id, e.target.value)} 
                              className="form-input bg-white dark:bg-surface-800 w-64 text-sm font-bold" 
                              placeholder="عنوان الخطوة"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => addField(step.id)} className="btn-outline px-3 py-1 text-xs">إضافة سؤال</button>
                            <button onClick={() => removeStep(step.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash className="w-4 h-4"/></button>
                          </div>
                        </div>

                        {/* Fields */}
                        <div className="p-4 space-y-4">
                          {step.fields.length === 0 ? (
                            <p className="text-sm text-surface-400 text-center py-4">لا توجد أسئلة في هذه الخطوة.</p>
                          ) : (
                            step.fields.map((field, fIdx) => (
                              <div key={field.id} className="flex gap-4 items-start p-4 bg-surface-50 dark:bg-surface-900/20 rounded-xl border border-surface-100 dark:border-surface-800">
                                <div className="flex-1 space-y-3">
                                  <div className="flex gap-4">
                                    <div className="flex-1">
                                      <label className="text-xs text-surface-500 mb-1 block">السؤال</label>
                                      <input type="text" value={field.label} onChange={(e) => updateField(step.id, field.id, {label: e.target.value})} className="form-input text-sm" />
                                    </div>
                                    <div className="w-40">
                                      <label className="text-xs text-surface-500 mb-1 block">نوع الحقل</label>
                                      <select value={field.type} onChange={(e) => updateField(step.id, field.id, {type: e.target.value as FieldType})} className="form-input text-sm">
                                        <option value="text">نص قصير</option>
                                        <option value="longtext">نص طويل (فقرة)</option>
                                        <option value="number">رقم</option>
                                        <option value="date">تاريخ</option>
                                        <option value="select">قائمة منسدلة</option>
                                        <option value="checkbox">مربع اختيار</option>
                                        <option value="file">مرفق ملف</option>
                                      </select>
                                    </div>
                                    <div className="flex items-center gap-2 mt-6">
                                      <input type="checkbox" id={`req-${field.id}`} checked={field.required} onChange={(e) => updateField(step.id, field.id, {required: e.target.checked})} className="rounded border-surface-300" />
                                      <label htmlFor={`req-${field.id}`} className="text-xs cursor-pointer">مطلوب</label>
                                    </div>
                                  </div>

                                  {/* Select Options Builder */}
                                  {field.type === 'select' && (
                                    <div className="bg-white dark:bg-surface-800 p-3 rounded-lg border border-surface-200 dark:border-surface-700">
                                      <div className="flex justify-between items-center mb-2">
                                        <label className="text-xs font-medium">الخيارات</label>
                                        <button onClick={() => addOption(step.id, field.id)} className="text-primary-600 text-xs flex items-center gap-1 hover:underline">
                                          <Plus className="w-3 h-3"/> إضافة خيار
                                        </button>
                                      </div>
                                      <div className="space-y-2">
                                        {(field.options || []).map((opt, oIdx) => (
                                          <div key={oIdx} className="flex gap-2">
                                            <input type="text" value={opt} onChange={(e) => updateOption(step.id, field.id, oIdx, e.target.value)} className="form-input text-xs py-1" />
                                            <button onClick={() => removeOption(step.id, field.id, oIdx)} className="text-red-500 hover:text-red-600"><Trash className="w-3 h-3"/></button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                </div>
                                <button onClick={() => removeField(step.id, field.id)} className="text-red-500 p-2 hover:bg-red-50 rounded-lg mt-5">
                                  <Trash className="w-4 h-4"/>
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
