"use client";

import { useState, useEffect } from "react";
import { Plus, Users, LayoutList, Trophy } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";

type InnovationEvent = {
  id: string;
  name_en: string;
  name_ar: string;
  status: string;
  submission_deadline: string;
};

export default function AdminInnovationDashboard() {
  const [events, setEvents] = useState<InnovationEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await apiClient.get<InnovationEvent[]>("/innovation/events");
        setEvents(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  if (isLoading) {
    return <div className="p-8 text-center">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold gradient-text">إدارة مسابقات الابتكار</h1>
          <p className="text-surface-600 dark:text-surface-400 mt-1">
            إدارة المسابقات، المعايير، والمشاريع
          </p>
        </div>
        <Link 
          href="/portal/admin/innovation/create"
          className="btn-gradient px-4 py-2 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> مسابقة جديدة
        </Link>
      </div>

      {/* Events Table */}
      <div className="glass-card overflow-hidden">
        <table className="w-full text-right text-sm">
          <thead className="bg-surface-50 dark:bg-surface-800/50 text-surface-600 dark:text-surface-400 border-b">
            <tr>
              <th className="px-6 py-4 font-medium">اسم المسابقة</th>
              <th className="px-6 py-4 font-medium">الحالة</th>
              <th className="px-6 py-4 font-medium">الموعد النهائي</th>
              <th className="px-6 py-4 font-medium text-left">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
            {events.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-surface-500">لا توجد مسابقات حاليا.</td>
              </tr>
            ) : events.map((event) => (
              <tr key={event.id} className="hover:bg-surface-50 dark:hover:bg-surface-800/20 transition-colors">
                <td className="px-6 py-4 font-medium flex items-center gap-3">
                  <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg text-primary-600 dark:text-primary-400">
                    <Trophy className="w-4 h-4" />
                  </div>
                  {event.name_ar}
                </td>
                <td className="px-6 py-4">
                  <span className={`badge ${
                    event.status === 'open' ? 'badge-success' : 
                    event.status === 'draft' ? 'badge-warning' : 'badge-neutral'
                  } capitalize`}>
                    {event.status === "open" ? "مفتوح" : event.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-surface-500">{formatDateTime(event.submission_deadline)}</td>
                <td className="px-6 py-4 text-left">
                  <Link 
                    href={`/portal/admin/innovation/${event.id}`} 
                    className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 bg-primary-50 dark:bg-primary-900/30 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium"
                  >
                    <Users className="w-4 h-4" />
                    عرض الطلبات
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
