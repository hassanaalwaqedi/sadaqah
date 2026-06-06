"use client";

import { useEffect, useState, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import { withPermission } from "@/lib/use-permissions";
import { cn } from "@/lib/utils";

interface Role {
  id: string;
  name: string;
  display_name_en: string;
  display_name_ar: string;
  description?: string;
  is_system: boolean;
  is_active: boolean;
  permission_count: number;
  user_count: number;
  created_at: string;
}

function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRole, setNewRole] = useState({ name: "", display_name_en: "", display_name_ar: "", description: "" });
  const [creating, setCreating] = useState(false);

  const loadRoles = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get(`/admin/roles?include_inactive=${showInactive}`);
      setRoles(res.data?.data || []);
    } catch (err) {
      console.error("Failed to load roles", err);
    } finally {
      setIsLoading(false);
    }
  }, [showInactive]);

  useEffect(() => { loadRoles(); }, [loadRoles]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await apiClient.post("/admin/roles", newRole);
      setShowCreateModal(false);
      setNewRole({ name: "", display_name_en: "", display_name_ar: "", description: "" });
      loadRoles();
    } catch (err) {
      console.error("Failed to create role", err);
    } finally {
      setCreating(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm("هل أنت متأكد من تعطيل هذا الدور؟")) return;
    try {
      await apiClient.delete(`/admin/roles/${id}`);
      loadRoles();
    } catch (err) {
      console.error("Failed to deactivate role", err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">إدارة الأدوار</h1>
          <p className="text-surface-500 mt-1">إنشاء وتعديل الأدوار والصلاحيات</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded border-surface-300"
            />
            إظهار المعطّلة
          </label>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-primary-500/25 transition-all duration-200"
          >
            + دور جديد
          </button>
        </div>
      </div>

      {/* Roles Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card p-6 animate-pulse">
              <div className="h-5 bg-surface-200 dark:bg-surface-700 rounded w-2/3 mb-3" />
              <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-1/2 mb-4" />
              <div className="flex gap-4">
                <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded w-1/4" />
                <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => (
            <div
              key={role.id}
              className={cn(
                "glass-card p-6 hover-lift group relative",
                !role.is_active && "opacity-60"
              )}
            >
              {/* Badge */}
              <div className="flex items-center gap-2 mb-3">
                {role.is_system ? (
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                    نظامي
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-300">
                    مخصص
                  </span>
                )}
                {!role.is_active && (
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                    معطّل
                  </span>
                )}
              </div>

              {/* Name */}
              <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-1">
                {role.display_name_ar}
              </h3>
              <p className="text-xs text-surface-400 mb-4 font-mono">{role.name}</p>

              {/* Stats */}
              <div className="flex items-center gap-6 text-sm text-surface-500 dark:text-surface-400">
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                  </svg>
                  <span>{role.permission_count} صلاحية</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                  </svg>
                  <span>{role.user_count} مستخدم</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-surface-100 dark:border-surface-800">
                <a
                  href={`/portal/admin/roles/${role.id}`}
                  className="flex-1 text-center px-3 py-1.5 text-xs font-medium rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
                >
                  عرض التفاصيل
                </a>
                {!role.is_system && role.is_active && (
                  <button
                    onClick={() => handleDeactivate(role.id)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    تعطيل
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glass-card p-8 w-full max-w-lg mx-4 animate-fade-in">
            <h2 className="text-xl font-bold text-surface-900 dark:text-surface-50 mb-6">إنشاء دور جديد</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">المعرّف (بالإنجليزية)</label>
                <input
                  type="text"
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
                  className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-50 focus:ring-2 focus:ring-primary-500 text-sm font-mono"
                  placeholder="custom_role_name"
                  required
                  dir="ltr"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">الاسم (EN)</label>
                  <input
                    type="text"
                    value={newRole.display_name_en}
                    onChange={(e) => setNewRole({ ...newRole, display_name_en: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-50 focus:ring-2 focus:ring-primary-500 text-sm"
                    placeholder="Display Name"
                    required
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">الاسم (AR)</label>
                  <input
                    type="text"
                    value={newRole.display_name_ar}
                    onChange={(e) => setNewRole({ ...newRole, display_name_ar: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-50 focus:ring-2 focus:ring-primary-500 text-sm"
                    placeholder="الاسم العرض"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">الوصف</label>
                <textarea
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-50 focus:ring-2 focus:ring-primary-500 text-sm"
                  rows={3}
                  placeholder="وصف اختياري للدور..."
                />
              </div>
              <div className="flex items-center gap-3 pt-4">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {creating ? "جاري الإنشاء..." : "إنشاء"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default withPermission(RolesPage, "roles.read");
