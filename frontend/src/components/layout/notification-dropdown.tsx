"use client";

import { useState, useRef, useEffect } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import Link from "next/link";

export function NotificationDropdown() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
        title="الإشعارات"
      >
        <svg
          className="w-5 h-5 text-surface-500"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 items-center justify-center text-[8px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-white dark:bg-surface-900 rounded-xl shadow-xl border border-surface-200 dark:border-surface-700 overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-surface-100 dark:border-surface-800">
            <h3 className="font-semibold text-surface-900 dark:text-surface-50">الإشعارات</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
              >
                تحديد الكل كمقروء
              </button>
            )}
          </div>
          
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-surface-500 dark:text-surface-400">
                <svg className="w-12 h-12 mx-auto mb-3 text-surface-300 dark:text-surface-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p>لا توجد إشعارات حالياً</p>
              </div>
            ) : (
              <div className="divide-y divide-surface-100 dark:divide-surface-800">
                {notifications.slice(0, 10).map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 transition-colors hover:bg-surface-50 dark:hover:bg-surface-800/50 ${
                      !notif.read_at ? "bg-primary-50/50 dark:bg-primary-900/10" : ""
                    }`}
                    onClick={() => {
                      if (!notif.read_at) markAsRead(notif.id);
                    }}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {/* Priority Icon Mapping */}
                        {notif.priority === "success" && (
                          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          </div>
                        )}
                        {notif.priority === "urgent" && (
                          <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </div>
                        )}
                        {(notif.priority === "info" || !notif.priority) && (
                          <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notif.read_at ? "font-semibold text-surface-900 dark:text-surface-50" : "font-medium text-surface-800 dark:text-surface-200"}`}>
                          {notif.title}
                        </p>
                        <p className="text-sm text-surface-500 dark:text-surface-400 line-clamp-2 mt-0.5">
                          {notif.message}
                        </p>
                        <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">
                          {new Date(notif.created_at).toLocaleDateString("ar-SA", {
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                        {notif.link && (
                          <Link href={notif.link} className="inline-block mt-2 text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline">
                            عرض التفاصيل
                          </Link>
                        )}
                      </div>
                      {!notif.read_at && (
                        <div className="flex-shrink-0">
                          <span className="inline-block w-2 h-2 bg-primary-500 rounded-full"></span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-2 border-t border-surface-100 dark:border-surface-800 text-center">
            <Link 
              href="/portal/notifications"
              className="block w-full py-2 text-sm font-medium text-surface-600 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 rounded-lg transition-colors"
              onClick={() => setIsOpen(false)}
            >
              عرض كل الإشعارات
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
