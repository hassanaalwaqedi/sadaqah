"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { formatDateTime } from "@/lib/utils";

interface User {
  id: string;
  email: string;
  email_verified: boolean;
  is_active: boolean;
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

export default function AdminUsersPage() {
  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get("/admin/users", {
        params: { page, page_size: 10, search },
      });
      setData(response.data);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  const handleDeactivate = async (id: string) => {
    if (!confirm("هل أنت متأكد من إلغاء تنشيط هذا المستخدم؟")) return;
    try {
      await apiClient.delete(`/admin/users/${id}`);
      fetchUsers();
    } catch (error) {
      console.error("Failed to deactivate user", error);
      alert("حدث خطأ أثناء إلغاء التنشيط");
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
            إدارة حسابات المستخدمين وصلاحياتهم في النظام
          </p>
        </div>
        <button className="btn-gradient">إضافة مستخدم جديد</button>
      </div>

      <div className="glass-card">
        {/* Toolbar */}
        <div className="p-4 border-b border-surface-200 dark:border-surface-700 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <svg
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <input
              type="text"
              placeholder="البحث بالبريد الإلكتروني..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="form-input ps-10"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-start text-sm">
            <thead className="bg-surface-50 dark:bg-surface-800/50 text-surface-500 border-b border-surface-200 dark:border-surface-700">
              <tr>
                <th className="px-6 py-4 font-medium">البريد الإلكتروني</th>
                <th className="px-6 py-4 font-medium">الصلاحيات</th>
                <th className="px-6 py-4 font-medium">تاريخ التسجيل</th>
                <th className="px-6 py-4 font-medium text-center">الحالة</th>
                <th className="px-6 py-4 font-medium text-end">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-surface-500">
                    جاري التحميل...
                  </td>
                </tr>
              ) : data?.data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-surface-500">
                    لا يوجد مستخدمين
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
                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-300 font-medium text-xs">
                          {user.email[0].toUpperCase()}
                        </div>
                        <span className="font-medium text-surface-900 dark:text-surface-100" dir="ltr">
                          {user.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {user.roles?.map((role) => (
                          <span key={role} className="badge badge-primary">
                            {role}
                          </span>
                        ))}
                        <select
                          className="text-xs border rounded px-1 py-0.5 bg-transparent text-surface-500"
                          onChange={(e) => {
                            if (e.target.value) handleAssignRole(user.id, e.target.value);
                            e.target.value = "";
                          }}
                          defaultValue=""
                        >
                          <option value="" disabled>+ صلاحية</option>
                          <option value="admin">مسؤول</option>
                          <option value="scholarship_admin">مسؤول منح</option>
                          <option value="housing_admin">مسؤول سكن</option>
                          <option value="judge">محكم</option>
                        </select>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-surface-500" dir="ltr">
                      {formatDateTime(user.created_at)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`badge ${
                          user.is_active ? "badge-success" : "badge-danger"
                        }`}
                      >
                        {user.is_active ? "نشط" : "غير نشط"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-end">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 text-surface-400 hover:text-primary-600 transition-colors">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </button>
                        {user.is_active && (
                          <button
                            onClick={() => handleDeactivate(user.id)}
                            className="p-2 text-surface-400 hover:text-red-600 transition-colors"
                            title="إلغاء تنشيط"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                          </button>
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
              إجمالي {data.total} مستخدم
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50"
              >
                السابق
              </button>
              <button
                disabled={page === data.total_pages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50"
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
