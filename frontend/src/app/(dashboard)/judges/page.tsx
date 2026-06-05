"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { formatDateTime } from "@/lib/utils";

interface Evaluation {
  id: string;
  application_id: string;
  status: "assigned" | "in_progress" | "completed";
  total_score?: number;
  evaluated_at?: string;
  assigned_at: string;
}

export default function JudgesDashboardPage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        const res = await apiClient.get("/evaluations/me");
        setEvaluations(res.data.data || []);
      } catch (error) {
        console.error("Failed to fetch evaluations", error);
        // Mock data for display purposes
        setEvaluations([
          {
            id: "uuid-eval-1",
            application_id: "uuid-app-101",
            status: "assigned",
            assigned_at: "2026-06-01T10:00:00Z"
          },
          {
            id: "uuid-eval-2",
            application_id: "uuid-app-102",
            status: "completed",
            total_score: 85.5,
            evaluated_at: "2026-06-03T14:30:00Z",
            assigned_at: "2026-06-01T10:00:00Z"
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvaluations();
  }, []);

  const pending = evaluations.filter(e => e.status !== "completed");
  const completed = evaluations.filter(e => e.status === "completed");

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
          بوابة التقييم
        </h1>
        <p className="text-sm text-surface-500 mt-1">
          مرحباً بك. راجع طلبات المنح المخصصة لك وقم بتقييمها بناءً على المعايير المعتمدة.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pending Evaluations */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-primary-500 animate-pulse"></span>
              بانتظار التقييم
            </h2>
            <span className="badge badge-primary">{pending.length}</span>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <p className="text-surface-500 text-sm">جاري التحميل...</p>
            ) : pending.length === 0 ? (
              <p className="text-surface-500 text-sm">لا توجد طلبات بانتظار التقييم حالياً.</p>
            ) : (
              pending.map(e => (
                <div key={e.id} className="p-4 border border-surface-200 dark:border-surface-700 rounded-xl hover:border-primary-300 dark:hover:border-primary-700 transition-colors bg-surface-50 dark:bg-surface-800/50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-xs text-surface-400">رقم الطلب</span>
                      <p className="font-mono text-sm font-medium">{e.application_id.split("-")[0]}</p>
                    </div>
                    <span className="text-xs text-surface-500">
                      مُسند منذ: <span dir="ltr">{formatDateTime(e.assigned_at)}</span>
                    </span>
                  </div>
                  <Link href={`/judges/evaluations/${e.id}`} className="btn-primary w-full text-center mt-4 text-sm py-2">
                    بدء التقييم
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Completed Evaluations */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              التقييمات المنجزة
            </h2>
            <span className="badge badge-success">{completed.length}</span>
          </div>

          <div className="space-y-4">
             {isLoading ? (
              <p className="text-surface-500 text-sm">جاري التحميل...</p>
            ) : completed.length === 0 ? (
              <p className="text-surface-500 text-sm">لم تقم بإنجاز أي تقييمات بعد.</p>
            ) : (
              completed.map(e => (
                <div key={e.id} className="p-4 border border-surface-200 dark:border-surface-700 rounded-xl bg-surface-50 dark:bg-surface-800/50">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <span className="text-xs text-surface-400">رقم الطلب</span>
                      <p className="font-mono text-sm font-medium">{e.application_id.split("-")[0]}</p>
                    </div>
                    <div className="text-end">
                      <span className="text-xs text-surface-400">النتيجة</span>
                      <p className="font-bold text-green-600 dark:text-green-400">{e.total_score} / 100</p>
                    </div>
                  </div>
                  <div className="text-xs text-surface-500 mt-2">
                    تم التقييم: <span dir="ltr">{formatDateTime(e.evaluated_at!)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
