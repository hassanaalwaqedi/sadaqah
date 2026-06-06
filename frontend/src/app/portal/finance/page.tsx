"use client";

import { useState } from "react";
import { BanknotesIcon, ChartBarIcon, ArrowTrendingUpIcon, WalletIcon } from "@heroicons/react/24/outline";

const MOCK_BUDGETS = [
  { id: "1", name_en: "Operations Budget 2024", fiscal_year: "2024", total_amount: 5000000, spent_amount: 3200000 },
  { id: "2", name_en: "Research Grants 2024", fiscal_year: "2024", total_amount: 1500000, spent_amount: 850000 },
  { id: "3", name_en: "Student Housing Maintenance", fiscal_year: "2024", total_amount: 800000, spent_amount: 790000 },
];

export default function FinanceDashboard() {
  const [budgets] = useState(MOCK_BUDGETS);

  const totalBudget = budgets.reduce((acc, b) => acc + b.total_amount, 0);
  const totalSpent = budgets.reduce((acc, b) => acc + b.spent_amount, 0);
  const overallProgress = (totalSpent / totalBudget) * 100;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Financial Management</h1>
          <p className="text-surface-600 dark:text-surface-400 mt-1">
            Track organizational budgets, expenses, and allocations across all departments.
          </p>
        </div>
        <button className="btn-gradient px-4 py-2">Create Budget</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-card p-6 border-t-4 border-t-primary-500">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-xl">
              <BanknotesIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-surface-500 font-medium">Total Fiscal Budget (2024)</p>
              <h3 className="text-3xl font-bold">${(totalBudget / 1000000).toFixed(1)}M</h3>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 border-t-4 border-t-rose-500">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-xl">
              <WalletIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-surface-500 font-medium">Total Spent</p>
              <h3 className="text-3xl font-bold">${(totalSpent / 1000000).toFixed(1)}M</h3>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 border-t-4 border-t-emerald-500 flex flex-col justify-center">
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-medium text-surface-500">Overall Utilization</span>
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

      <h2 className="text-lg font-bold mb-4">Budget Allocations</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgets.map((budget) => {
          const progress = (budget.spent_amount / budget.total_amount) * 100;
          const isWarning = progress > 85;
          const isDanger = progress > 95;

          return (
            <div key={budget.id} className="glass-card p-6">
              <h3 className="font-bold text-lg mb-4">{budget.name_en}</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-surface-500">Allocated</span>
                  <span className="font-medium">${budget.total_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-surface-500">Spent</span>
                  <span className="font-medium">${budget.spent_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-surface-500">Remaining</span>
                  <span className={`font-bold ${isDanger ? 'text-rose-500' : isWarning ? 'text-amber-500' : 'text-emerald-500'}`}>
                    ${(budget.total_amount - budget.spent_amount).toLocaleString()}
                  </span>
                </div>

                <div className="pt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Utilization</span>
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
      </div>
    </div>
  );
}
