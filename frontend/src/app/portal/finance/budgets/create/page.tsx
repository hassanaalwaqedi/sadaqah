"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  CheckCircleIcon, 
  DocumentTextIcon, 
  BanknotesIcon, 
  ChartPieIcon, 
  ShieldCheckIcon,
  PlusIcon,
  TrashIcon
} from "@heroicons/react/24/outline";
import { apiClient } from "@/lib/api-client";

export default function CreateBudgetPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name_ar: "",
    name_en: "",
    description: "",
    department_id: "Finance",
    program_id: "General",
    fiscal_year: "2024",
    start_date: "",
    end_date: "",
    currency: "USD",
    type: "Scholarship Budget",
    notes: "",
    funding_sources: [{ source_type: "Government Grant", donor_name: "", amount: 0, notes: "" }],
    allocations: [{ module_type: "Scholarship", category: "Personnel", allocated_amount: 0, notes: "" }],
    limits: [{ period: "monthly", max_amount: 0, alert_threshold: 80 }]
  });

  const updateField = (field: string, value: any) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        ...formData,
        start_date: formData.start_date ? new Date(formData.start_date).toISOString() : new Date().toISOString(),
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : new Date().toISOString(),
      };
      await apiClient.post("/finance/budgets", payload);
      router.push("/portal/finance");
    } catch (err: any) {
      alert("Failed to create budget: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return formData.allocations.reduce((sum, alloc) => sum + (Number(alloc.allocated_amount) || 0), 0);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold gradient-text">إنشاء ميزانية</h1>
        <p className="text-surface-600 dark:text-surface-400 mt-1">
          نظام تخطيط وإدارة الميزانيات للمؤسسة
        </p>
      </div>

      {/* Progress Bar */}
      <div className="flex justify-between relative">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-surface-200 dark:bg-surface-700 -z-10 -translate-y-1/2"></div>
        <div 
          className="absolute top-1/2 left-0 h-1 bg-primary-500 -z-10 -translate-y-1/2 transition-all duration-300"
          style={{ width: `${((step - 1) / 3) * 100}%` }}
        ></div>

        {[
          { num: 1, icon: DocumentTextIcon, label: "التفاصيل الأساسية" },
          { num: 2, icon: BanknotesIcon, label: "مصادر التمويل" },
          { num: 3, icon: ChartPieIcon, label: "توزيع الميزانية" },
          { num: 4, icon: ShieldCheckIcon, label: "الحدود والقيود" }
        ].map((s) => (
          <div key={s.num} className="flex flex-col items-center gap-2">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              step >= s.num ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' : 'bg-surface-100 text-surface-400 dark:bg-surface-800'
            }`}>
              {step > s.num ? <CheckCircleIcon className="w-6 h-6" /> : <s.icon className="w-6 h-6" />}
            </div>
            <span className={`text-sm font-medium ${step >= s.num ? 'text-surface-900 dark:text-white' : 'text-surface-400'}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <div className="glass-card p-8">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-xl font-bold border-b border-surface-200 dark:border-surface-700 pb-2">التفاصيل الأساسية (Basic Details)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">اسم الميزانية (العربية)</label>
                <input type="text" className="input-field" value={formData.name_ar} onChange={e => updateField("name_ar", e.target.value)} placeholder="مثال: ميزانية المنح الدراسية" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">اسم الميزانية (English)</label>
                <input type="text" className="input-field" value={formData.name_en} onChange={e => updateField("name_en", e.target.value)} placeholder="e.g. Scholarships Budget" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">الوصف (Description)</label>
                <textarea className="input-field" rows={3} value={formData.description} onChange={e => updateField("description", e.target.value)}></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">نوع الميزانية (Budget Type)</label>
                <select className="input-field" value={formData.type} onChange={e => updateField("type", e.target.value)}>
                  <option>Scholarship Budget</option>
                  <option>Student Housing Budget</option>
                  <option>Innovation Competition Budget</option>
                  <option>Emergency Aid Budget</option>
                  <option>Operations Budget</option>
                  <option>Custom Budget</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">السنة المالية (Fiscal Year)</label>
                <input type="text" className="input-field" value={formData.fiscal_year} onChange={e => updateField("fiscal_year", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">تاريخ البدء (Start Date)</label>
                <input type="date" className="input-field" value={formData.start_date} onChange={e => updateField("start_date", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">تاريخ الانتهاء (End Date)</label>
                <input type="date" className="input-field" value={formData.end_date} onChange={e => updateField("end_date", e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-xl font-bold border-b border-surface-200 dark:border-surface-700 pb-2">مصادر التمويل (Funding Sources)</h2>
            <div className="space-y-4">
              {formData.funding_sources.map((src, index) => (
                <div key={index} className="p-4 border border-surface-200 dark:border-surface-700 rounded-xl bg-surface-50 dark:bg-surface-800/50 flex flex-wrap gap-4 items-end">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-medium mb-1">نوع المصدر (Source Type)</label>
                    <select 
                      className="input-field text-sm" 
                      value={src.source_type}
                      onChange={e => {
                        const newSources = [...formData.funding_sources];
                        newSources[index].source_type = e.target.value;
                        updateField("funding_sources", newSources);
                      }}
                    >
                      <option>Government Grant</option>
                      <option>International Donor</option>
                      <option>Private Donation</option>
                      <option>General Fund</option>
                      <option>Emergency Fund</option>
                    </select>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-medium mb-1">اسم المانح (Donor Name)</label>
                    <input 
                      type="text" 
                      className="input-field text-sm" 
                      value={src.donor_name}
                      onChange={e => {
                        const newSources = [...formData.funding_sources];
                        newSources[index].donor_name = e.target.value;
                        updateField("funding_sources", newSources);
                      }}
                    />
                  </div>
                  <div className="w-32">
                    <label className="block text-xs font-medium mb-1">المبلغ (Amount)</label>
                    <input 
                      type="number" 
                      className="input-field text-sm" 
                      value={src.amount || ""}
                      onChange={e => {
                        const newSources = [...formData.funding_sources];
                        newSources[index].amount = parseFloat(e.target.value);
                        updateField("funding_sources", newSources);
                      }}
                    />
                  </div>
                  <button 
                    className="p-3 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                    onClick={() => {
                      const newSources = formData.funding_sources.filter((_, i) => i !== index);
                      updateField("funding_sources", newSources);
                    }}
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              ))}
              
              <button 
                className="w-full py-4 border-2 border-dashed border-primary-300 dark:border-primary-700/50 text-primary-600 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors flex justify-center items-center gap-2 font-medium"
                onClick={() => updateField("funding_sources", [...formData.funding_sources, { source_type: "General Fund", donor_name: "", amount: 0, notes: "" }])}
              >
                <PlusIcon className="w-5 h-5" /> إضافة مصدر تمويل جديد
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-xl font-bold border-b border-surface-200 dark:border-surface-700 pb-2">توزيع الميزانية (Allocations & Breakdown)</h2>
            <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-xl flex justify-between items-center mb-4">
              <span className="font-bold">إجمالي المخصصات (Total Allocated)</span>
              <span className="text-2xl font-black text-primary-600 dark:text-primary-400">${calculateTotal().toLocaleString()}</span>
            </div>
            <div className="space-y-4">
              {formData.allocations.map((alloc, index) => (
                <div key={index} className="p-4 border border-surface-200 dark:border-surface-700 rounded-xl bg-surface-50 dark:bg-surface-800/50 flex flex-wrap gap-4 items-end">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-medium mb-1">النظام (Module)</label>
                    <select 
                      className="input-field text-sm" 
                      value={alloc.module_type}
                      onChange={e => {
                        const newAllocs = [...formData.allocations];
                        newAllocs[index].module_type = e.target.value;
                        updateField("allocations", newAllocs);
                      }}
                    >
                      <option>Scholarships</option>
                      <option>Housing</option>
                      <option>Innovation</option>
                      <option>Emergency</option>
                      <option>Administration</option>
                      <option>General</option>
                    </select>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-medium mb-1">الفئة (Category)</label>
                    <select 
                      className="input-field text-sm" 
                      value={alloc.category}
                      onChange={e => {
                        const newAllocs = [...formData.allocations];
                        newAllocs[index].category = e.target.value;
                        updateField("allocations", newAllocs);
                      }}
                    >
                      <option>Personnel</option>
                      <option>Scholarships</option>
                      <option>Housing Allowances</option>
                      <option>Competition Awards</option>
                      <option>Equipment</option>
                      <option>Maintenance</option>
                      <option>Travel</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="w-32">
                    <label className="block text-xs font-medium mb-1">المبلغ (Amount)</label>
                    <input 
                      type="number" 
                      className="input-field text-sm" 
                      value={alloc.allocated_amount || ""}
                      onChange={e => {
                        const newAllocs = [...formData.allocations];
                        newAllocs[index].allocated_amount = parseFloat(e.target.value);
                        updateField("allocations", newAllocs);
                      }}
                    />
                  </div>
                  <button 
                    className="p-3 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                    onClick={() => {
                      const newAllocs = formData.allocations.filter((_, i) => i !== index);
                      updateField("allocations", newAllocs);
                    }}
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              ))}
              
              <button 
                className="w-full py-4 border-2 border-dashed border-primary-300 dark:border-primary-700/50 text-primary-600 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors flex justify-center items-center gap-2 font-medium"
                onClick={() => updateField("allocations", [...formData.allocations, { module_type: "General", category: "Other", allocated_amount: 0, notes: "" }])}
              >
                <PlusIcon className="w-5 h-5" /> إضافة بند جديد
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-xl font-bold border-b border-surface-200 dark:border-surface-700 pb-2">الحدود والقيود (Limits & Alerts)</h2>
            <div className="space-y-4">
              {formData.limits.map((limit, index) => (
                <div key={index} className="p-4 border border-surface-200 dark:border-surface-700 rounded-xl bg-surface-50 dark:bg-surface-800/50 flex flex-wrap gap-4 items-end">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-medium mb-1">الفترة (Period)</label>
                    <select 
                      className="input-field text-sm" 
                      value={limit.period}
                      onChange={e => {
                        const newLimits = [...formData.limits];
                        newLimits[index].period = e.target.value;
                        updateField("limits", newLimits);
                      }}
                    >
                      <option value="monthly">شهري (Monthly)</option>
                      <option value="quarterly">ربع سنوي (Quarterly)</option>
                      <option value="annual">سنوي (Annual)</option>
                      <option value="per_transaction">لكل معاملة (Per Transaction)</option>
                    </select>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-medium mb-1">الحد الأقصى (Max Amount)</label>
                    <input 
                      type="number" 
                      className="input-field text-sm" 
                      value={limit.max_amount || ""}
                      onChange={e => {
                        const newLimits = [...formData.limits];
                        newLimits[index].max_amount = parseFloat(e.target.value);
                        updateField("limits", newLimits);
                      }}
                    />
                  </div>
                  <div className="w-32">
                    <label className="block text-xs font-medium mb-1">تنبيه عند (%)</label>
                    <input 
                      type="number" 
                      className="input-field text-sm" 
                      value={limit.alert_threshold || ""}
                      onChange={e => {
                        const newLimits = [...formData.limits];
                        newLimits[index].alert_threshold = parseFloat(e.target.value);
                        updateField("limits", newLimits);
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400 p-4 rounded-xl text-sm mt-8">
              <strong className="block mb-1">ملاحظة سير العمل:</strong>
              بمجرد الحفظ، سيتم حفظ الميزانية كمسودة ("Draft"). لن يتم تفعيل الميزانية حتى يتم اعتمادها من قبل المدير المالي من خلال لوحة التحكم.
            </div>
          </div>
        )}

        <div className="flex justify-between mt-12 pt-6 border-t border-surface-200 dark:border-surface-700">
          <button 
            className="btn-outline px-6 py-2"
            onClick={() => {
              if (step > 1) setStep(step - 1);
              else router.push("/portal/finance");
            }}
          >
            {step === 1 ? "إلغاء (Cancel)" : "السابق (Previous)"}
          </button>
          
          {step < 4 ? (
            <button className="btn-gradient px-8 py-2" onClick={() => setStep(step + 1)}>
              التالي (Next)
            </button>
          ) : (
            <button className="btn-gradient px-8 py-2 flex items-center gap-2" onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <CheckCircleIcon className="w-5 h-5" />
              )}
              حفظ كمسودة (Save Draft)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
