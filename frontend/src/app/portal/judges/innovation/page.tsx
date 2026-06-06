"use client";

import { useState } from "react";
import { ClipboardCheck, FileText, ChevronRight, CheckCircle2 } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

const MOCK_ASSIGNMENTS = [
  {
    id: "assign-001",
    project_id: "proj-001",
    title: "AI-Powered Early Disease Detection via Retinal Scans",
    abstract: "A deep learning model capable of predicting early onset of cardiovascular diseases and diabetes from standard retinal scans with 94% accuracy.",
    status: "assigned",
    assigned_at: "2024-11-12T08:00:00Z"
  },
  {
    id: "assign-002",
    project_id: "proj-002",
    title: "Solar Desalination for Rural Communities",
    abstract: "A low-cost, open-source solar desalination unit that can provide up to 50 liters of clean drinking water per day using 3D printed parts.",
    status: "completed",
    assigned_at: "2024-11-12T08:00:00Z"
  }
];

export default function InnovationJudgingDashboard() {
  const [assignments, setAssignments] = useState(MOCK_ASSIGNMENTS);
  const [selectedProject, setSelectedProject] = useState<any>(null);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Innovation Project Judging</h1>
          <p className="text-surface-600 dark:text-surface-400 mt-1">
            Review and score the hackathon and ideathon project submissions assigned to you.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-bold mb-4">Your Assignments</h2>
          {assignments.map((assignment) => (
            <div 
              key={assignment.id}
              onClick={() => setSelectedProject(assignment)}
              className={`glass-card p-5 cursor-pointer transition-all ${
                selectedProject?.id === assignment.id 
                  ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/10' 
                  : 'hover:border-surface-300 dark:hover:border-surface-600'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`badge ${assignment.status === 'completed' ? 'badge-success' : 'badge-warning'} capitalize`}>
                  {assignment.status}
                </span>
              </div>
              <h3 className="font-bold text-surface-900 dark:text-white line-clamp-2 mb-1">
                {assignment.title}
              </h3>
              <p className="text-xs text-surface-500 mb-3">Assigned: {formatDateTime(assignment.assigned_at)}</p>
              
              <div className="flex items-center text-sm font-medium text-primary-600 dark:text-primary-400">
                {assignment.status === 'completed' ? (
                  <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="w-4 h-4" /> Scored</span>
                ) : (
                  <span className="flex items-center gap-1">Score Project <ChevronRight className="w-4 h-4" /></span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Scoring Panel */}
        <div className="lg:col-span-2">
          {selectedProject ? (
            <div className="glass-card p-8 animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-xl text-primary-600">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{selectedProject.title}</h2>
                  <p className="text-surface-500 text-sm mt-1">Project ID: {selectedProject.project_id}</p>
                </div>
              </div>

              <div className="prose dark:prose-invert max-w-none mb-8">
                <h3 className="text-lg font-semibold mb-2">Abstract</h3>
                <p className="text-surface-700 dark:text-surface-300 leading-relaxed bg-surface-50 dark:bg-surface-800/50 p-4 rounded-xl border border-surface-100 dark:border-surface-700">
                  {selectedProject.abstract}
                </p>
              </div>

              {selectedProject.status === 'completed' ? (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 p-6 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-center gap-3">
                  <CheckCircle2 className="w-8 h-8" />
                  <div className="text-lg font-bold">You have already submitted the final scores for this project.</div>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <ClipboardCheck className="w-5 h-5 text-primary-500" />
                    Evaluation Rubric
                  </h3>
                  
                  <div className="space-y-6">
                    {/* Fixed Criteria as approved by user */}
                    {[
                      { name: "Originality & Innovation", desc: "How unique is the approach? Does it solve the problem in a new way?" },
                      { name: "Feasibility", desc: "Can this actually be built and deployed in the real world?" },
                      { name: "Social Impact", desc: "How deeply does this affect the target demographic?" },
                      { name: "Technical Execution", desc: "Quality of the prototype, code, and technical architecture." }
                    ].map((criteria) => (
                      <div key={criteria.name} className="p-5 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/30">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="font-bold text-base">{criteria.name}</div>
                            <div className="text-sm text-surface-500">{criteria.desc}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <input 
                              type="number" 
                              min="1" max="10" 
                              className="form-input w-20 text-center font-bold text-lg" 
                              placeholder="0"
                            />
                            <span className="text-surface-400 font-medium">/ 10</span>
                          </div>
                        </div>
                        <input type="text" className="form-input text-sm" placeholder={`Optional notes on ${criteria.name}...`} />
                      </div>
                    ))}

                    <div className="pt-6 border-t border-surface-200 dark:border-surface-700">
                      <label className="font-bold block mb-2">Overall Judge Feedback (Optional)</label>
                      <textarea className="form-input" rows={3} placeholder="Constructive feedback for the team..."></textarea>
                    </div>

                    <button className="btn-gradient w-full py-4 text-lg font-bold shadow-lg shadow-primary-500/20">
                      Submit Final Scores
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="glass-card p-12 text-center text-surface-500 flex flex-col items-center justify-center h-full min-h-[400px]">
              <ClipboardCheck className="w-16 h-16 opacity-20 mb-4" />
              <p className="text-lg">Select a project from the left to begin judging.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
