"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { withPermission } from "@/lib/use-permissions";
import { cn } from "@/lib/utils";

interface Permission {
  id: string;
  resource: string;
  action: string;
  description: string;
}

interface PermissionWithGroup {
  id: string;
  resource: string;
  action: string;
  description: string;
  group_id?: string;
  group_name: string;
}

interface RoleDetail {
  id: string;
  name: string;
  display_name_en: string;
  display_name_ar: string;
  description?: string;
  is_system: boolean;
  is_active: boolean;
  permissions: Permission[];
  created_at: string;
  updated_at: string;
}

function RoleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [role, setRole] = useState<RoleDetail | null>(null);
  const [allPermissions, setAllPermissions] = useState<PermissionWithGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [roleRes, permsRes] = await Promise.all([
        apiClient.get(`/admin/roles/${id}`),
        apiClient.get("/admin/permissions"),
      ]);
      setRole(roleRes.data);
      setAllPermissions(permsRes.data?.data || []);
    } catch (err) {
      console.error("Failed to load role", err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  const rolePermIds = new Set(role?.permissions?.map((p) => p.id) || []);

  const groupedPerms = allPermissions.reduce((acc, perm) => {
    const group = perm.group_name || "ungrouped";
    if (!acc[group]) acc[group] = [];
    acc[group].push(perm);
    return acc;
  }, {} as Record<string, PermissionWithGroup[]>);

  const togglePermission = async (permId: string, enabled: boolean) => {
    if (!role || role.is_system) return;
    setSaving(true);
    try {
      if (enabled) {
        await apiClient.put(`/admin/roles/${id}/permissions`, { permission_ids: [permId] });
      } else {
        await apiClient.delete(`/admin/roles/${id}/permissions`, { data: { permission_ids: [permId] } });
      }
      loadData();
    } catch (err) {
      console.error("Failed to update permission", err);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="glass-card p-8 animate-pulse">
          <div className="h-8 bg-surface-200 dark:bg-surface-700 rounded w-1/3 mb-4" />
          <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="text-center py-20">
        <p className="text-surface-500">الدور غير موجود</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <a href="/portal/admin/roles" className="text-surface-400 hover:text-surface-600 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
            </a>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
              {role.display_name_ar}
            </h1>
            {role.is_system && (
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                نظامي
              </span>
            )}
          </div>
          <p className="text-surface-500 text-sm">
            <span className="font-mono">{role.name}</span> · {role.display_name_en}
          </p>
          {role.description && <p className="text-surface-400 text-sm mt-1">{role.description}</p>}
        </div>
      </div>

      {/* Permissions by Group */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50">
          الصلاحيات ({role.permissions?.length || 0})
        </h2>

        {role.is_system && (
          <div className="glass-card p-4 border-l-4 border-amber-400 bg-amber-50/50 dark:bg-amber-900/10">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              ⚠️ هذا دور نظامي — يمكنك عرض الصلاحيات ولكن لا يمكنك تعديلها.
            </p>
          </div>
        )}

        {Object.entries(groupedPerms).map(([groupName, perms]) => (
          <div key={groupName} className="glass-card overflow-hidden">
            <div className="px-6 py-3 bg-surface-50 dark:bg-surface-800/50 border-b border-surface-200 dark:border-surface-700">
              <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300 capitalize">
                {groupName.replace(/_/g, " ")}
              </h3>
            </div>
            <div className="divide-y divide-surface-100 dark:divide-surface-800">
              {perms.map((perm) => {
                const isAssigned = rolePermIds.has(perm.id);
                return (
                  <div
                    key={perm.id}
                    className="flex items-center justify-between px-6 py-3 hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-surface-900 dark:text-surface-50 font-mono">
                        {perm.resource}.{perm.action}
                      </p>
                      <p className="text-xs text-surface-400">{perm.description}</p>
                    </div>
                    <button
                      onClick={() => togglePermission(perm.id, !isAssigned)}
                      disabled={role.is_system || saving}
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200",
                        isAssigned
                          ? "bg-primary-500"
                          : "bg-surface-300 dark:bg-surface-600",
                        (role.is_system || saving) && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200",
                          isAssigned ? "translate-x-1 rtl:-translate-x-6" : "translate-x-6 rtl:-translate-x-1"
                        )}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default withPermission(RoleDetailPage, "roles.read");
