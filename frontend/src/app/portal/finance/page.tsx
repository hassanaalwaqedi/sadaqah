"use client";

import { useState, useEffect } from "react";
import { BanknotesIcon, ChartBarIcon, ArrowTrendingUpIcon, WalletIcon } from "@heroicons/react/24/outline";
import { apiClient } from "@/lib/api-client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

type Budget = {
  id: string;
  name_en: string;
  name_ar: string;
  fiscal_year: string;
  total_amount: number;
  spent_amount: number;
};

export default function FinanceDashboard() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBudgets = async () => {
      try {
        const res = await apiClient.get("/finance/budgets");
        setBudgets(res.data || []);
      } catch (err) {
        console.error("Failed to load budgets", err);
      } finally {
        setLoading(false);
      }
    };
    loadBudgets();
  }, []);

  const totalBudget = budgets.reduce((acc, b) => acc + b.total_amount, 0);
  const totalSpent = budgets.reduce((acc, b) => acc + b.spent_amount, 0);
  const overallProgress = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text">العمليات المالية للمؤسسة</h1>
          <p className="text-surface-600 dark:text-surface-400 mt-1">
            شفافية مالية في الوقت الفعلي، وتدقيق آلي، وتتبع الميزانية.
          </p>
        </div>
        <div className="flex gap-4">
          <a href="/portal/finance/transactions" className="btn-outline px-4 py-2">سجل المعاملات</a>
          <a href="/portal/finance/budgets/create" className="btn-gradient px-4 py-2 inline-block">إنشاء ميزانية</a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-card p-6 border-t-4 border-t-primary-500">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-xl">
              <BanknotesIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-surface-500 font-medium">إجمالي الميزانية المالية (2024)</p>
              <h3 className="text-3xl font-bold">${(totalBudget / 1000000).toFixed(2)}M</h3>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 border-t-4 border-t-rose-500">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-xl">
              <WalletIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-surface-500 font-medium">إجمالي الإنفاق</p>
              <h3 className="text-3xl font-bold">${(totalSpent / 1000000).toFixed(2)}M</h3>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 border-t-4 border-t-emerald-500 flex flex-col justify-center">
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-medium text-surface-500">الاستخدام الإجمالي</span>
            <span className="text-2xl font-bold">{overallProgress.toFixed(1)}%</span>
          </div>
          <div className="w-full h-3 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${overallProgress > 90 ? 'bg-rose-500' : 'bg-emerald-500'}`}
              style={{ width: `${overallProgress}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5 text-primary-500" />
            تحليلات استهلاك الميزانية
          </h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgets} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.2} />
                <XAxis dataKey="name_ar" tick={{fill: '#888'}} />
                <YAxis tick={{fill: '#888'}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend />
                <Bar dataKey="total_amount" name="المخصص" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="spent_amount" name="المنفق" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-lg font-bold mb-4">نظرة عامة على ميزانيات الأقسام</h2>
          <div className="space-y-6">
            {budgets.map((budget) => {
              const progress = budget.total_amount > 0 ? (budget.spent_amount / budget.total_amount) * 100 : 0;
              const isWarning = progress > 85;
              const isDanger = progress > 95;

              return (
                <div key={budget.id} className="p-4 border border-surface-200 dark:border-surface-700 rounded-xl bg-surface-50 dark:bg-surface-800/50">
                  <h3 className="font-bold text-md mb-3">{budget.name_ar || budget.name_en}</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-surface-500">المخصص</span>
                      <span className="font-medium">${budget.total_amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-surface-500">المنفق</span>
                      <span className="font-medium">${budget.spent_amount.toLocaleString()}</span>
                    </div>
                    
                    <div className="pt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span>الاستخدام</span>
                        <span className="font-bold">{progress.toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${isDanger ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-primary-500'}`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {budgets.length === 0 && (
              <div className="p-8 text-center text-surface-500 border border-dashed border-surface-300 dark:border-surface-700 rounded-xl">
                لم يتم تكوين ميزانيات لهذه السنة المالية.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
