"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import { formatDateTime, cn } from "@/lib/utils";
import { PermissionGate } from "@/lib/use-permissions";

interface User {
  id: string;
  email: string;
  email_verified: boolean;
  is_active: boolean;
  profile_completed: boolean;
  created_at: string;
  roles: string[];
}

interface PaginatedResponse {
  data: User[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: "مدير عام",
  admin: "مسؤول",
  org_admin: "مسؤول المنظمة",
  scholarship_manager: "مدير المنح",
  housing_manager: "مدير السكن",
  innovation_manager: "مدير الابتكار",
  financial_officer: "مسؤول مالي",
  auditor: "مراجع",
  judge: "محكّم",
  researcher: "باحث",
  student: "طالب",
  donor: "متبرع",
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  admin: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  org_admin: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  scholarship_manager: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  housing_manager: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  innovation_manager: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  financial_officer: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  judge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  student: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
};

export default function AdminUsersPage() {
  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = { page, page_size: 15 };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;

      const response = await apiClient.get("/admin/users", { params });
      setData(response.data);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, roleFilter, statusFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleDeactivate = async (id: string) => {
    if (!confirm("هل أنت متأكد من إلغاء تنشيط هذا المستخدم؟")) return;
    try {
      await apiClient.delete(`/admin/users/${id}`);
      fetchUsers();
    } catch (error) {
      console.error("Failed to deactivate user", error);
    }
  };

  const handleSuspend = async (id: string) => {
    const reason = prompt("سبب الإيقاف (اختياري):");
    try {
      await apiClient.post(`/admin/users/${id}/suspend`, { reason: reason || "" });
      fetchUsers();
      setActionMenuId(null);
    } catch (error) {
      console.error("Failed to suspend user", error);
    }
  };

  const handleReactivate = async (id: string) => {
    try {
      await apiClient.post(`/admin/users/${id}/reactivate`);
      fetchUsers();
      setActionMenuId(null);
    } catch (error) {
      console.error("Failed to reactivate user", error);
    }
  };

  const handleForceLogout = async (id: string) => {
    if (!confirm("هل أنت متأكد؟ سيتم إنهاء جميع جلسات هذا المستخدم.")) return;
    try {
      await apiClient.post(`/admin/users/${id}/force-logout`);
      setActionMenuId(null);
    } catch (error) {
      console.error("Failed to force logout", error);
    }
  };

  const handleAssignRole = async (id: string, role: string) => {
    try {
      await apiClient.post(`/admin/users/${id}/roles`, { role });
      fetchUsers();
    } catch (error) {
      console.error("Failed to assign role", error);
      alert("حدث خطأ أثناء تعيين الصلاحية");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
            إدارة المستخدمين
          </h1>
          <p className="text-sm text-surface-500 mt-1">
            إدارة حسابات المستخدمين وأدوارهم وصلاحياتهم في النظام
          </p>
        </div>
        {data && (
          <div className="text-sm text-surface-400">
            {data.total} مستخدم مسجل
          </div>
        )}
      </div>

      <div className="glass-card">
        {/* Toolbar with Filters */}
        <div className="p-4 border-b border-surface-200 dark:border-surface-700 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <svg
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400"
              fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              placeholder="البحث بالبريد الإلكتروني..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="form-input ps-10"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="px-4 py-2 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-50 text-sm focus:ring-2 focus:ring-primary-500"
          >
            <option value="">جميع الأدوار</option>
            {Object.entries(ROLE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-4 py-2 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-50 text-sm focus:ring-2 focus:ring-primary-500"
          >
            <option value="">جميع الحالات</option>
            <option value="active">نشط</option>
            <option value="suspended">موقوف</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-start text-sm">
            <thead className="bg-surface-50 dark:bg-surface-800/50 text-surface-500 border-b border-surface-200 dark:border-surface-700">
              <tr>
                <th className="px-6 py-4 font-medium">المستخدم</th>
                <th className="px-6 py-4 font-medium">الأدوار</th>
                <th className="px-6 py-4 font-medium">تاريخ التسجيل</th>
                <th className="px-6 py-4 font-medium text-center">الحالة</th>
                <th className="px-6 py-4 font-medium text-end">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
              {isLoading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-40" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-24" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-28" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-12 mx-auto" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-16 ms-auto" /></td>
                  </tr>
                ))
              ) : data?.data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-surface-400">
                    لا يوجد مستخدمين مطابقين
                  </td>
                </tr>
              ) : (
                data?.data.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-9 h-9 rounded-full flex items-center justify-center font-medium text-xs",
                          user.is_active
                            ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
                            : "bg-surface-200 dark:bg-surface-700 text-surface-500"
                        )}>
                          {user.email[0].toUpperCase()}
                        </div>
                        <div>
                          <span className="font-medium text-surface-900 dark:text-surface-100 text-sm" dir="ltr">
                            {user.email}
                          </span>
                          {user.email_verified && (
                            <span className="ms-1 text-primary-500" title="بريد مفعّل">✓</span>
                          )}
                          <p className="text-[10px] text-surface-400 font-mono" dir="ltr">{user.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 items-center">
                        {user.roles?.map((role) => (
                          <span
                            key={role}
                            className={cn(
                              "px-2 py-0.5 text-[10px] font-semibold rounded-full",
                              ROLE_COLORS[role] || "bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400"
                            )}
                          >
                            {ROLE_LABELS[role] || role}
                          </span>
                        ))}
                        <PermissionGate permission="roles.assign">
                          <select
                            className="text-xs border rounded-lg px-1.5 py-0.5 bg-transparent text-surface-500 border-surface-200 dark:border-surface-700 cursor-pointer"
                            onChange={(e) => {
                              if (e.target.value) handleAssignRole(user.id, e.target.value);
                              e.target.value = "";
                            }}
                            defaultValue=""
                          >
                            <option value="" disabled>+ دور</option>
                            {Object.entries(ROLE_LABELS)
                              .filter(([key]) => !user.roles?.includes(key))
                              .map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                              ))}
                          </select>
                        </PermissionGate>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-surface-500 text-xs" dir="ltr">
                      {formatDateTime(user.created_at)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={cn(
                          "px-2 py-0.5 text-[10px] font-semibold rounded-full",
                          user.is_active
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                        )}
                      >
                        {user.is_active ? "نشط" : "موقوف"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-end">
                      <div className="relative">
                        <button
                          onClick={() => setActionMenuId(actionMenuId === user.id ? null : user.id)}
                          className="p-2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
                          </svg>
                        </button>
                        {actionMenuId === user.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setActionMenuId(null)} />
                            <div className="absolute end-0 top-full mt-1 z-20 w-48 py-1 bg-white dark:bg-surface-800 rounded-xl shadow-xl border border-surface-200 dark:border-surface-700 animate-fade-in">
                              <a
                                href={`/portal/admin/users/${user.id}`}
                                className="block w-full text-start px-4 py-2 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
                              >
                                عرض التفاصيل
                              </a>
                              <PermissionGate permission="users.update">
                                {user.is_active ? (
                                  <button
                                    onClick={() => handleSuspend(user.id)}
                                    className="block w-full text-start px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                                  >
                                    إيقاف مؤقت
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleReactivate(user.id)}
                                    className="block w-full text-start px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                                  >
                                    إعادة التنشيط
                                  </button>
                                )}
                                <button
                                  onClick={() => handleForceLogout(user.id)}
                                  className="block w-full text-start px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                                >
                                  إنهاء الجلسات
                                </button>
                              </PermissionGate>
                              <PermissionGate permission="users.delete">
                                <div className="border-t border-surface-100 dark:border-surface-700 my-1" />
                                <button
                                  onClick={() => { handleDeactivate(user.id); setActionMenuId(null); }}
                                  className="block w-full text-start px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                >
                                  إلغاء الحساب
                                </button>
                              </PermissionGate>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.total_pages > 1 && (
          <div className="p-4 border-t border-surface-200 dark:border-surface-700 flex items-center justify-between">
            <span className="text-sm text-surface-500">
              صفحة {data.page} من {data.total_pages} · {data.total} مستخدم
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-sm border border-surface-200 dark:border-surface-700 rounded-lg disabled:opacity-30 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
              >
                السابق
              </button>
              <button
                disabled={page === data.total_pages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-sm border border-surface-200 dark:border-surface-700 rounded-lg disabled:opacity-30 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
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

