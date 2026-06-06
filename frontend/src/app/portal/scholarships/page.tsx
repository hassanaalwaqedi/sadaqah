"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { formatDateTime } from "@/lib/utils";

// Mock data until API is fully wired
const MOCK_CYCLES = [
  {
    id: "uuid-1",
    name: "منحة التميز الأكاديمي 2026",
    description: "منحة للطلاب المتفوقين في جميع التخصصات الأكاديمية",
    start_date: "2026-06-01T00:00:00Z",
    end_date: "2026-07-31T23:59:59Z",
    status: "active",
  },
  {
    id: "uuid-2",
    name: "منحة البحث العلمي 2026",
    description: "مخصصة لطلاب الدراسات العليا لتمويل مشاريع التخرج والأبحاث",
    start_date: "2026-06-15T00:00:00Z",
    end_date: "2026-08-15T23:59:59Z",
    status: "active",
  },
];

export default function ScholarshipsPage() {
  const [cycles, setCycles] = useState(MOCK_CYCLES);

  // In reality we would fetch this via apiClient
  // useEffect(() => { ... }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
          المنح الدراسية المتاحة
        </h1>
        <p className="text-sm text-surface-500 mt-1">
          تصفح برامج المنح الدراسية المفتوحة حالياً وقم بالتقديم عليها
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {cycles.map((cycle) => (
          <div key={cycle.id} className="glass-card flex flex-col h-full">
            <div className="p-6 flex-1">
              <div className="flex justify-between items-start mb-4">
                <span className="badge badge-success">متاح للتقديم</span>
                <span className="text-xs text-surface-400 font-medium font-sans">
                  # {cycle.id.split("-")[1]}
                </span>
              </div>
              <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100 mb-2">
                {cycle.name}
              </h3>
              <p className="text-surface-600 dark:text-surface-400 text-sm leading-relaxed mb-6">
                {cycle.description}
              </p>

              <div className="space-y-2 text-sm text-surface-500">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                  <span>
                    <strong>يبدأ:</strong> <span dir="ltr">{formatDateTime(cycle.start_date)}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>
                    <strong>ينتهي:</strong> <span dir="ltr">{formatDateTime(cycle.end_date)}</span>
                  </span>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50 rounded-b-2xl">
              <Link 
                href={`/scholarships/${cycle.id}/apply`}
                className="btn-primary w-full text-center block"
              >
                التقديم الآن
              </Link>
            </div>
          </div>
        ))}

        {cycles.length === 0 && (
          <div className="col-span-full py-12 text-center text-surface-500 glass-card">
            لا توجد منح دراسية متاحة في الوقت الحالي
          </div>
        )}
      </div>
    </div>
  );
}
