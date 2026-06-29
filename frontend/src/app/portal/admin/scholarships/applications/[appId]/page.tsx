"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";
import { 
  ChevronRight, FileText, User, MessageSquare, Clock, AlertCircle, 
  MapPin, BookOpen, GraduationCap, Calendar, CheckCircle2, FileWarning, Briefcase, Hash, DollarSign, Users, Info
} from "lucide-react";
import { DocumentViewer } from "@/components/innovation/DocumentViewer";
import { ScholarshipEvaluationPanel } from "@/components/scholarships/ScholarshipEvaluationPanel";
import { CommunicationPanel } from "@/components/innovation/CommunicationPanel";

type ScholarshipSubmission = {
  id: string;
  cycle_id: string;
  applicant_id: string;
  status: string;
  created_at: string;
  extra_data: Record<string, any>;
  assigned_to?: string | null;
  reviewer_id?: string | null;
  department?: string | null;
  committee?: string | null;
  priority?: string;
  sla_deadline?: string | null;
  family_income?: number;
  family_size?: number;
};

type ScholarshipCycle = {
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
    gpa?: string;
    phone?: string;
  }
};

type ScholarshipTimeline = {
  id: string;
  status_from: string | null;
  status_to: string;
  title: string;
  description: string;
  created_at: string;
};

type ScholarshipMessage = {
  id: string;
  sender_id: string;
  message: string;
  is_internal: boolean;
  created_at: string;
};

type ScholarshipEvaluation = {
  id: string;
  judge_id: string;
  status: string;
  total_score?: number;
  scores?: any[];
};

type ApplicationDetails = {
  application: ScholarshipSubmission;
  cycle: ScholarshipCycle;
  submitter: UserProfile;
  timeline: ScholarshipTimeline[];
  messages: ScholarshipMessage[];
  evaluations: ScholarshipEvaluation[];
};

