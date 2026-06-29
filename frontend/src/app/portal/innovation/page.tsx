"use client";

import { useState, useEffect } from "react";
import { Calendar, Users, Trophy, ChevronLeft } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";

type InnovationEvent = {
  id: string;
  name_en: string;
  name_ar: string;
  description: string;
  status: string;
  submission_deadline: string;
};

export default function InnovationEvents() {
  const [events, setEvents] = useState<InnovationEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await apiClient.get<InnovationEvent[]>("/innovation/events");
        setEvents(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadEvents();
  }, []);

  if (isLoading) {
    return <div className="p-8 text-center">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold gradient-text">مسابقات الابتكار والتحديات</h1>
          <p className="text-surface-600 dark:text-surface-400 mt-2 max-w-2xl">
            شارك في مسابقات الابتكار، والهاكاثون، وعرض المشاريع لتحويل أفكارك إلى واقع.
          </p>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Trophy className="w-16 h-16 text-surface-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-surface-700">لا توجد مسابقات متاحة حالياً</h2>
          <p className="text-surface-500 mt-2">يرجى العودة لاحقاً للاطلاع على التحديات الجديدة.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((event) => (
            <div key={event.id} className="glass-card overflow-hidden hover:shadow-xl transition-all duration-300 border-t-4 border-t-primary-500 group">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <span className="badge badge-success capitalize px-3 py-1">مفتوح للتقديم</span>
                  <Trophy className="w-8 h-8 text-amber-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                </div>
                
                <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-2 line-clamp-2">
                  {event.name_ar}
                </h2>
                
                <p className="text-surface-600 dark:text-surface-400 text-sm mb-6 line-clamp-3">
                  {event.description}
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm text-surface-700 dark:text-surface-300">
                    <Calendar className="w-5 h-5 text-primary-500" />
                    <div>
                      <p className="text-xs text-surface-500">الموعد النهائي للتقديم</p>
                      <p className="font-medium">{formatDateTime(event.submission_deadline)}</p>
                    </div>
                  </div>
                </div>

                <Link href={`/portal/innovation/${event.id}`} className="w-full btn-gradient py-2.5 flex items-center justify-center gap-2">
                  عرض التفاصيل والتقديم <ChevronLeft className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
