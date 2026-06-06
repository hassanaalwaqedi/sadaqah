"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";

// Mock data until API is wired
const MOCK_RANKINGS = [
  { rank: 1, application_id: "app-1050", student_name: "محمد أحمد عبدالله", university: "جامعة العلوم والتكنولوجيا", gpa: 3.85, total_score: 92.5, status: "accepted" },
  { rank: 2, application_id: "app-2041", student_name: "فاطمة علي سعيد", university: "الجامعة الأردنية", gpa: 3.90, total_score: 89.0, status: "accepted" },
  { rank: 3, application_id: "app-3092", student_name: "عمر خالد صالح", university: "جامعة اليرموك", gpa: 3.65, total_score: 85.5, status: "waitlist" },
  { rank: 4, application_id: "app-4011", student_name: "سارة محمد حسن", university: "جامعة البترا", gpa: 3.40, total_score: 78.0, status: "rejected" },
];

import { use } from "react";

export default function ScholarshipRankingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rankings, setRankings] = useState(MOCK_RANKINGS);
  const [lastRun, setLastRun] = useState("2026-06-04T18:00:00Z");

  const runRankingEngine = async () => {
    setIsProcessing(true);
    try {
      // Trigger the AI Worker via the Go API
      // await apiClient.post(`/scholarships/cycles/${params.id}/rank`);
      
      // Simulate delay for AI processing
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      setLastRun(new Date().toISOString());
      alert("تم الانتهاء من خوارزمية الفرز والترتيب بنجاح!");
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء تشغيل الخوارزمية");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
              نتائج الفرز والترتيب
            </h1>
            <span className="badge badge-primary">AI Engine</span>
          </div>
          <p className="text-sm text-surface-500">
            مراجعة الترتيب النهائي للمتقدمين بناءً على خوارزميات الذكاء الاصطناعي والأوزان المحددة.
          </p>
        </div>
        
        <button 
          onClick={runRankingEngine} 
          disabled={isProcessing}
          className="btn-gradient flex items-center gap-2 disabled:opacity-50"
        >
          {isProcessing ? (
             <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
             </svg>
          ) : (
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
             </svg>
          )}
          {isProcessing ? "جاري المعالجة..." : "إعادة تشغيل الفرز الذكي"}
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-4 bg-primary-50 dark:bg-primary-900/20 border-b border-primary-100 dark:border-primary-800 text-sm flex justify-between items-center text-primary-800 dark:text-primary-200">
          <span>يتم حساب النتيجة النهائية بناءً على: (المعدل التراكمي 40٪، تقييم اللجان 60٪).</span>
          <span className="text-xs">آخر تحديث: <span dir="ltr">{new Date(lastRun).toLocaleString('ar-EG')}</span></span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-sm">
            <thead className="bg-surface-50 dark:bg-surface-800/50 text-surface-500 border-b border-surface-200 dark:border-surface-700">
              <tr>
                <th className="px-6 py-4 font-medium w-16 text-center">الترتيب</th>
                <th className="px-6 py-4 font-medium">اسم الطالب</th>
                <th className="px-6 py-4 font-medium">الجامعة</th>
                <th className="px-6 py-4 font-medium text-center">المعدل (GPA)</th>
                <th className="px-6 py-4 font-medium text-center">المجموع النهائي</th>
                <th className="px-6 py-4 font-medium text-center">القرار المقترح</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
              {rankings.map((r) => (
                <tr key={r.application_id} className="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                      r.rank <= 2 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400'
                    }`}>
                      {r.rank}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-surface-900 dark:text-surface-100">
                    {r.student_name}
                    <div className="text-xs text-surface-400 mt-1 font-mono">{r.application_id}</div>
                  </td>
                  <td className="px-6 py-4 text-surface-600 dark:text-surface-400">
                    {r.university}
                  </td>
                  <td className="px-6 py-4 text-center font-mono font-medium">
                    {r.gpa}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-bold text-lg text-primary-600 dark:text-primary-400">{r.total_score}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`badge ${
                      r.status === 'accepted' ? 'badge-success' : 
                      r.status === 'waitlist' ? 'badge-primary' : 'badge-danger'
                    }`}>
                      {r.status === 'accepted' ? 'مقبول' : 
                       r.status === 'waitlist' ? 'قائمة انتظار' : 'مرفوض'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="flex justify-end pt-4">
        <button className="btn-primary">
          اعتماد النتائج وإرسال الإشعارات
        </button>
      </div>
    </div>
  );
}
