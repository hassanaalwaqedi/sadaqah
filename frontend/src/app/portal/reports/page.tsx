"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Users, DollarSign, HandHeart, GraduationCap, Home, FileText, AlertCircle } from "lucide-react";

interface SystemReport {
  total_users: number;
  total_donations: number;
  active_campaigns: number;
  total_scholarships: number;
  housing_occupancy: number;
  pending_evaluations: number;
}

export default function ReportsPage() {
  const [report, setReport] = useState<SystemReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await apiClient.get("/admin/reports");
        setReport(res.data);
      } catch (err) {
        setError("فشل في تحميل التقارير النظامية");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3">
        <AlertCircle className="w-5 h-5" />
        <p>{error}</p>
      </div>
    );
  }

  const statCards = [
    {
      title: "إجمالي المستخدمين",
      value: report?.total_users || 0,
      icon: Users,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "إجمالي التبرعات",
      value: `$${report?.total_donations.toLocaleString() || 0}`,
      icon: DollarSign,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "المشاريع النشطة",
      value: report?.active_campaigns || 0,
      icon: HandHeart,
      color: "bg-rose-50 text-rose-600",
    },
    {
      title: "طلبات المنح الدراسية",
      value: report?.total_scholarships || 0,
      icon: GraduationCap,
      color: "bg-indigo-50 text-indigo-600",
    },
    {
      title: "إشغال السكن الطلابي",
      value: report?.housing_occupancy || 0,
      icon: Home,
      color: "bg-amber-50 text-amber-600",
    },
    {
      title: "التقييمات المعلقة",
      value: report?.pending_evaluations || 0,
      icon: FileText,
      color: "bg-purple-50 text-purple-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">التقارير والإحصائيات</h1>
        <p className="text-surface-500 mt-1">نظرة عامة على أداء المنصة والنشاطات الرئيسية</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white dark:bg-surface-900 rounded-2xl p-6 shadow-sm border border-surface-200 dark:border-surface-800 flex items-center gap-4 transition-transform hover:-translate-y-1">
              <div className={`p-4 rounded-xl ${stat.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-surface-500 dark:text-surface-400 font-medium">{stat.title}</p>
                <p className="text-2xl font-bold text-surface-900 dark:text-white mt-1">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Optional: Add chart placeholders below */}
      <div className="mt-8 bg-white dark:bg-surface-900 rounded-2xl p-6 shadow-sm border border-surface-200 dark:border-surface-800">
        <h2 className="text-lg font-bold text-surface-900 dark:text-white mb-4">نشاط المنصة الأخير</h2>
        <div className="h-64 flex items-center justify-center bg-surface-50 dark:bg-surface-800 rounded-xl border border-dashed border-surface-300 dark:border-surface-700">
          <p className="text-surface-500">سيتم إضافة المخططات البيانية قريباً</p>
        </div>
      </div>
    </div>
  );
}
