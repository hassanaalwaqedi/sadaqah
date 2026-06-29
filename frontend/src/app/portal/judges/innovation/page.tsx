"use client";

import { useState, useEffect } from "react";
import { ClipboardCheck, FileText, ChevronRight, CheckCircle2, LayoutDashboard, Calendar, Search, Award, Info, FileWarning } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";
import { DocumentViewer } from "@/components/innovation/DocumentViewer";
import { EvaluationPanel } from "@/components/innovation/EvaluationPanel";
import { CommunicationPanel } from "@/components/innovation/CommunicationPanel";
import Link from "next/link";

export default function InnovationJudgingDashboard() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectDetails, setProjectDetails] = useState<any | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadAssignments();
  }, []);

  async function loadAssignments() {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/innovation/judging');
      setAssignments(res.data);
    } catch (err) {
      console.error("Failed to load assignments", err);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadProjectDetails(projectId: string) {
    setSelectedProjectId(projectId);
    setIsLoadingDetails(true);
    try {
      const res = await apiClient.get(`/innovation/applications/${projectId}`);
      setProjectDetails(res.data);
    } catch (err) {
      console.error("Failed to load project details", err);
    } finally {
      setIsLoadingDetails(false);
    }
  }

  const handleScoreSubmitted = () => {
    loadAssignments(); // Refresh assignments to update status to completed
    if (selectedProjectId) {
      loadProjectDetails(selectedProjectId); // Refresh scores
    }
  };

  const filteredAssignments = assignments.filter(a => 
    a.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.abstract?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedAssignment = assignments.find(a => a.id === selectedProjectId);

  return (
    <div className="space-y-6 animate-fade-in max-w-[1400px] mx-auto pb-20 h-[calc(100vh-100px)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-primary-600" />
            تقييم المشاريع الابتكارية
          </h1>
          <p className="text-sm text-surface-500 mt-1">
            مراجعة وتقييم المشاريع الابتكارية المخصصة لك في مسابقات الهاكاثون ومختبرات الأفكار.
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT PANEL: Assignments List */}
        <div className="lg:col-span-3 flex flex-col bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 overflow-hidden">
          <div className="p-4 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 shrink-0">
            <h3 className="font-bold mb-3 flex items-center justify-between">
              <span>المشاريع المخصصة</span>
              <span className="bg-primary-100 text-primary-700 text-xs px-2 py-1 rounded-full">{assignments.length}</span>
            </h3>
            <div className="relative">
              <Search className="w-4 h-4 absolute right-3 top-2.5 text-surface-400" />
              <input 
                type="text" 
                placeholder="بحث في المشاريع..." 
                className="input-field pl-3 pr-9 py-2 text-sm w-full"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="p-2 overflow-y-auto flex-1 space-y-2">
            {isLoading ? (
              <div className="p-8 text-center flex justify-center"><div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div></div>
            ) : filteredAssignments.length > 0 ? (
              filteredAssignments.map(assignment => (
                <button
                  key={assignment.id}
                  onClick={() => loadProjectDetails(assignment.id)}
                  className={`w-full text-right p-4 rounded-lg border transition-all ${
                    selectedProjectId === assignment.id 
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' 
                      : 'border-surface-200 dark:border-surface-700 hover:border-primary-300 dark:hover:border-primary-700'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      assignment.assignment_status === 'completed' 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {assignment.assignment_status === 'completed' ? 'تم التقييم' : 'قيد الانتظار'}
                    </span>
                    <span className="text-[10px] text-surface-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {formatDateTime(assignment.created_at).split(' ')[0]}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-surface-900 dark:text-white line-clamp-2 leading-tight mb-1">
                    {assignment.title}
                  </h4>
                  <p className="text-xs text-surface-500 line-clamp-2">
                    {assignment.abstract}
                  </p>
                </button>
              ))
            ) : (
              <div className="text-center p-8 text-surface-500 text-sm">
                لا توجد مشاريع مطابقة
              </div>
            )}
          </div>
        </div>

        {/* CENTER PANEL: Project Details & Documents */}
        <div className="lg:col-span-6 flex flex-col bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 overflow-hidden">
          {!selectedProjectId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-surface-400 p-8">
              <ClipboardCheck className="w-16 h-16 mb-4 opacity-20" />
              <p>يرجى اختيار مشروع من القائمة الجانبية للبدء بالتقييم.</p>
            </div>
          ) : isLoadingDetails ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : projectDetails ? (
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 border-b border-surface-200 dark:border-surface-700">
                <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">
                  {projectDetails.project.title}
                </h2>
                <div className="flex items-center gap-4 text-sm text-surface-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" /> تم التقديم: {formatDateTime(projectDetails.project.created_at)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Award className="w-4 h-4" /> الفئة: {projectDetails.category?.name_ar || 'غير محدد'}
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-8">
                {/* Abstract & Description */}
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2 mb-3">
                    <Info className="w-5 h-5 text-primary-600" /> الملخص والفكرة
                  </h3>
                  <div className="bg-surface-50 dark:bg-surface-800 p-4 rounded-lg text-sm leading-relaxed mb-4">
                    {projectDetails.project.abstract}
                  </div>
                  {projectDetails.project.description && (
                    <div className="prose dark:prose-invert max-w-none text-sm">
                      {projectDetails.project.description}
                    </div>
                  )}
                </div>

                {/* Extra Data / Dynamic Config Fields */}
                {projectDetails.project.extra_data && Object.keys(projectDetails.project.extra_data).length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold flex items-center gap-2 mb-3">
                      <LayoutDashboard className="w-5 h-5 text-primary-600" /> تفاصيل إضافية
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(projectDetails.project.extra_data).map(([key, value]) => {
                        if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('data:'))) return null;
                        
                        let label = key;
                        if (projectDetails.event?.configuration?.fields) {
                          const field = projectDetails.event.configuration.fields.find((f: any) => f.id === key);
                          if (field) label = field.label_ar || field.label_en || field.label || key;
                        }

                        return (
                          <div key={key} className="bg-surface-50 dark:bg-surface-800 p-3 rounded-lg">
                            <div className="text-xs text-surface-500 mb-1">{label}</div>
                            <div className="text-sm font-medium">{String(value)}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Documents & Media */}
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2 mb-3">
                    <FileText className="w-5 h-5 text-primary-600" /> المستندات والوسائط
                  </h3>
                  
                  {projectDetails.project.extra_data && Object.keys(projectDetails.project.extra_data).some(k => {
                    const val = projectDetails.project.extra_data[k];
                    return typeof val === 'string' && (val.startsWith('http') || val.startsWith('data:'));
                  }) ? (
                    <div className="grid grid-cols-1 gap-6">
                      {Object.entries(projectDetails.project.extra_data).map(([key, value]) => {
                        if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('data:'))) {
                          let label = key;
                          if (projectDetails.event?.configuration?.fields) {
                            const field = projectDetails.event.configuration.fields.find((f: any) => f.id === key);
                            if (field) label = field.label_ar || field.label_en || field.label || key;
                          }

                          return (
                            <div key={key} className="h-[400px] border border-surface-200 dark:border-surface-700 rounded-lg overflow-hidden">
                              <DocumentViewer 
                                label={label} 
                                url={value} 
                              />
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  ) : (
                    <div className="text-center p-8 bg-surface-50 dark:bg-surface-800 rounded-lg text-surface-500 flex flex-col items-center">
                      <FileWarning className="w-8 h-8 mb-2 opacity-50" />
                      <p>لا توجد مرفقات مع هذا المشروع</p>
                    </div>
                  )}
                </div>

                {/* Team Members */}
                {projectDetails.team && projectDetails.team.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold mb-3">فريق العمل</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {projectDetails.team.map((member: any) => (
                        <div key={member.user_id} className="flex items-center gap-3 p-3 border border-surface-200 dark:border-surface-700 rounded-lg">
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                            {member.user_name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <div className="text-sm font-bold">{member.user_name}</div>
                            <div className="text-xs text-surface-500 capitalize">{member.role}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* RIGHT PANEL: Evaluation & Communication */}
        <div className="lg:col-span-3 flex flex-col gap-6 overflow-y-auto">
          {selectedProjectId && projectDetails && selectedAssignment ? (
            <>
              {/* Evaluation Panel */}
              <div className="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 overflow-hidden shrink-0">
                <EvaluationPanel 
                  assignmentId={selectedAssignment.assignment_id} 
                  projectId={selectedProjectId}
                  onScoreSubmitted={handleScoreSubmitted}
                />
              </div>

              {/* Communication Panel */}
              <div className="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 overflow-hidden flex-1 flex flex-col">
                <div className="p-4 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800">
                  <h3 className="font-bold text-sm">التواصل مع الفريق</h3>
                </div>
                <div className="flex-1 overflow-hidden">
                  <CommunicationPanel 
                    projectId={selectedProjectId} 
                    messages={projectDetails.messages || []}
                    onMessageSent={() => loadProjectDetails(selectedProjectId)}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 overflow-hidden p-6 flex flex-col items-center justify-center text-surface-400 h-full">
              <CheckCircle2 className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-center text-sm">لوحة التقييم تظهر هنا بعد اختيار المشروع</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
