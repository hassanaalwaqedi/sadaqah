import { useState } from "react";
import { CheckCircle2, AlertCircle, TrendingUp, Presentation, Users, Lightbulb, Beaker } from "lucide-react";
import { apiClient } from "@/lib/api-client";

type Criterion = {
  id: string;
  name: string;
  icon: any;
  maxScore: number;
  description: string;
};

const defaultCriteria: Criterion[] = [
  { id: 'innovation', name: 'الابتكار والجدة', icon: Lightbulb, maxScore: 25, description: 'مدى أصالة الفكرة وابتكارها مقارنة بالحلول الحالية' },
  { id: 'feasibility', name: 'الجدوى الفنية', icon: Beaker, maxScore: 25, description: 'إمكانية التنفيذ الفني والتقني للمشروع' },
  { id: 'impact', name: 'الأثر المجتمعي والاقتصادي', icon: TrendingUp, maxScore: 20, description: 'حجم الأثر المتوقع والفائدة على المجتمع' },
  { id: 'team', name: 'كفاءة الفريق', icon: Users, maxScore: 15, description: 'خبرات الفريق وتنوعها وملاءمتها للمشروع' },
  { id: 'presentation', name: 'العرض والتسويق', icon: Presentation, maxScore: 15, description: 'وضوح العرض وجودة العرض التقديمي' },
];

type EvaluationPanelProps = {
  assignmentId?: string;
  projectId: string;
  existingScores?: any[];
  onScoreSubmitted?: () => void;
  readOnly?: boolean;
};

export function EvaluationPanel({ assignmentId, projectId, existingScores = [], onScoreSubmitted, readOnly = false }: EvaluationPanelProps) {
  const [scores, setScores] = useState<Record<string, { score: number, notes: string }>>(() => {
    const initial: Record<string, any> = {};
    existingScores.forEach(s => {
      initial[s.criteria_name] = { score: s.score, notes: s.notes || '' };
    });
    return initial;
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const totalScore = defaultCriteria.reduce((sum, c) => sum + (scores[c.id]?.score || 0), 0);
  const maxPossibleScore = defaultCriteria.reduce((sum, c) => sum + c.maxScore, 0);

  const handleScoreChange = (criteriaId: string, value: string) => {
    const num = Math.max(0, Math.min(Number(value) || 0, defaultCriteria.find(c => c.id === criteriaId)?.maxScore || 0));
    setScores(prev => ({
      ...prev,
      [criteriaId]: { ...prev[criteriaId], score: num }
    }));
  };

  const handleNotesChange = (criteriaId: string, value: string) => {
    setScores(prev => ({
      ...prev,
      [criteriaId]: { ...prev[criteriaId], notes: value }
    }));
  };

  const handleSubmit = async () => {
    if (!assignmentId) {
      setError("لا يوجد تعيين للتحكيم. يرجى إسناد الطلب لمحكم أولاً.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess(false);

    try {
      const payload = defaultCriteria.map(c => ({
        criteria_name: c.id,
        score: scores[c.id]?.score || 0,
        max_score: c.maxScore,
        notes: scores[c.id]?.notes || ""
      }));

      await apiClient.post(`/innovation/judging/${assignmentId}/score`, payload);
      setSuccess(true);
      if (onScoreSubmitted) onScoreSubmitted();
    } catch (err: any) {
      setError(err.response?.data?.message || "حدث خطأ أثناء حفظ التقييم");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 overflow-hidden">
      <div className="p-4 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 flex justify-between items-center">
        <h3 className="font-bold text-surface-900 dark:text-white">لجنة التقييم</h3>
        <div className="bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-4 py-1.5 rounded-full font-bold text-sm">
          {totalScore} / {maxPossibleScore}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 text-green-600 rounded-lg text-sm flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>تم حفظ التقييم بنجاح</span>
          </div>
        )}

        <div className="space-y-6">
          {defaultCriteria.map(criteria => {
            const Icon = criteria.icon;
            const currentScore = scores[criteria.id]?.score || 0;
            const currentNotes = scores[criteria.id]?.notes || '';
            const pct = (currentScore / criteria.maxScore) * 100;

            return (
              <div key={criteria.id} className="border border-surface-100 dark:border-surface-800 rounded-xl p-4 transition-colors hover:border-primary-100 dark:hover:border-primary-900/30">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-surface-50 dark:bg-surface-800 rounded-lg text-surface-500">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-surface-900 dark:text-white text-sm">{criteria.name}</h4>
                      <p className="text-xs text-surface-500 mt-0.5">{criteria.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max={criteria.maxScore}
                      value={currentScore || ''}
                      onChange={(e) => handleScoreChange(criteria.id, e.target.value)}
                      disabled={readOnly || isSubmitting}
                      className="w-16 px-2 py-1 text-center text-sm font-bold input-field"
                    />
                    <span className="text-surface-400 text-sm">/ {criteria.maxScore}</span>
                  </div>
                </div>

                <div className="w-full bg-surface-100 dark:bg-surface-800 h-1.5 rounded-full mb-3 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-primary-500' : 'bg-orange-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div>
                  <textarea
                    placeholder="ملاحظات المحكم (اختياري)..."
                    value={currentNotes}
                    onChange={(e) => handleNotesChange(criteria.id, e.target.value)}
                    disabled={readOnly || isSubmitting}
                    className="w-full text-sm input-field h-16 resize-none"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {!readOnly && (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="btn-gradient w-full py-2.5 flex justify-center items-center gap-2"
          >
            {isSubmitting ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                اعتماد التقييم
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
