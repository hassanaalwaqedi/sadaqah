"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";
import { 
  ChevronRight, FileText, User, MessageSquare, Clock, AlertCircle, 
  MapPin, BookOpen, GraduationCap, Calendar, CheckCircle2, FileWarning, HelpCircle
} from "lucide-react";
import { DocumentViewer } from "@/components/innovation/DocumentViewer";
import { EvaluationPanel } from "@/components/innovation/EvaluationPanel";
import { CommunicationPanel } from "@/components/innovation/CommunicationPanel";

type ProjectSubmission = {
  id: string;
  category_id: string;
  submitter_id: string;
  title: string;
  abstract: string;
  description: string;
  status: string;
  created_at: string;
  extra_data: Record<string, any>;
};

type InnovationEvent = {
  id: string;
  name_ar: string;
  configuration?: any;
};

type UserProfile = {
  id: string;
  email: string;
  first_name_ar?: string;
  last_name_ar?: string;
  first_name_en: string;
  last_name_en: string;
  profile?: {
    university?: string;
    major?: string;
    country?: string;
  }
};

type ProjectTimeline = {
  id: string;
  status_from: string | null;
  status_to: string;
  title: string;
  description: string;
  created_at: string;
};

type ProjectMessage = {
  id: string;
  sender_id: string;
  message: string;
  is_internal: boolean;
  created_at: string;
};

type JudgingAssignment = {
  id: string;
  judge_id: string;
  status: string;
};

type JudgingScore = {
  id: string;
  criteria_name: string;
  score: number;
  max_score: number;
  notes: string;
};

type ApplicationDetails = {
  submission: ProjectSubmission;
  event: InnovationEvent;
  submitter: UserProfile;
  timeline: ProjectTimeline[];
  messages: ProjectMessage[];
  assignments: JudgingAssignment[];
  scores: JudgingScore[];
};

