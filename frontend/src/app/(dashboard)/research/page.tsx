"use client";

import { useState } from "react";
import { BeakerIcon, DocumentTextIcon, CurrencyDollarIcon, PlusIcon } from "@heroicons/react/24/outline";
import { formatDateTime } from "@/lib/utils";

const MOCK_GRANTS = [
  {
    id: "g-001",
    title: "Quantum Computing Algorithms for Cryptography",
    abstract: "Developing new post-quantum cryptographic primitives to secure university communications.",
    requested_budget: 150000,
    approved_budget: 120000,
    status: "active",
    start_date: "2024-01-15T00:00:00Z",
  },
  {
    id: "g-002",
    title: "Renewable Energy Storage Solutions",
    abstract: "Investigating solid-state battery tech for scalable renewable energy storage.",
    requested_budget: 250000,
    status: "under_review",
  }
];

export default function ResearchGrantsDashboard() {
  const [grants] = useState(MOCK_GRANTS);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Research & Grants</h1>
          <p className="text-surface-600 dark:text-surface-400 mt-1">
            Submit grant proposals, track approved funding, and manage research milestones.
          </p>
        </div>
        <button className="btn-gradient px-4 py-2 flex items-center gap-2">
          <PlusIcon className="w-5 h-5" /> Propose Research
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {grants.map((grant) => (
          <div key={grant.id} className="glass-card p-6 flex flex-col md:flex-row gap-6 hover:shadow-xl transition-shadow border-s-4 border-s-primary-500">
            <div className="flex-1 space-y-4">
              <div className="flex justify-between items-start">
                <span className={`badge ${grant.status === 'active' ? 'badge-success' : 'badge-warning'} capitalize`}>
                  {grant.status.replace('_', ' ')}
                </span>
                <div className="text-right">
                  <p className="text-xs text-surface-500 uppercase tracking-wider font-bold mb-1">Requested Budget</p>
                  <p className="font-mono font-bold text-lg">${grant.requested_budget.toLocaleString()}</p>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold mb-2 text-surface-900 dark:text-white flex items-center gap-2">
                  <BeakerIcon className="w-6 h-6 text-primary-500" /> {grant.title}
                </h2>
                <p className="text-surface-600 dark:text-surface-400 text-sm leading-relaxed max-w-3xl">
                  {grant.abstract}
                </p>
              </div>

              <div className="flex items-center gap-6 pt-4 border-t border-surface-200 dark:border-surface-700">
                {grant.start_date && (
                  <div>
                    <p className="text-xs text-surface-500 uppercase tracking-wider mb-1">Start Date</p>
                    <p className="text-sm font-medium">{formatDateTime(grant.start_date)}</p>
                  </div>
                )}
                {grant.approved_budget && (
                  <div>
                    <p className="text-xs text-surface-500 uppercase tracking-wider mb-1">Approved Funding</p>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      ${grant.approved_budget.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="w-full md:w-48 flex flex-col justify-end gap-3 pt-4 border-t md:border-t-0 md:border-s border-surface-200 dark:border-surface-700 md:ps-6">
              <button className="btn-outline w-full py-2 flex items-center justify-center gap-2 text-sm">
                <DocumentTextIcon className="w-4 h-4" /> View Details
              </button>
              {grant.status === 'active' && (
                <button className="bg-primary-50 text-primary-600 hover:bg-primary-100 dark:bg-primary-900/20 dark:text-primary-400 dark:hover:bg-primary-900/40 w-full py-2 rounded-xl transition-colors font-medium text-sm flex items-center justify-center gap-2">
                  <CurrencyDollarIcon className="w-4 h-4" /> Expense Request
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
