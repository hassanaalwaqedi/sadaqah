"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ChartPieIcon, 
  CheckCircleIcon,
  BanknotesIcon,
  DocumentArrowDownIcon
} from "@heroicons/react/24/outline";
import { apiClient } from "@/lib/api-client";
import { generateBudgetPDF } from "@/lib/pdf-generator";

export default function BudgetDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [budget, setBudget] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBudget();
  }, [id]);

  const loadBudget = async () => {
    try {
      const res = await apiClient.get(`/finance/budgets/${id}`);
      setBudget(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      await apiClient.put(`/finance/budgets/${id}/approve`);
      loadBudget();
      alert("تم اعتماد الميزانية بنجاح!");
    } catch (err: any) {
      alert("فشل في اعتماد الميزانية: " + (err.response?.data?.error || err.message));
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div></div>;
  }

  if (!budget) {
    return <div className="text-center p-12">الميزانية غير موجودة (Budget not found)</div>;
  }

  const progress = budget.total_amount > 0 ? (budget.spent_amount / budget.total_amount) * 100 : 0;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">{budget.name_ar}</h1>
            <span className={`px-2 py-1 rounded-md text-xs font-bold ${
              budget.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
              budget.status === 'draft' ? 'bg-surface-200 text-surface-700' :
              'bg-amber-100 text-amber-700'
            }`}>
              {budget.status.toUpperCase()}
            </span>
          </div>
          <p className="text-surface-600 dark:text-surface-400">{budget.description || "بدون وصف"}</p>
        </div>
        
        <div className="flex gap-2">
          <button 
            className="btn-outline px-4 py-2 flex items-center gap-2"
            onClick={() => generateBudgetPDF(budget, "budget-report-content")}
          >
            <DocumentArrowDownIcon className="w-5 h-5" /> تصدير PDF
          </button>
          {(budget.status === 'draft' || budget.status === 'pending_approval') && (
            <button className="btn-gradient px-4 py-2 flex items-center gap-2" onClick={handleApprove}>
              <CheckCircleIcon className="w-5 h-5" /> اعتماد الميزانية
            </button>
          )}
        </div>
      </div>

      <div id="budget-report-content" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 border-t-4 border-t-primary-500">
          <div className="flex items-center gap-4 mb-2">
            <BanknotesIcon className="w-8 h-8 text-primary-500" />
            <div>
              <p className="text-sm text-surface-500">إجمالي الميزانية (Total Amount)</p>
              <h3 className="text-2xl font-bold">${budget.total_amount?.toLocaleString() || 0}</h3>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 border-t-4 border-t-rose-500">
          <div className="flex items-center gap-4 mb-2">
            <ChartPieIcon className="w-8 h-8 text-rose-500" />
            <div>
              <p className="text-sm text-surface-500">المبلغ المنفق (Spent Amount)</p>
              <h3 className="text-2xl font-bold">${budget.spent_amount?.toLocaleString() || 0}</h3>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 border-t-4 border-t-emerald-500 flex flex-col justify-center">
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-medium text-surface-500">نسبة الاستخدام (Utilization)</span>
            <span className="text-2xl font-bold">{progress.toFixed(1)}%</span>
          </div>
          <div className="w-full h-3 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${progress > 90 ? 'bg-rose-500' : 'bg-emerald-500'}`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      {/* AI Forecasting Stub */}
      <div className="glass-card p-6 bg-gradient-to-r from-primary-50 to-transparent dark:from-primary-900/10">
        <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
          <span className="text-xl">✨</span> توقعات الذكاء الاصطناعي (AI Forecast)
        </h3>
        <p className="text-sm text-surface-600 dark:text-surface-400">
          بناءً على معدل الإنفاق الحالي، من المتوقع استنفاد هذه الميزانية في الشهر العاشر من السنة المالية. (Confidence: 85%)
        </p>
      </div>
      </div>

    </div>
  );
}
