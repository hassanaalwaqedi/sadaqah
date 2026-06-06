"use client";

import { useAuth } from "@/providers/auth-provider";
import React from "react";

/**
 * usePermissions hook - provides permission checking utilities.
 */
export function usePermissions() {
  const { hasPermission, hasAnyPermission, hasRole, hasAnyRole, user } = useAuth();

  return {
    hasPermission,
    hasAnyPermission,
    hasRole,
    hasAnyRole,
    permissions: user?.permissions ?? [],
    roles: user?.roles?.map((r) => r.name) ?? [],
    isSuperAdmin: hasRole("super_admin"),
    isAdmin: hasAnyRole("super_admin", "admin", "org_admin"),
  };
}

/**
 * PermissionGate - renders children only if the user has the required permission.
 * Supports both permission-based and role-based checks.
 *
 * @example
 * <PermissionGate permission="users.read">
 *   <UserList />
 * </PermissionGate>
 *
 * @example
 * <PermissionGate permissions={["finance.read", "finance.manage"]} fallback={<AccessDenied />}>
 *   <FinanceDashboard />
 * </PermissionGate>
 */
interface PermissionGateProps {
  /** Single permission to check */
  permission?: string;
  /** Multiple permissions (user needs at least one) */
  permissions?: string[];
  /** Role-based check (user needs at least one) */
  roles?: string[];
  /** Component to render if access is denied */
  fallback?: React.ReactNode;
  /** Children to render if access is granted */
  children: React.ReactNode;
}

export function PermissionGate({
  permission,
  permissions,
  roles,
  fallback = null,
  children,
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAnyRole, hasRole } = useAuth();

  // Super admin always has access
  if (hasRole("super_admin")) {
    return <>{children}</>;
  }

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions && permissions.length > 0) {
    hasAccess = hasAnyPermission(...permissions);
  } else if (roles && roles.length > 0) {
    hasAccess = hasAnyRole(...roles);
  } else {
    // No restrictions specified, allow access
    hasAccess = true;
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

/**
 * withPermission HOC - wraps a component with permission checking.
 *
 * @example
 * const ProtectedPage = withPermission(AdminPage, "admin.access");
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  permission: string,
  FallbackComponent?: React.ComponentType
) {
  return function PermissionWrapped(props: P) {
    const { hasPermission, hasRole } = useAuth();

    if (hasRole("super_admin") || hasPermission(permission)) {
      return <Component {...props} />;
    }

    if (FallbackComponent) {
      return <FallbackComponent />;
    }

    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-50">
            صلاحيات غير كافية
          </h2>
          <p className="text-surface-500 text-sm max-w-md">
            ليس لديك الصلاحيات اللازمة للوصول إلى هذه الصفحة. يرجى التواصل مع المسؤول.
          </p>
        </div>
      </div>
    );
  };
}
