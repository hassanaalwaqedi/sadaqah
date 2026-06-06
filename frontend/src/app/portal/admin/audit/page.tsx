"use client";

import { useEffect, useState, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import { withPermission } from "@/lib/use-permissions";

interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address: string;
  user_agent: string;
  request_id: string;
  success: boolean;
  target_user_id?: string;
  created_at: string;
}

interface PaginatedResult {
  data: AuditLog[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  UPDATE: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  DELETE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  ASSIGN: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  DEACTIVATE: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  SUSPEND: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  LOGIN: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
};

function getActionColor(action: string) {
  for (const [key, value] of Object.entries(ACTION_COLORS)) {
    if (action.includes(key)) return value;
  }
  return "bg-surface-100 text-surface-700 dark:bg-surface-800 dark:text-surface-300";
}

function AuditPage() {
  const [result, setResult] = useState<PaginatedResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ action: "", entity_type: "", search: "" });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({ page: String(page), page_size: "25" });
      if (filters.action) params.set("action", filters.action);
      if (filters.entity_type) params.set("entity_type", filters.entity_type);
      if (filters.search) params.set("search", filters.search);

      const res = await apiClient.get(`/admin/audit-logs?${params.toString()}`);
      setResult(res.data);
    } catch (err) {
      console.error("Failed to load audit logs", err);
    } finally {
      setIsLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const formatDate = (d: string) => {
    return new Date(d).toLocaleString("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">سجل المراجعة</h1>
        <p className="text-surface-500 mt-1">عرض جميع الإجراءات الإدارية والتغييرات في النظام</p>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={filters.search}
          onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setPage(1); }}
          className="flex-1 min-w-[200px] px-4 py-2 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-50 text-sm focus:ring-2 focus:ring-primary-500"
          placeholder="بحث..."
        />
        <select
          value={filters.entity_type}
          onChange={(e) => { setFilters({ ...filters, entity_type: e.target.value }); setPage(1); }}
          className="px-4 py-2 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-50 text-sm focus:ring-2 focus:ring-primary-500"
        >
          <option value="">جميع الكيانات</option>
          <option value="user">المستخدمين</option>
          <option value="role">الأدوار</option>
          <option value="scholarship">المنح</option>
          <option value="housing">السكن</option>
          <option value="finance">المالية</option>
        </select>
        <button
          onClick={() => { setFilters({ action: "", entity_type: "", search: "" }); setPage(1); }}
          className="px-4 py-2 rounded-xl text-sm font-medium text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
        >
          مسح الفلاتر
        </button>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
                <th className="text-start px-4 py-3 font-medium text-surface-500">الوقت</th>
                <th className="text-start px-4 py-3 font-medium text-surface-500">الإجراء</th>
                <th className="text-start px-4 py-3 font-medium text-surface-500">الكيان</th>
                <th className="text-start px-4 py-3 font-medium text-surface-500">IP</th>
                <th className="text-start px-4 py-3 font-medium text-surface-500">الحالة</th>
                <th className="text-start px-4 py-3 font-medium text-surface-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
              {isLoading ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3"><div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-24" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-20" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-16" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-24" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-10" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-6" /></td>
                  </tr>
                ))
              ) : result?.data?.length ? (
                result.data.map((log) => (
                  <>
                    <tr
                      key={log.id}
                      className="hover:bg-surface-50 dark:hover:bg-surface-800/30 cursor-pointer transition-colors"
                      onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                    >
                      <td className="px-4 py-3 text-surface-600 dark:text-surface-400 whitespace-nowrap text-xs">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-surface-700 dark:text-surface-300 font-mono text-xs">
                        {log.entity_type}
                      </td>
                      <td className="px-4 py-3 text-surface-500 font-mono text-xs">
                        {log.ip_address || "—"}
                      </td>
                      <td className="px-4 py-3">
                        {log.success !== false ? (
                          <span className="text-emerald-500">✓</span>
                        ) : (
                          <span className="text-red-500">✗</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <svg className={`w-4 h-4 text-surface-400 transition-transform ${expandedId === log.id ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                      </td>
                    </tr>
                    {expandedId === log.id && (
                      <tr key={`${log.id}-detail`}>
                        <td colSpan={6} className="px-4 py-4 bg-surface-50 dark:bg-surface-800/20">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                            <div>
                              <span className="text-surface-400">User ID</span>
                              <p className="font-mono text-surface-700 dark:text-surface-300 mt-0.5 break-all">{log.user_id || "—"}</p>
                            </div>
                            <div>
                              <span className="text-surface-400">Entity ID</span>
                              <p className="font-mono text-surface-700 dark:text-surface-300 mt-0.5 break-all">{log.entity_id}</p>
                            </div>
                            <div>
                              <span className="text-surface-400">Request ID</span>
                              <p className="font-mono text-surface-700 dark:text-surface-300 mt-0.5 break-all">{log.request_id || "—"}</p>
                            </div>
                            <div>
                              <span className="text-surface-400">Target User</span>
                              <p className="font-mono text-surface-700 dark:text-surface-300 mt-0.5 break-all">{log.target_user_id || "—"}</p>
                            </div>
                            {log.old_values && (
                              <div className="col-span-2">
                                <span className="text-surface-400">القيم السابقة</span>
                                <pre className="font-mono text-surface-700 dark:text-surface-300 mt-0.5 bg-white dark:bg-surface-900 rounded-lg p-2 overflow-auto max-h-32 text-[11px]">
                                  {JSON.stringify(log.old_values, null, 2)}
                                </pre>
                              </div>
                            )}
                            {log.new_values && (
                              <div className="col-span-2">
                                <span className="text-surface-400">القيم الجديدة</span>
                                <pre className="font-mono text-surface-700 dark:text-surface-300 mt-0.5 bg-white dark:bg-surface-900 rounded-lg p-2 overflow-auto max-h-32 text-[11px]">
                                  {JSON.stringify(log.new_values, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-surface-400">
                    لا توجد سجلات
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {result && result.total_pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-surface-200 dark:border-surface-700">
            <p className="text-xs text-surface-400">
              صفحة {result.page} من {result.total_pages} ({result.total} سجل)
            </p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 text-xs rounded-lg border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800 disabled:opacity-30 transition-colors"
              >
                السابق
              </button>
              <button
                disabled={page >= result.total_pages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 text-xs rounded-lg border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800 disabled:opacity-30 transition-colors"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default withPermission(AuditPage, "admin.audit");
