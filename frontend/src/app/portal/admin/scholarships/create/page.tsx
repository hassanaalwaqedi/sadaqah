"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";

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

export default function ScholarshipBuilderPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic'|'details'|'eligibility'|'documents'|'form'>('basic');

  // Basic Info
  const [basicInfo, setBasicInfo] = useState({
    name_ar: "",
    name_en: "",
    description: "",
    academic_year: "2026/2027",
    application_start: "",
    application_deadline: "",
    total_quota: 100
  });

  // Details
  const [details, setDetails] = useState({
    category: "منح البكالوريوس",
    funding_type: "تمويل كامل",
    academic_level: "بكالوريوس",
    short_description: "",
    about: "",
  });

  // Eligibility
  const [eligibility, setEligibility] = useState({
    min_gpa: "",
    nationalities: "",
    special_conditions: ""
  });

  // Documents
  const [documents, setDocuments] = useState<DocumentReq[]>([]);
  
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

  // Document Builders
  const addDocument = () => {
    setDocuments([...documents, { id: crypto.randomUUID(), name: "", required: true }]);
  };

  const updateDocument = (id: string, field: keyof DocumentReq, value: any) => {
    setDocuments(documents.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  const removeDocument = (id: string) => {
    setDocuments(documents.filter(d => d.id !== id));
  };

  // Form Builders
  const addStep = () => {
    setFormSteps([...formSteps, { id: crypto.randomUUID(), title: "خطوة جديدة", fields: [] }]);
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

  const updateField = (stepId: string, fieldId: string, key: keyof FormField, value: any) => {
    setFormSteps(formSteps.map(s => {
      if (s.id === stepId) {
        return {
          ...s,
          fields: s.fields.map(f => f.id === fieldId ? { ...f, [key]: value } : f)
        };
      }
      return s;
    }));
  };

  const removeField = (stepId: string, fieldId: string) => {
    setFormSteps(formSteps.map(s => {
      if (s.id === stepId) {
        return { ...s, fields: s.fields.filter(f => f.id !== fieldId) };
      }
      return s;
    }));
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const configuration = {
        details,
        eligibility,
        documents,
        form_steps: formSteps
      };

      if (!basicInfo.application_start || !basicInfo.application_deadline) {
        alert("يرجى التأكد من إدخال تواريخ بداية ونهاية التقديم.");
        setIsSubmitting(false);
        return;
      }

      const payload = {
        ...basicInfo,
        total_quota: typeof basicInfo.total_quota === 'string' ? parseInt(basicInfo.total_quota) : basicInfo.total_quota,
        application_start: new Date(basicInfo.application_start).toISOString(),
        application_deadline: new Date(basicInfo.application_deadline).toISOString(),
        status: 'open',
        configuration
      };

      await apiClient.post("/scholarships/cycles", payload);
      alert("تم إنشاء المنحة بنجاح!");
      router.push("/portal/admin/scholarships");
    } catch (error: any) {
      console.error(error);
      const errMsg = error.response?.data?.error?.message || error.message || "حدث خطأ أثناء حفظ المنحة.";
      alert("خطأ: " + errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs = [
    { id: 'basic', label: 'البيانات الأساسية' },
    { id: 'details', label: 'التفاصيل والمزايا' },
    { id: 'eligibility', label: 'شروط الأهلية' },
    { id: 'documents', label: 'المستندات المطلوبة' },
    { id: 'form', label: 'بناء نموذج التقديم' },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-16">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
            بناء منحة جديدة (Dynamic Builder)
          </h1>
          <p className="text-sm text-surface-500 mt-1">
            صمم نموذج التقديم وشروط القبول بالكامل دون الحاجة إلى تعديل الكود.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => router.back()} className="btn-outline">إلغاء</button>
          <button onClick={handleSave} disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? "جاري الحفظ..." : "حفظ وإنشاء المنحة"}
          </button>
        </div>
      </div>

      <div className="bg-surface-50 dark:bg-surface-900 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-800 overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-l border-surface-200 dark:border-surface-700 bg-surface-100/50 dark:bg-surface-800/20 p-4">
          <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`text-right px-4 py-3 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-primary-600 text-white shadow-md' 
                    : 'text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
          
          {/* TAB 1: BASIC INFO */}
          {activeTab === 'basic' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-lg font-bold border-b border-surface-200 dark:border-surface-700 pb-2">البيانات الأساسية</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">الاسم (بالعربية)</label>
                  <input type="text" name="name_ar" value={basicInfo.name_ar} onChange={handleBasicChange} className="form-input" placeholder="مثال: منحة التميز 2026" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الاسم (بالإنجليزية)</label>
                  <input type="text" name="name_en" value={basicInfo.name_en} onChange={handleBasicChange} className="form-input" dir="ltr" placeholder="Ex: Excellence Scholarship 2026" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">وصف المنحة (نص طويل)</label>
                  <textarea name="description" value={basicInfo.description} onChange={handleBasicChange} rows={4} className="form-input" placeholder="اكتب وصفاً مفصلاً عن المنحة وأهدافها..."></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">بداية فترة التقديم</label>
                  <input type="datetime-local" name="application_start" value={basicInfo.application_start} onChange={handleBasicChange} className="form-input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">نهاية فترة التقديم</label>
                  <input type="datetime-local" name="application_deadline" value={basicInfo.application_deadline} onChange={handleBasicChange} className="form-input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">السنة الأكاديمية</label>
                  <input type="text" name="academic_year" value={basicInfo.academic_year} onChange={handleBasicChange} className="form-input" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">عدد المقاعد المتاحة</label>
                  <input type="number" name="total_quota" value={basicInfo.total_quota} onChange={handleBasicChange} className="form-input" />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DETAILS */}
          {activeTab === 'details' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-lg font-bold border-b border-surface-200 dark:border-surface-700 pb-2">التفاصيل والمزايا</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">الفئة</label>
                  <select name="category" value={details.category} onChange={handleDetailsChange} className="form-input">
                    <option value="منح البكالوريوس">منح البكالوريوس</option>
                    <option value="منح الماجستير">منح الماجستير</option>
                    <option value="منح الدكتوراه">منح الدكتوراه</option>
                    <option value="دعم أبحاث">دعم أبحاث</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">نوع التمويل</label>
                  <select name="funding_type" value={details.funding_type} onChange={handleDetailsChange} className="form-input">
                    <option value="تمويل كامل">تمويل كامل</option>
                    <option value="تمويل جزئي">تمويل جزئي</option>
                    <option value="مكافأة شهرية">مكافأة شهرية</option>
                    <option value="تغطية سكن">تغطية سكن</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">وصف مختصر (يظهر في البطاقة)</label>
                  <textarea name="short_description" value={details.short_description} onChange={handleDetailsChange} rows={2} className="form-input"></textarea>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ELIGIBILITY */}
          {activeTab === 'eligibility' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-lg font-bold border-b border-surface-200 dark:border-surface-700 pb-2">شروط الأهلية الديناميكية</h2>
              <p className="text-sm text-surface-500 mb-4">يتم تقييم هذه الشروط تلقائياً ضد ملف الطالب.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">الحد الأدنى للمعدل التراكمي (GPA)</label>
                  <input type="number" step="0.01" name="min_gpa" value={eligibility.min_gpa} onChange={handleEligibilityChange} className="form-input" placeholder="مثال: 3.5" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الجنسيات المسموحة (اترك فارغاً للجميع)</label>
                  <input type="text" name="nationalities" value={eligibility.nationalities} onChange={handleEligibilityChange} className="form-input" placeholder="مثال: سعودي، مصري، أردني" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">شروط خاصة (تظهر كنص للطالب)</label>
                  <textarea name="special_conditions" value={eligibility.special_conditions} onChange={handleEligibilityChange} rows={3} className="form-input" placeholder="مثال: ألا يكون قد سبق له الحصول على منحة أخرى..."></textarea>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DOCUMENTS */}
          {activeTab === 'documents' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center border-b border-surface-200 dark:border-surface-700 pb-2">
                <h2 className="text-lg font-bold">المستندات المطلوبة</h2>
                <button onClick={addDocument} className="btn-outline text-xs px-3 py-1">+ إضافة مستند</button>
              </div>
              
              {documents.length === 0 ? (
                <div className="text-center py-10 text-surface-500">لا توجد مستندات مطلوبة حالياً.</div>
              ) : (
                <div className="space-y-4">
                  {documents.map((doc, idx) => (
                    <div key={doc.id} className="flex gap-4 items-center bg-surface-50 dark:bg-surface-800 p-4 rounded-xl border border-surface-200 dark:border-surface-700">
                      <div className="flex-1">
                        <input 
                          type="text" 
                          value={doc.name} 
                          onChange={(e) => updateDocument(doc.id, 'name', e.target.value)} 
                          className="form-input" 
                          placeholder="اسم المستند (مثال: الهوية الوطنية، السجل الأكاديمي)" 
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 text-sm">
                          <input 
                            type="checkbox" 
                            checked={doc.required} 
                            onChange={(e) => updateDocument(doc.id, 'required', e.target.checked)} 
                            className="rounded text-primary-600 focus:ring-primary-500"
                          />
                          إجباري
                        </label>
                      </div>
                      <button onClick={() => removeDocument(doc.id)} className="text-danger-500 hover:text-danger-600 p-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: FORM BUILDER */}
          {activeTab === 'form' && (
            <div className="space-y-8 animate-fade-in pb-10">
              <div className="flex justify-between items-center border-b border-surface-200 dark:border-surface-700 pb-2">
                <div>
                  <h2 className="text-lg font-bold">بناء نموذج التقديم</h2>
                  <p className="text-xs text-surface-500 mt-1">صمم خطوات وأسئلة نموذج التقديم الذي سيظهر للطالب.</p>
                </div>
                <button onClick={addStep} className="btn-primary text-sm px-4 py-2">+ إضافة خطوة جديدة</button>
              </div>

              {formSteps.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-surface-300 dark:border-surface-700 rounded-2xl text-surface-500">
                  <p>لم يتم إضافة أي خطوات لنموذج التقديم.</p>
                  <p className="text-xs mt-1">إذا تركته فارغاً، لن يتمكن الطالب من التقديم.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {formSteps.map((step, sIdx) => (
                    <div key={step.id} className="bg-surface-50 dark:bg-surface-800/30 rounded-2xl border border-surface-200 dark:border-surface-700 overflow-hidden">
                      {/* Step Header */}
                      <div className="bg-surface-100 dark:bg-surface-800 px-4 py-3 border-b border-surface-200 dark:border-surface-700 flex justify-between items-center">
                        <div className="flex items-center gap-3 flex-1">
                          <span className="font-bold text-surface-400">الخطوة {sIdx + 1}</span>
                          <input 
                            type="text" 
                            value={step.title} 
                            onChange={(e) => updateStepTitle(step.id, e.target.value)}
                            className="bg-transparent border-b border-transparent focus:border-primary-500 outline-none font-bold text-primary-700 dark:text-primary-300 px-2 py-1 w-64"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => addField(step.id)} className="text-xs bg-white dark:bg-surface-700 px-3 py-1.5 rounded-lg border border-surface-200 dark:border-surface-600 hover:bg-surface-50">
                            + إضافة حقل
                          </button>
                          <button onClick={() => removeStep(step.id)} className="text-danger-500 hover:bg-danger-50 p-1.5 rounded-lg">
                            حذف الخطوة
                          </button>
                        </div>
                      </div>

                      {/* Fields List */}
                      <div className="p-4 space-y-4">
                        {step.fields.length === 0 ? (
                          <div className="text-center py-6 text-sm text-surface-400">لا توجد حقول في هذه الخطوة.</div>
                        ) : (
                          step.fields.map((field, fIdx) => (
                            <div key={field.id} className="flex flex-col md:flex-row gap-4 items-start md:items-center bg-white dark:bg-surface-900 p-4 rounded-xl border border-surface-100 dark:border-surface-700">
                              <div className="flex-1 w-full">
                                <label className="text-xs text-surface-500 mb-1 block">عنوان الحقل / السؤال</label>
                                <input 
                                  type="text" 
                                  value={field.label}
                                  onChange={(e) => updateField(step.id, field.id, 'label', e.target.value)}
                                  className="form-input text-sm"
                                />
                              </div>
                              <div className="w-full md:w-48">
                                <label className="text-xs text-surface-500 mb-1 block">نوع الحقل</label>
                                <select 
                                  value={field.type}
                                  onChange={(e) => updateField(step.id, field.id, 'type', e.target.value as FieldType)}
                                  className="form-input text-sm"
                                >
                                  <option value="text">نص قصير</option>
                                  <option value="longtext">نص طويل (مقال)</option>
                                  <option value="number">رقم</option>
                                  <option value="date">تاريخ</option>
                                  <option value="select">قائمة منسدلة</option>
                                  <option value="checkbox">مربع اختيار (نعم/لا)</option>
                                  <option value="file">رفع ملف</option>
                                </select>
                              </div>
                              <div className="flex items-center gap-4 mt-6 md:mt-0">
                                <label className="flex items-center gap-2 text-sm">
                                  <input 
                                    type="checkbox" 
                                    checked={field.required}
                                    onChange={(e) => updateField(step.id, field.id, 'required', e.target.checked)}
                                    className="rounded text-primary-600 focus:ring-primary-500"
                                  />
                                  مطلوب
                                </label>
                                <button onClick={() => removeField(step.id, field.id)} className="text-surface-400 hover:text-danger-500">
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
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
  );
}
