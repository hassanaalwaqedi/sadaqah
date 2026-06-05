"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";

// Mock data until API is fully wired
const MOCK_OCR_DATA = {
  gpa: 3.85,
  university: "جامعة العلوم والتكنولوجيا",
  confidence: 0.88,
  document_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" // Placeholder PDF
};

const MOCK_RUBRIC = [
  { id: "c1", name: "التميز الأكاديمي", max_score: 40, description: "يتم تقييمه بناءً على المعدل التراكمي وصعوبة التخصص." },
  { id: "c2", name: "الوضع المادي للأسرة", max_score: 30, description: "تقييم الحاجة المادية بناءً على دخل الأسرة وعدد أفرادها." },
  { id: "c3", name: "الأنشطة اللامنهجية", max_score: 15, description: "المشاركة في المبادرات التطوعية والأندية الطلابية." },
  { id: "c4", name: "المقابلة الشخصية / المقال", max_score: 15, description: "وضوح الرؤية المستقبلية ومهارات التواصل." },
];

export default function EvaluationScoringPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [scores, setScores] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [overallComments, setOverallComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalScore = Object.values(scores).reduce((sum, s) => sum + (s || 0), 0);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        scores: MOCK_RUBRIC.map(c => ({
          criteria_id: c.id, // In a real app, this is a UUID
          score: scores[c.id] || 0,
          notes: notes[c.id] || ""
        })),
        comments: overallComments
      };

      await apiClient.post(`/evaluations/${params.id}/score`, payload);
      alert("تم حفظ التقييم بنجاح!");
      router.push("/judges");
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء حفظ التقييم");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6 animate-fade-in">
      
      {/* Left side: Document View & AI Extraction */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        <div className="glass-card p-4 flex-shrink-0 border-r-4 border-primary-500">
          <h2 className="text-sm font-bold text-primary-700 dark:text-primary-400 mb-2">استخراج الذكاء الاصطناعي (AI OCR)</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="block text-surface-500 text-xs">المعدل التراكمي (GPA)</span>
              <span className="font-bold font-mono text-lg">{MOCK_OCR_DATA.gpa} / 4.00</span>
            </div>
            <div>
              <span className="block text-surface-500 text-xs">الجامعة</span>
              <span className="font-medium">{MOCK_OCR_DATA.university}</span>
            </div>
            <div>
              <span className="block text-surface-500 text-xs">مستوى الثقة</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-2 bg-surface-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${MOCK_OCR_DATA.confidence > 0.8 ? 'bg-green-500' : 'bg-yellow-500'}`} 
                    style={{ width: `${MOCK_OCR_DATA.confidence * 100}%` }}
                  ></div>
                </div>
                <span className="text-xs font-mono">{Math.round(MOCK_OCR_DATA.confidence * 100)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* PDF Viewer Container */}
        <div className="flex-1 glass-card overflow-hidden relative rounded-2xl">
          <iframe 
            src={MOCK_OCR_DATA.document_url} 
            className="w-full h-full border-0"
            title="Document Viewer"
          />
        </div>
      </div>

      {/* Right side: Scoring Rubric */}
      <div className="w-full lg:w-[450px] flex-shrink-0 glass-card flex flex-col overflow-hidden">
        <div className="p-6 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
          <h2 className="text-xl font-bold">نموذج التقييم</h2>
          <p className="text-sm text-surface-500 mt-1">الرجاء إدخال الدرجات بدقة بناءً على المعايير.</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {MOCK_RUBRIC.map(criteria => (
            <div key={criteria.id} className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-surface-900 dark:text-surface-100">{criteria.name}</h3>
                  <p className="text-xs text-surface-500 mt-1 leading-relaxed">{criteria.description}</p>
                </div>
                <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded">
                  / {criteria.max_score}
                </span>
              </div>
              
              <div className="flex gap-4">
                <input 
                  type="number" 
                  min="0" 
                  max={criteria.max_score} 
                  step="0.5"
                  placeholder="الدرجة"
                  value={scores[criteria.id] || ""}
                  onChange={e => setScores({...scores, [criteria.id]: parseFloat(e.target.value)})}
                  className="form-input w-24 text-center font-mono font-bold"
                />
                <input 
                  type="text" 
                  placeholder="ملاحظات (اختياري)..."
                  value={notes[criteria.id] || ""}
                  onChange={e => setNotes({...notes, [criteria.id]: e.target.value})}
                  className="form-input flex-1 text-sm"
                />
              </div>
            </div>
          ))}

          <div className="pt-6 border-t border-surface-200 dark:border-surface-700 space-y-3">
            <h3 className="font-bold">ملاحظات عامة على الطلب</h3>
            <textarea 
              rows={3}
              value={overallComments}
              onChange={e => setOverallComments(e.target.value)}
              className="form-input text-sm"
              placeholder="اكتب انطباعك العام عن المتقدم..."
            ></textarea>
          </div>
        </div>

        <div className="p-6 border-t border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
          <div className="flex justify-between items-center mb-4">
            <span className="font-bold">المجموع النهائي:</span>
            <span className={`text-2xl font-black font-mono ${totalScore >= 60 ? 'text-green-500' : 'text-primary-500'}`}>
              {totalScore} <span className="text-sm text-surface-400">/ 100</span>
            </span>
          </div>
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="btn-gradient w-full py-3 disabled:opacity-50"
          >
            {isSubmitting ? "جاري الحفظ..." : "اعتماد النتيجة النهائية"}
          </button>
        </div>
      </div>
      
    </div>
  );
}
