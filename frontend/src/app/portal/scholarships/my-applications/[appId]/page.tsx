"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";
import { ChevronRight, FileText, Clock, Send, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";

type ScholarshipSubmission = {
  id: string;
  status: string;
  created_at: string;
  extra_data: Record<string, any>;
};

type ScholarshipCycle = {
  id: string;
  name_ar: string;
};

type ProjectTimeline = {
  id: string;
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

type ApplicationDetails = {
  application: ScholarshipSubmission;
  cycle: ScholarshipCycle;
  timeline: ProjectTimeline[];
  messages: ProjectMessage[];
};

export default function StudentScholarshipTracker() {
  const params = useParams();
  const appId = params.appId as string;
  const { user } = useAuth();
  
  const [details, setDetails] = useState<ApplicationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    loadData();
  }, [appId]);

  async function loadData() {
    setIsLoading(true);
    try {
      const res = await apiClient.get<ApplicationDetails>(`/scholarships/applications/${appId}`);
      // Filter out internal messages for the student
      const data = res.data;
      if (data.messages) {
        data.messages = data.messages.filter((m: ProjectMessage) => !m.is_internal);
      }
      setDetails(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    setIsSending(true);
    try {
      await apiClient.post(`/scholarships/applications/${appId}/messages`, {
        message: newMessage,
        is_internal: false
      });
      setNewMessage('');
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  }

  if (isLoading) return <div className="p-8 text-center">جاري التحميل...</div>;
  if (!details) return <div className="p-8 text-center">لم يتم العثور على الطلب</div>;

  const steps = ['submitted', 'under_review', 'missing_documents', 'approved', 'interview', 'awarded'];
  const currentStepIndex = steps.indexOf(details.application.status);
  const isRejected = details.application.status === 'rejected';

  const pipelineSteps = ['تقديم الطلب', 'قيد المراجعة', 'نواقص / مراجعة', 'مقبول مبدئياً', 'مقابلة', 'منحة دراسية'];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-2 text-sm text-surface-500 mb-4">
        <Link href="/portal/my-applications" className="hover:text-primary-600">
          طلباتي
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-surface-900 dark:text-surface-100">{details.cycle?.name_ar}</span>
      </div>

      <div className="glass-card p-6">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">
          طلب منحة رقم: {details.application.id.slice(0, 8)}
        </h1>
        <p className="text-surface-600 dark:text-surface-400">
          {details.cycle?.name_ar} • مقدم في {formatDateTime(details.application.created_at)}
        </p>

        {/* Visual Pipeline */}
        <div className="mt-8 mb-4">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-surface-200 dark:bg-surface-700 z-0"></div>
            
            {pipelineSteps.map((stepName, idx) => {
              const isCompleted = currentStepIndex >= idx && !isRejected;
              const isCurrent = currentStepIndex === idx && !isRejected;
              const isFailed = isRejected && idx === currentStepIndex;

              return (
                <div key={idx} className="relative z-10 flex flex-col items-center gap-2 bg-surface-50 dark:bg-surface-900 px-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    isFailed ? 'border-red-500 bg-red-100 text-red-600' :
                    isCompleted ? 'border-primary-600 bg-primary-600 text-white' : 
                    isCurrent ? 'border-primary-500 bg-primary-50 text-primary-600' :
                    'border-surface-300 bg-surface-100 text-surface-400'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <span>{idx + 1}</span>}
                  </div>
                  <span className={`text-xs md:text-sm font-medium ${isCurrent || isCompleted ? 'text-surface-900 dark:text-white' : 'text-surface-500'}`}>
                    {stepName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline & Chat */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold mb-6">سجل التحديثات</h2>
            <div className="space-y-6">
              {(!details.timeline || details.timeline.length === 0) ? (
                <div className="text-center text-surface-500 py-8">لا يوجد سجل زمني لهذا الطلب حتى الآن.</div>
              ) : details.timeline.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="w-10 h-10 shrink-0 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-surface-900 dark:text-white">{item.title}</h3>
                    <div className="text-sm text-surface-500 mb-2">{formatDateTime(item.created_at)}</div>
                    <p className="text-surface-700 dark:text-surface-300 bg-surface-50 dark:bg-surface-800/50 p-3 rounded-lg border border-surface-200 dark:border-surface-700">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Messaging System */}
          <div className="glass-card p-6 flex flex-col h-[500px]">
            <h2 className="text-lg font-bold mb-4">التواصل مع إدارة الجمعية</h2>
            
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
              {(!details.messages || details.messages.length === 0) ? (
                <div className="text-center text-surface-500 mt-10">
                  لا توجد رسائل حاليا. يمكنك إرسال استفسار للإدارة أدناه أو الرد على استفساراتهم هنا.
                </div>
              ) : details.messages.map((msg) => {
                const isMe = msg.sender_id === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-xl p-3 ${
                      isMe 
                        ? 'bg-primary-600 text-white rounded-tr-none' 
                        : 'bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-white rounded-tl-none border border-surface-200 dark:border-surface-700'
                    }`}>
                      <p className="whitespace-pre-wrap">{msg.message}</p>
                      <span className={`text-[10px] mt-1 block ${isMe ? 'text-primary-100' : 'text-surface-500'}`}>
                        {formatDateTime(msg.created_at)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <form onSubmit={handleSendMessage} className="flex gap-2 pt-4 border-t border-surface-200 dark:border-surface-700">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="اكتب رسالتك هنا..."
                className="input-field flex-1"
                disabled={isSending}
              />
              <button 
                type="submit" 
                disabled={!newMessage.trim() || isSending}
                className="btn-gradient p-3 aspect-square rounded-xl flex items-center justify-center disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
        
        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold mb-4">البيانات الإضافية المرفقة</h2>
            {details.application.extra_data && Object.keys(details.application.extra_data).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(details.application.extra_data).map(([key, value]) => (
                  <div key={key} className="border-b border-surface-200 dark:border-surface-700 pb-3 last:border-0">
                    <h3 className="text-sm font-medium text-surface-500 mb-1">{key}</h3>
                    {typeof value === 'object' && value !== null ? (
                       <pre className="text-xs bg-surface-50 dark:bg-surface-800 p-2 rounded-lg text-surface-700 dark:text-surface-300 whitespace-pre-wrap font-mono">
                         {JSON.stringify(value, null, 2)}
                       </pre>
                    ) : typeof value === 'boolean' ? (
                       <p className="text-sm text-surface-900 dark:text-white">{value ? 'نعم' : 'لا'}</p>
                    ) : typeof value === 'string' && value.startsWith('http') ? (
                       <a href={value} target="_blank" rel="noreferrer" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
                         <FileText className="w-4 h-4" /> عرض المستند
                       </a>
                    ) : (
                       <p className="text-sm text-surface-900 dark:text-white whitespace-pre-wrap">{String(value)}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
               <p className="text-surface-500 text-sm">لا توجد بيانات إضافية مرفقة بهذا الطلب.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
