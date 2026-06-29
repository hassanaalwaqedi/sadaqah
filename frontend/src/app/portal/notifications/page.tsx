"use client";

import { useNotifications } from "@/hooks/useNotifications";
import Link from "next/link";
import { useState } from "react";

export default function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const filteredNotifications = notifications.filter(
    (n) => filter === "all" || !n.read_at
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
            مركز الإشعارات
          </h1>
          <p className="text-sm text-surface-500 mt-1">
            متابعة التنبيهات والأحداث الخاصة بك
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-surface-100 dark:bg-surface-800 p-1 rounded-lg inline-flex">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filter === "all"
                  ? "bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 shadow-sm"
                  : "text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                filter === "unread"
                  ? "bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 shadow-sm"
                  : "text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
              }`}
            >
              غير المقروءة
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/40 rounded-lg transition-colors"
            >
              تحديد الكل كمقروء
            </button>
          )}
        </div>
      </div>

      {filteredNotifications.length === 0 ? (
        <div className="bg-white dark:bg-surface-800/50 rounded-2xl border border-surface-200 dark:border-surface-700 p-12 text-center">
          <div className="w-16 h-16 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-surface-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-surface-900 dark:text-surface-50 mb-1">
            لا توجد إشعارات
          </h3>
          <p className="text-surface-500">
            {filter === "unread"
              ? "لقد قمت بقراءة جميع الإشعارات."
              : "لم تتلقَ أي إشعارات بعد."}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-surface-800/50 rounded-2xl border border-surface-200 dark:border-surface-700 divide-y divide-surface-100 dark:divide-surface-700/50 overflow-hidden shadow-sm">
          {filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-5 transition-colors hover:bg-surface-50 dark:hover:bg-surface-800 flex gap-4 ${
                !notif.read_at ? "bg-primary-50/30 dark:bg-primary-900/10" : ""
              }`}
              onClick={() => {
                if (!notif.read_at) markAsRead(notif.id);
              }}
            >
              <div className="flex-shrink-0 mt-1">
                {notif.priority === "success" && (
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                )}
                {notif.priority === "urgent" && (
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                )}
                {(notif.priority === "info" || !notif.priority) && (
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className={`text-base ${!notif.read_at ? "font-semibold text-surface-900 dark:text-surface-50" : "font-medium text-surface-800 dark:text-surface-200"}`}>
                      {notif.title}
                    </h4>
                    <p className="text-surface-600 dark:text-surface-400 mt-1">
                      {notif.message}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className="text-xs font-medium text-surface-400 bg-surface-100 dark:bg-surface-800 px-2 py-1 rounded-md">
                      {new Date(notif.created_at).toLocaleDateString("ar-SA", {
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                    {!notif.read_at && (
                      <span className="w-2.5 h-2.5 bg-primary-500 rounded-full shadow-sm shadow-primary-500/50"></span>
                    )}
                  </div>
                </div>

                {notif.link && (
                  <div className="mt-4 flex gap-3">
                    <Link
                      href={notif.link}
                      className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                    >
                      عرض التفاصيل
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