export default function AdminApplicationDetails() {
  const params = useParams();
  const router = useRouter();
  const appId = params.appId as string;
  
  const [details, setDetails] = useState<ApplicationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Status update
  const [newStatus, setNewStatus] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState('');

  const statusOptions = [
    { value: 'submitted', label: 'مقدم' },
    { value: 'under_review', label: 'قيد المراجعة الفنية' },
    { value: 'clarification_requested', label: 'مطلوب توضيح' },
    { value: 'under_judging', label: 'قيد التحكيم' },
    { value: 'accepted', label: 'مقبول' },
    { value: 'conditionally_accepted', label: 'مقبول مشروط' },
    { value: 'rejected', label: 'مرفوض' }
  ];

  useEffect(() => {
    loadData();
  }, [appId]);

  async function loadData() {
    setIsLoading(true);
    try {
      const res = await apiClient.get<ApplicationDetails>(`/innovation/applications/${appId}`);
      setDetails(res.data);
      setNewStatus(res.data.submission.status);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUpdateStatus(e: React.FormEvent) {
    e.preventDefault();
    if (newStatus === details?.submission.status) return;
    
    setIsUpdatingStatus(true);
    setStatusError('');
    try {
      await apiClient.patch(`/innovation/applications/${appId}/status`, {
        status: newStatus,
        message: statusMessage,
        is_internal: false
      });
      setStatusMessage('');
      await loadData();
    } catch (err: any) {
      setStatusError(err.response?.data?.message || 'حدث خطأ أثناء تحديث الحالة');
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  if (isLoading) return <div className="p-8 text-center flex justify-center"><div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!details) return <div className="p-8 text-center text-red-600">لم يتم العثور على الطلب</div>;

  const currentAssignment = details.assignments?.[0];
  const submitterName = `${details.submitter?.first_name_ar || details.submitter?.first_name_en || ''} ${details.submitter?.last_name_ar || details.submitter?.last_name_en || ''}`;

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-20">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-surface-500 mb-4">
        <Link href="/portal/admin/innovation" className="hover:text-primary-600">
          مسابقات الابتكار
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link href={`/portal/admin/innovation/${details.event.id}`} className="hover:text-primary-600">
          {details.event.name_ar}
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-surface-900 dark:text-surface-100">مساحة عمل التحكيم</span>
      </div>

      {/* Top Summary Bar */}
      <div className="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm font-mono text-surface-500 bg-surface-100 dark:bg-surface-800 px-2 py-1 rounded">#{details.submission.id.split('-')[0].toUpperCase()}</span>
            <span className={`badge ${
              ['accepted', 'winner'].includes(details.submission.status) ? 'badge-success' : 
              ['rejected'].includes(details.submission.status) ? 'badge-error' :
              ['clarification_requested'].includes(details.submission.status) ? 'badge-warning' : 'badge-primary'
            } capitalize`}>
              {statusOptions.find(o => o.value === details.submission.status)?.label || details.submission.status}
            </span>
            {details.submission.extra_data && !details.submission.extra_data.attachments && (
               <span className="badge badge-error flex items-center gap-1"><FileWarning className="w-3 h-3" /> نواقص</span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
            {details.submission.title}
          </h1>
        </div>
        <div className="flex gap-4 text-sm text-surface-600 dark:text-surface-400">
          <div className="text-center px-4 border-l border-surface-200 dark:border-surface-700">
            <div className="font-bold text-lg text-surface-900 dark:text-white">{details.assignments?.length > 0 ? 'معين' : 'بانتظار التعيين'}</div>
            <div className="text-xs">المحكم</div>
          </div>
          <div className="text-center px-4 border-l border-surface-200 dark:border-surface-700">
            <div className="font-bold text-lg text-surface-900 dark:text-white">{details.scores?.reduce((a,b)=>a+b.score, 0) || 0}</div>
            <div className="text-xs">النتيجة الحالية</div>
          </div>
          <div className="text-center px-4">
            <div className="font-bold text-lg text-surface-900 dark:text-white">{details.messages?.filter(m=>!m.is_internal).length || 0}</div>
            <div className="text-xs">تواصل</div>
          </div>
        </div>
      </div>

      {/* 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Panel: Profile & Timeline */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 overflow-hidden">
            <div className="p-4 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800">
              <h3 className="font-bold flex items-center gap-2"><User className="w-4 h-4 text-primary-600" /> بيانات المتقدم</h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <div className="text-xs text-surface-500 mb-1">الاسم بالكامل</div>
                <div className="font-medium">{submitterName}</div>
              </div>
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-surface-400" />
                <span className="text-sm">{details.submitter?.profile?.university || 'غير محدد'}</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-surface-400" />
                <span className="text-sm">{details.submitter?.profile?.major || 'غير محدد'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-surface-400" />
                <span className="text-sm">{details.submitter?.profile?.country || 'غير محدد'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 overflow-hidden">
            <div className="p-4 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800">
              <h3 className="font-bold flex items-center gap-2"><Calendar className="w-4 h-4 text-primary-600" /> السجل الزمني</h3>
            </div>
            <div className="p-4">
              <div className="space-y-4 relative before:absolute before:inset-0 before:mr-2 before:w-0.5 before:bg-surface-200 dark:before:bg-surface-700">
                {details.timeline.map((item, index) => (
                  <div key={item.id} className="relative pl-6 pr-6">
                    <div className="absolute right-0 top-1.5 w-4 h-4 rounded-full bg-surface-100 border-2 border-primary-500 z-10"></div>
                    <div className="text-sm font-medium">{item.title}</div>
                    <div className="text-xs text-surface-500 mt-1">{formatDateTime(item.created_at)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Middle Panel: Application Details & Documents */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 overflow-hidden">
             <div className="p-5 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-primary-700 dark:text-primary-400 mb-2 border-b border-surface-100 pb-2">الملخص التنفيذي</h3>
                  <p className="text-surface-700 dark:text-surface-300 leading-relaxed whitespace-pre-wrap text-sm">
                    {details.submission.abstract}
                  </p>
                </div>
                
                {details.submission.description && (
                  <div>
                    <h3 className="text-lg font-bold text-primary-700 dark:text-primary-400 mb-2 border-b border-surface-100 pb-2">وصف المشروع والتفاصيل الفنية</h3>
                    <p className="text-surface-700 dark:text-surface-300 leading-relaxed whitespace-pre-wrap text-sm">
                      {details.submission.description}
                    </p>
                  </div>
                )}
             </div>
          </div>

          <div className="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 overflow-hidden">
            <div className="p-4 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800">
              <h3 className="font-bold flex items-center gap-2"><FileText className="w-4 h-4 text-primary-600" /> المستندات والمرفقات</h3>
            </div>
            <div className="p-4">
               {details.submission.extra_data && Object.keys(details.submission.extra_data).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(details.submission.extra_data).map(([key, value]) => {
                      if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('data:'))) {
                        return (
                          <div key={key} className="h-64">
                            <DocumentViewer 
                              label={key} 
                              url={value} 
                              onMarkMissing={() => setNewStatus('clarification_requested')}
                            />
                          </div>
                        );
                      }
                      return null;
                    })}
                    {Object.entries(details.submission.extra_data).map(([key, value]) => {
                      if (!(typeof value === 'string' && (value.startsWith('http') || value.startsWith('data:')))) {
                         let label = key;
                         if (details.event?.configuration?.fields) {
                           const field = details.event.configuration.fields.find((f: any) => f.id === key);
                           if (field) label = field.label_ar || field.label_en || field.label || key;
                         }
                         return (
                           <div key={key} className="col-span-full border border-surface-100 p-3 rounded-lg">
                             <div className="text-xs text-surface-500 mb-1">{label}</div>
                             <div className="text-sm font-medium">{String(value)}</div>
                           </div>
                         );
                      }
                      return null;
                    })}
                  </div>
               ) : (
                 <div className="text-center py-8 text-surface-500">لا توجد مستندات مرفقة</div>
               )}
            </div>
          </div>
        </div>

        {/* Right Panel: Action & Evaluation */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Status Update */}
          <div className="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 overflow-hidden">
            <div className="p-4 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800">
              <h3 className="font-bold">تحديث الحالة والقرار</h3>
            </div>
            <div className="p-4">
              <form onSubmit={handleUpdateStatus} className="space-y-4">
                {statusError && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{statusError}</span>
                  </div>
                )}
                
                <div>
                  <label className="block text-xs font-medium text-surface-700 mb-1">الحالة الجديدة</label>
                  <select 
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="input-field text-sm"
                  >
                    {statusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                
                {(newStatus === 'rejected' || newStatus === 'clarification_requested' || newStatus !== details.submission.status) && (
                  <div>
                    <label className="block text-xs font-medium text-surface-700 mb-1">
                      رسالة الإشعار 
                      {['rejected', 'clarification_requested'].includes(newStatus) ? ' (مطلوب)' : ' (اختياري)'}
                    </label>
                    <textarea
                      value={statusMessage}
                      onChange={(e) => setStatusMessage(e.target.value)}
                      required={['rejected', 'clarification_requested'].includes(newStatus)}
                      className="input-field h-20 text-sm"
                      placeholder="رسالة توضيحية للمتقدم..."
                    />
                  </div>
                )}
                
                <button 
                  type="submit" 
                  disabled={isUpdatingStatus || newStatus === details.submission.status}
                  className="btn-gradient w-full py-2 disabled:opacity-50 text-sm"
                >
                  {isUpdatingStatus ? 'جاري التحديث...' : 'تأكيد التحديث'}
                </button>
              </form>
            </div>
          </div>

          {/* Evaluation Panel */}
          <EvaluationPanel 
            assignmentId={currentAssignment?.id}
            projectId={details.submission.id}
            existingScores={details.scores}
            onScoreSubmitted={loadData}
          />

          {/* Communication Panel */}
          <CommunicationPanel 
            projectId={details.submission.id}
            messages={details.messages}
            onMessageSent={loadData}
          />
          
        </div>
      </div>
    </div>
  );
}
