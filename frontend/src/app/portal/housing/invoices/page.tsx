"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { formatDateTime } from "@/lib/utils";
import { Receipt, CheckCircle2, Clock, AlertCircle } from "lucide-react";

// Mock data
const MOCK_INVOICES = [
  { id: "inv-001", amount: 150.00, payment_month: "2024-09-01", status: "paid", generated_at: "2024-09-01T00:00:00Z" },
  { id: "inv-002", amount: 150.00, payment_month: "2024-10-01", status: "paid", generated_at: "2024-10-01T00:00:00Z" },
  { id: "inv-003", amount: 150.00, payment_month: "2024-11-01", status: "pending", generated_at: "2024-11-01T00:00:00Z" },
  { id: "inv-004", amount: 150.00, payment_month: "2024-12-01", status: "pending", generated_at: "2024-12-01T00:00:00Z" },
];

export default function RentInvoices() {
  const [invoices, setInvoices] = useState(MOCK_INVOICES);

  // useEffect(() => {
  //   apiClient.get("/housing/invoices/me").then(res => setInvoices(res.data));
  // }, []);

  const totalPending = invoices.filter(i => i.status === "pending").reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Rent & Invoices</h1>
          <p className="text-surface-600 dark:text-surface-400 mt-1">
            Manage your automated monthly rent payments.
          </p>
        </div>
        
        {totalPending > 0 && (
          <div className="text-right">
            <div className="text-sm text-surface-500 mb-1">Total Due</div>
            <div className="text-3xl font-bold text-red-500">${totalPending.toFixed(2)}</div>
            <button className="btn-gradient px-6 py-2 mt-2">Pay All Now</button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-card p-6 border-l-4 border-l-emerald-500">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-surface-600 font-medium">Paid Invoices</h3>
            <CheckCircle2 className="text-emerald-500 w-6 h-6" />
          </div>
          <p className="text-3xl font-bold">{invoices.filter(i => i.status === 'paid').length}</p>
        </div>
        
        <div className="glass-card p-6 border-l-4 border-l-amber-500">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-surface-600 font-medium">Pending</h3>
            <Clock className="text-amber-500 w-6 h-6" />
          </div>
          <p className="text-3xl font-bold">{invoices.filter(i => i.status === 'pending').length}</p>
        </div>

        <div className="glass-card p-6 border-l-4 border-l-red-500">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-surface-600 font-medium">Overdue</h3>
            <AlertCircle className="text-red-500 w-6 h-6" />
          </div>
          <p className="text-3xl font-bold">{invoices.filter(i => i.status === 'overdue').length}</p>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-50 dark:bg-surface-800/50 text-surface-600 dark:text-surface-400 border-b">
              <tr>
                <th className="px-6 py-4 font-medium">Invoice ID</th>
                <th className="px-6 py-4 font-medium">Billing Month</th>
                <th className="px-6 py-4 font-medium">Generated On</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-surface-50 dark:hover:bg-surface-800/20 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-surface-500">{inv.id.toUpperCase()}</td>
                  <td className="px-6 py-4 font-medium">
                    {new Date(inv.payment_month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4">{formatDateTime(inv.generated_at)}</td>
                  <td className="px-6 py-4 font-bold">${inv.amount.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`badge ${
                      inv.status === 'paid' ? 'badge-success' : 
                      inv.status === 'pending' ? 'badge-warning' : 'badge-danger'
                    } capitalize`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {inv.status === 'pending' || inv.status === 'overdue' ? (
                      <button className="text-primary-600 dark:text-primary-400 font-medium hover:underline">
                        Pay Now
                      </button>
                    ) : (
                      <button className="text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 font-medium flex items-center justify-end gap-1 w-full">
                        <Receipt className="w-4 h-4" /> Receipt
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