export default function AdminScholarshipApplicationDetails() {
  const params = useParams();
  const router = useRouter();
  const appId = params.appId as string;
  
  const [details, setDetails] = useState<ApplicationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [staff, setStaff] = useState<any[]>([]);
  
  // Status update
  const [newStatus, setNewStatus] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState('');

  // Assignment
  const [assignedTo, setAssignedTo] = useState('');
  const [reviewerId, setReviewerId] = useState('');
  const [department, setDepartment] = useState('');
  const [committee, setCommittee] = useState('');
  const [priority, setPriority] = useState('normal');
  const [slaDeadline, setSlaDeadline] = useState('');
  const [isUpdatingAssignment, setIsUpdatingAssignment] = useState(false);

  const statusOptions = [
    { value: 'draft', label: 'مسودة' },
    { value: 'submitted', label: 'مقدم' },
    { value: 'under_review', label: 'قيد المراجعة' },
    { value: 'missing_documents', label: 'نواقص في المستندات' },
    { value: 'approved', label: 'مقبول مبدئياً' },
    { value: 'interview', label: 'مقابلة' },
    { value: 'awarded', label: 'حاصل على المنحة' },
    { value: 'rejected', label: 'مرفوض' }
  ];

  useEffect(() => {
    loadData();
    loadStaff();
  }, [appId]);

  async function loadStaff() {
    try {
      const res = await apiClient.get('/admin/users');
      setStaff(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch (err) {
      console.error("Failed to load staff", err);
    }
  }

  async function loadData() {
    setIsLoading(true);
    try {
      const res = await apiClient.get<ApplicationDetails>(`/scholarships/applications/${appId}`);
      setDetails(res.data);
      setNewStatus(res.data.application.status);
      setAssignedTo(res.data.application.assigned_to || '');
      setReviewerId(res.data.application.reviewer_id || '');
      setDepartment(res.data.application.department || '');
      setCommittee(res.data.application.committee || '');
      setPriority(res.data.application.priority || 'normal');
      if (res.data.application.sla_deadline) {
        setSlaDeadline(new Date(res.data.application.sla_deadline).toISOString().slice(0, 16));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUpdateAssignment(e: React.FormEvent) {
    e.preventDefault();
    setIsUpdatingAssignment(true);
    try {
      await apiClient.put(`/scholarships/applications/${appId}/assign`, {
        assigned_to: assignedTo || null,
        reviewer_id: reviewerId || null,
        department: department || null,
        committee: committee || null,
        sla_deadline: slaDeadline ? new Date(slaDeadline).toISOString() : null
      });
      await apiClient.put(`/scholarships/applications/${appId}/priority`, {
        priority: priority
      });
      await loadData();
    } catch (err: any) {
      alert("حدث خطأ أثناء حفظ التعيين");
    } finally {
      setIsUpdatingAssignment(false);
    }
  }

  async function handleUpdateStatus(e: React.FormEvent) {
    e.preventDefault();
    if (newStatus === details?.application.status) return;
    
    setIsUpdatingStatus(true);
    setStatusError('');
    try {
      await apiClient.put(`/scholarships/applications/${appId}/status`, {
        status: newStatus,
        reason: statusMessage,
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

  const currentEvaluation = details.evaluations?.[0];
  const submitterName = `${details.submitter?.first_name_ar || details.submitter?.first_name_en || ''} ${details.submitter?.last_name_ar || details.submitter?.last_name_en || ''}`;
  
  const assignedCaseWorkerName = staff.find(s => s.id === details.application.assigned_to)?.first_name || 'غير معين';
  const assignedReviewerName = staff.find(s => s.id === details.application.reviewer_id)?.first_name || 'غير معين';

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-20">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-surface-500 mb-4">
        <Link href="/portal/admin/scholarships" className="hover:text-primary-600">
          إدارة المنح
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link href={`/portal/admin/scholarships/${details.cycle?.id}`} className="hover:text-primary-600">
          {details.cycle?.name_ar || 'الدورة'}
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-surface-900 dark:text-surface-100">مساحة عمل المنحة</span>
      </div>

      {/* Top Summary Bar */}
      <div className="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm font-mono text-surface-500 bg-surface-100 dark:bg-surface-800 px-2 py-1 rounded flex items-center gap-1">
              <Hash className="w-3.5 h-3.5" /> {details.application.id.slice(0, 8).toUpperCase()}
            </span>
            <span className={`badge ${
              ['approved', 'awarded'].includes(details.application.status) ? 'badge-success' : 
              ['rejected'].includes(details.application.status) ? 'badge-error' :
              ['missing_documents'].includes(details.application.status) ? 'badge-warning' : 'badge-primary'
            } capitalize`}>
              {statusOptions.find(o => o.value === details.application.status)?.label || details.application.status}
            </span>
            {details.application.priority === 'urgent' || details.application.priority === 'critical' ? (
               <span className="badge badge-error flex items-center gap-1"><AlertCircle className="w-3 h-3" /> أولوية عالية</span>
            ) : null}
          </div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
            {submitterName}
          </h1>
          <p className="text-sm text-surface-500 mt-1 flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> {details.cycle?.name_ar}
          </p>
        </div>
        <div className="flex gap-4 text-sm text-surface-600 dark:text-surface-400">
          <div className="text-center px-4 border-l border-surface-200 dark:border-surface-700">
            <div className="font-bold text-lg text-surface-900 dark:text-white">{assignedCaseWorkerName}</div>
            <div className="text-xs">مسؤول الحالة</div>
          </div>
          <div className="text-center px-4 border-l border-surface-200 dark:border-surface-700">
            <div className="font-bold text-lg text-surface-900 dark:text-white">{currentEvaluation?.total_score || 0}</div>
            <div className="text-xs">تقييم المراجع</div>
          </div>
          <div className="text-center px-4">
            <div className="font-bold text-lg text-surface-900 dark:text-white">{(details.messages || []).filter(m=>!m.is_internal).length || 0}</div>
            <div className="text-xs">رسائل المتقدم</div>
          </div>
        </div>
      </div>

      {/* 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Panel: Profile & Timeline */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 overflow-hidden">
            <div className="p-4 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800">
              <h3 className="font-bold flex items-center gap-2"><User className="w-4 h-4 text-primary-600" /> الملخص الشخصي</h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-surface-400" />
                <div className="text-sm">
                  <span className="block text-xs text-surface-500">الجامعة</span>
                  <span className="font-medium">{details.submitter?.profile?.university || 'غير محدد'}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-surface-400" />
                <div className="text-sm">
                  <span className="block text-xs text-surface-500">التخصص</span>
                  <span className="font-medium">{details.submitter?.profile?.major || 'غير محدد'}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-surface-400" />
                <div className="text-sm">
                  <span className="block text-xs text-surface-500">الدولة المضيفة</span>
                  <span className="font-medium">{details.submitter?.profile?.country || 'غير محدد'}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-surface-400" />
                <div className="text-sm">
                  <span className="block text-xs text-surface-500">المعدل التراكمي (GPA)</span>
                  <span className="font-medium text-primary-600">{details.submitter?.profile?.gpa || 'غير محدد'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 overflow-hidden">
            <div className="p-4 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800">
              <h3 className="font-bold flex items-center gap-2"><Calendar className="w-4 h-4 text-primary-600" /> السجل الزمني</h3>
            </div>
            <div className="p-4 h-[300px] overflow-y-auto">
              <div className="space-y-4 relative before:absolute before:inset-0 before:mr-2 before:w-0.5 before:bg-surface-200 dark:before:bg-surface-700">
                {details.timeline?.map((item) => (
                  <div key={item.id} className="relative pl-6 pr-6">
                    <div className="absolute right-0 top-1.5 w-4 h-4 rounded-full bg-surface-100 border-2 border-primary-500 z-10"></div>
                    <div className="text-sm font-medium">{item.title}</div>
                    <div className="text-xs text-surface-500 mt-1">{formatDateTime(item.created_at)}</div>
                  </div>
                ))}
                {!details.timeline?.length && <div className="text-center text-xs text-surface-500">لا يوجد سجل زمني</div>}
              </div>
            </div>
          </div>
        </div>

        {/* Middle Panel: Application Details & Documents */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 overflow-hidden">
             <div className="p-4 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 flex justify-between items-center">
               <h3 className="font-bold flex items-center gap-2"><Info className="w-4 h-4 text-primary-600" /> تفاصيل إضافية</h3>
             </div>
             <div className="p-5 grid grid-cols-2 gap-4">
                <div className="border border-surface-100 dark:border-surface-800 p-3 rounded-lg flex items-center gap-3">
                  <div className="p-2 bg-primary-50 text-primary-600 rounded-lg"><DollarSign className="w-5 h-5"/></div>
                  <div>
                    <div className="text-xs text-surface-500">دخل الأسرة الشهري</div>
                    <div className="font-bold">{details.application.family_income ? `$${details.application.family_income}` : 'غير محدد'}</div>
                  </div>
                </div>
                <div className="border border-surface-100 dark:border-surface-800 p-3 rounded-lg flex items-center gap-3">
                  <div className="p-2 bg-primary-50 text-primary-600 rounded-lg"><Users className="w-5 h-5"/></div>
                  <div>
                    <div className="text-xs text-surface-500">عدد أفراد الأسرة</div>
                    <div className="font-bold">{details.application.family_size || 'غير محدد'}</div>
                  </div>
                </div>
             </div>
             
             {details.application.extra_data && Object.keys(details.application.extra_data).length > 0 && (
               <div className="p-5 border-t border-surface-100 dark:border-surface-800 space-y-4">
                  {Object.entries(details.application.extra_data).map(([key, value]) => {
                    if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('data:'))) return null;
                    
                    let label = key;
                    const fields = details.cycle?.configuration?.fields;
                    if (Array.isArray(fields)) {
                      const field = fields.find((f: any) => f.id === key);
                      if (field) label = field.label_ar || field.label_en || field.label || key;
                    }
                    return (
                      <div key={key} className="border-b border-surface-100 dark:border-surface-800 pb-3 last:border-0">
                        <div className="text-xs font-medium text-surface-500 mb-1">{label}</div>
                        <div className="text-sm">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</div>
                      </div>
                    );
                  })}
               </div>
             )}
          </div>

          <div className="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 overflow-hidden">
            <div className="p-4 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800">
              <h3 className="font-bold flex items-center gap-2"><FileText className="w-4 h-4 text-primary-600" /> المستندات المرفقة (Document Verification)</h3>
            </div>
            <div className="p-4">
               {details.application.extra_data && Object.keys(details.application.extra_data).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(details.application.extra_data).map(([key, value]) => {
                      if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('data:'))) {
                        return (
                          <div key={key} className="h-[300px]">
                            <DocumentViewer 
                              label={key} 
                              url={value} 
                              onMarkMissing={() => setNewStatus('missing_documents')}
                            />
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
          
          {/* Assignment Update */}
          <div className="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 overflow-hidden">
            <div className="p-4 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800">
              <h3 className="font-bold flex items-center gap-2"><Briefcase className="w-4 h-4 text-primary-600" /> تعيين الحالة والمسؤوليات</h3>
            </div>
            <div className="p-4">
              <form onSubmit={handleUpdateAssignment} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-surface-700 mb-1">مسؤول الحالة (Case Worker)</label>
                  <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className="input-field text-sm py-1.5">
                    <option value="">غير معين</option>
                    {staff.map(u => <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-surface-700 mb-1">المراجع (Reviewer)</label>
                  <select value={reviewerId} onChange={(e) => setReviewerId(e.target.value)} className="input-field text-sm py-1.5">
                    <option value="">غير معين</option>
                    {staff.map(u => <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-surface-700 mb-1">القسم</label>
                    <input type="text" className="input-field text-sm py-1.5" value={department} onChange={e => setDepartment(e.target.value)} placeholder="التدقيق" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-surface-700 mb-1">الأولوية</label>
                    <select value={priority} onChange={e => setPriority(e.target.value)} className="input-field text-sm py-1.5">
                      <option value="low">منخفضة</option>
                      <option value="normal">عادية</option>
                      <option value="high">مرتفعة</option>
                      <option value="urgent">عاجلة</option>
                      <option value="critical">حرجة</option>
                    </select>
                  </div>
                </div>
                <button type="submit" disabled={isUpdatingAssignment} className="btn-outline w-full py-1.5 text-xs disabled:opacity-50 mt-1">
                  {isUpdatingAssignment ? 'جاري الحفظ...' : 'حفظ التعيين'}
                </button>
              </form>
            </div>
          </div>

          {/* Status Update */}
          <div className="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 overflow-hidden">
            <div className="p-4 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800">
              <h3 className="font-bold">تحديث الحالة</h3>
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
                  <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="input-field text-sm py-2">
                    {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                
                {(newStatus === 'rejected' || newStatus === 'missing_documents' || newStatus !== details.application.status) && (
                  <div>
                    <textarea
                      value={statusMessage}
                      onChange={(e) => setStatusMessage(e.target.value)}
                      required={['rejected', 'missing_documents'].includes(newStatus)}
                      className="input-field h-20 text-sm"
                      placeholder={`رسالة الإشعار للمتقدم ${['rejected', 'missing_documents'].includes(newStatus) ? '(إجبارية)' : '(اختيارية)'}...`}
                    />
                  </div>
                )}
                
                <button type="submit" disabled={isUpdatingStatus || newStatus === details.application.status} className="btn-gradient w-full py-2 text-sm disabled:opacity-50">
                  {isUpdatingStatus ? 'جاري التحديث...' : 'اعتماد الحالة'}
                </button>
              </form>
            </div>
          </div>

          {/* Evaluation Panel */}
          <ScholarshipEvaluationPanel 
            projectId={details.application.id}
            existingScores={currentEvaluation?.scores}
            onScoreSubmitted={loadData}
          />

          {/* Communication Panel */}
          <CommunicationPanel 
            projectId={details.application.id}
            messages={details.messages || []}
            onMessageSent={loadData}
            apiUrl={`/scholarships/applications/${details.application.id}/messages`}
          />
          
        </div>
      </div>
    </div>
  );
}
