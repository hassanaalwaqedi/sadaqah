"use client";

import { useState, useRef } from "react";
import { useReports } from "@/hooks/useReports";
import { UserGroupIcon, CurrencyDollarIcon, LightBulbIcon, AcademicCapIcon, DocumentArrowDownIcon, PrinterIcon, FunnelIcon } from "@heroicons/react/24/outline";
import { BarChart, PieChart } from "@/components/reports/Charts";
// @ts-ignore
import html2pdf from "html2pdf.js";

export default function ReportsPage() {
  const { overview, scholarships, innovation, finance, users, loading, error } = useReports();
  const [activeTab, setActiveTab] = useState("overview");
  const reportRef = useRef<HTMLDivElement>(null);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || (!overview && !scholarships)) {
    return (
      <div className="bg-red-50 text-red-600 p-6 rounded-2xl flex items-center gap-4">
        <p>{error || "لا توجد بيانات متاحة لعرضها."}</p>
      </div>
    );
  }

  const handleExportPDF = () => {
    if (!reportRef.current) return;
    const element = reportRef.current;
    const opt = {
      margin: 10,
      filename: `report-${activeTab}-${new Date().getTime()}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'landscape' as const }
    };
    html2pdf().set(opt).from(element).save();
  };

  const handlePrint = () => {
    window.print();
  };

  const renderOverview = () => {
    if (!overview) return <p>لا توجد بيانات للنظرة العامة.</p>;
    
    // Sample data structure for charts based on actual API data
    const activityData = [
      { name: "المستخدمين", count: overview.total_users },
      { name: "المنح", count: overview.total_scholarships },
      { name: "المشاريع", count: innovation?.total_applications || 0 },
      { name: "التقييمات", count: overview.pending_evaluations },
    ];

    return (
      <div className="space-y-8" ref={reportRef}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="إجمالي المستخدمين" value={overview.total_users} icon={UserGroupIcon} color="bg-blue-50 text-blue-600" />
          <StatCard title="إجمالي التبرعات" value={`$${overview.total_donations.toLocaleString()}`} icon={CurrencyDollarIcon} color="bg-emerald-50 text-emerald-600" />
          <StatCard title="طلبات المنح" value={overview.total_scholarships} icon={AcademicCapIcon} color="bg-indigo-50 text-indigo-600" />
          <StatCard title="التقييمات المعلقة" value={overview.pending_evaluations} icon={LightBulbIcon} color="bg-amber-50 text-amber-600" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6 h-80">
            <h3 className="text-lg font-bold mb-4">نشاط النظام الشامل</h3>
            <BarChart data={activityData} xKey="name" yKey="count" color="#0284c7" />
          </div>
          <div className="glass-card p-6 h-80">
            <h3 className="text-lg font-bold mb-4">توزيع نشاط المنصة</h3>
            <PieChart data={activityData.filter(d => d.count > 0)} nameKey="name" dataKey="count" />
          </div>
        </div>
      </div>
    );
  };

  const renderScholarships = () => {
    if (!scholarships) return <p>لا توجد بيانات للمنح.</p>;
    const data = [
      { name: "قيد المراجعة", count: scholarships.pending },
      { name: "مقبولة", count: scholarships.approved },
      { name: "مرفوضة", count: scholarships.rejected },
    ];

    return (
      <div className="space-y-8" ref={reportRef}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="إجمالي الطلبات" value={scholarships.total_applications} icon={AcademicCapIcon} color="bg-indigo-50 text-indigo-600" />
          <StatCard title="مقبولة" value={scholarships.approved} icon={AcademicCapIcon} color="bg-emerald-50 text-emerald-600" />
          <StatCard title="مرفوضة" value={scholarships.rejected} icon={AcademicCapIcon} color="bg-rose-50 text-rose-600" />
        </div>
        <div className="glass-card p-6 h-80 w-full max-w-3xl mx-auto">
          <h3 className="text-lg font-bold mb-4">حالة طلبات المنح الدراسية</h3>
          <BarChart data={data} xKey="name" yKey="count" color="#4f46e5" />
        </div>
      </div>
    );
  };

  const renderInnovation = () => {
    if (!innovation) return <p>لا توجد بيانات للابتكار.</p>;
    const data = [
      { name: "الفعاليات", count: innovation.total_events },
      { name: "المشاريع", count: innovation.total_applications },
      { name: "تقييمات معلقة", count: innovation.pending_evaluations },
    ];

    return (
      <div className="space-y-8" ref={reportRef}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="إجمالي الفعاليات" value={innovation.total_events} icon={LightBulbIcon} color="bg-amber-50 text-amber-600" />
          <StatCard title="مشاريع مقدمة" value={innovation.total_applications} icon={LightBulbIcon} color="bg-blue-50 text-blue-600" />
          <StatCard title="تقييمات معلقة" value={innovation.pending_evaluations} icon={LightBulbIcon} color="bg-rose-50 text-rose-600" />
        </div>
        <div className="glass-card p-6 h-80 w-full max-w-3xl mx-auto">
          <h3 className="text-lg font-bold mb-4">إحصائيات الابتكار</h3>
          <PieChart data={data} nameKey="name" dataKey="count" />
        </div>
      </div>
    );
  };

  const tabs = [
    { id: "overview", label: "نظرة عامة" },
    { id: "scholarships", label: "المنح الدراسية" },
    { id: "innovation", label: "الابتكار والمشاريع" },
  ];

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-surface-900 dark:text-white">مركز التقارير والتحليلات</h1>
          <p className="text-surface-500 mt-2">تحليل بيانات النظام لدعم اتخاذ القرار</p>
        </div>
        
        <div className="flex gap-3">
          <button onClick={handlePrint} className="btn-secondary flex items-center gap-2 print:hidden">
            <PrinterIcon className="w-5 h-5" />
            <span>طباعة</span>
          </button>
          <button onClick={handleExportPDF} className="btn-primary flex items-center gap-2 print:hidden">
            <DocumentArrowDownIcon className="w-5 h-5" />
            <span>تصدير PDF</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-900 rounded-xl p-1 shadow-sm border border-surface-200 dark:border-surface-800 flex overflow-x-auto print:hidden">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                : "text-surface-600 hover:bg-surface-50 dark:text-surface-400 dark:hover:bg-surface-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === "overview" && renderOverview()}
        {activeTab === "scholarships" && renderScholarships()}
        {activeTab === "innovation" && renderInnovation()}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: any; color: string }) {
  return (
    <div className="bg-white dark:bg-surface-900 rounded-2xl p-6 shadow-sm border border-surface-200 dark:border-surface-800 flex items-center gap-4">
      <div className={`p-4 rounded-xl ${color}`}>
        <Icon className="w-8 h-8" />
      </div>
      <div>
        <p className="text-sm text-surface-500 dark:text-surface-400 font-medium">{title}</p>
        <p className="text-2xl font-bold text-surface-900 dark:text-white mt-1">{value}</p>
      </div>
    </div>
  );
}
