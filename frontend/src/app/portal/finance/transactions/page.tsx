"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { 
  DocumentArrowDownIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon, 
  EyeIcon, 
  FunnelIcon 
} from "@heroicons/react/24/outline";

type Transaction = {
  id: string;
  type: string;
  category: string;
  amount: number;
  currency: string;
  description: string;
  status: string;
  source: string;
  destination: string;
  created_at: string;
  receipt_file_id?: string;
  invoice_file_id?: string;
};

export default function TransactionsLedger() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/finance/transactions?limit=100");
      setTransactions(res.data || []);
    } catch (err) {
      console.error("Failed to load transactions", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await apiClient.put(`/finance/transactions/${id}/approve`);
      alert("Transaction approved successfully!");
      loadTransactions();
    } catch (err: any) {
      alert("Failed to approve: " + (err.response?.data?.error || err.message));
    }
  };

  const filtered = transactions.filter(t => filterStatus === "all" || t.status === filterStatus);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"><CheckCircleIcon className="w-3 h-3"/> موافق عليه</span>;
      case "pending_approval":
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"><ClockIcon className="w-3 h-3"/> قيد الانتظار</span>;
      case "draft":
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-surface-100 text-surface-700 dark:bg-surface-800 dark:text-surface-400">مسودة</span>;
      case "rejected":
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"><XCircleIcon className="w-3 h-3"/> مرفوض</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-surface-100 text-surface-700 dark:bg-surface-800 dark:text-surface-400">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text">سجل المؤسسة</h1>
          <p className="text-surface-600 dark:text-surface-400 mt-1">
            سجل تدقيق غير قابل للتغيير لجميع المعاملات المالية والموافقات.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-outline px-4 py-2 flex items-center gap-2">
            <DocumentArrowDownIcon className="w-5 h-5" />
            تصدير تقرير التدقيق
          </button>
          <a href="/portal/finance" className="btn-outline px-4 py-2">العودة إلى لوحة التحكم</a>
        </div>
      </div>

      <div className="glass-card p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2 text-sm font-medium text-surface-600 dark:text-surface-400">
            <FunnelIcon className="w-5 h-5" />
            تصفية حسب الحالة:
          </div>
          <div className="flex gap-2">
            {["all", "draft", "pending_approval", "approved", "rejected", "paid"].map(s => (
              <button 
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  filterStatus === s 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300'
                }`}
              >
                {s === "all" ? "الكل" : s === "draft" ? "مسودة" : s === "pending_approval" ? "قيد الانتظار" : s === "approved" ? "موافق عليه" : s === "rejected" ? "مرفوض" : s === "paid" ? "مدفوع" : s.replace("_", " ").toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-surface-50 dark:bg-surface-800/50 text-surface-500 font-medium border-b border-surface-200 dark:border-surface-700">
              <tr>
                <th className="px-4 py-3">التاريخ</th>
                <th className="px-4 py-3">النوع</th>
                <th className="px-4 py-3">الفئة</th>
                <th className="px-4 py-3">الوصف</th>
                <th className="px-4 py-3">المبلغ</th>
                <th className="px-4 py-3">الحالة</th>
                <th className="px-4 py-3 text-right">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-surface-500">
                    <div className="animate-spin inline-block w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full"></div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-surface-500">
                    لم يتم العثور على معاملات تطابق عوامل التصفية الخاصة بك.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                    <td className="px-4 py-3 text-surface-600 dark:text-surface-400">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                        t.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 
                        t.type === 'expense' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {t.type === 'income' ? 'إيراد' : t.type === 'expense' ? 'مصروف' : t.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{t.category}</td>
                    <td className="px-4 py-3 text-surface-500 truncate max-w-xs">{t.description || '-'}</td>
                    <td className="px-4 py-3 font-bold">
                      {t.amount.toLocaleString()} {t.currency}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(t.status)}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button className="text-surface-500 hover:text-primary-500 transition-colors" title="View Details">
                        <EyeIcon className="w-5 h-5 inline" />
                      </button>
                      {(t.status === "pending_approval" || t.status === "draft") && (
                        <button 
                          onClick={() => handleApprove(t.id)}
                          className="text-surface-500 hover:text-emerald-500 transition-colors" 
                          title="الموافقة على المعاملة"
                        >
                          <CheckCircleIcon className="w-5 h-5 inline" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
