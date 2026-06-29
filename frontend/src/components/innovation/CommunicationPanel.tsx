import { useState } from "react";
import { Send, User, ShieldAlert, Lock, Clock } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";

type ProjectMessage = {
  id: string;
  sender_id: string;
  message: string;
  is_internal: boolean;
  created_at: string;
};

type CommunicationPanelProps = {
  projectId: string;
  messages: ProjectMessage[];
  currentUserId?: string;
  onMessageSent: () => void;
  apiUrl?: string;
};

export function CommunicationPanel({ projectId, messages, currentUserId, onMessageSent, apiUrl }: CommunicationPanelProps) {
  const [newMessage, setNewMessage] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setIsSending(true);
    try {
      const endpoint = apiUrl || `/innovation/applications/${projectId}/messages`;
      await apiClient.post(endpoint, {
        message: newMessage,
        is_internal: isInternal
      });
      setNewMessage("");
      onMessageSent();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 flex flex-col h-[500px]">
      <div className="p-4 border-b border-surface-200 dark:border-surface-700 flex justify-between items-center">
        <h3 className="font-bold text-surface-900 dark:text-white flex items-center gap-2">
          التواصل والملاحظات
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-surface-500 py-8">
            <ShieldAlert className="w-8 h-8 text-surface-300 mx-auto mb-2" />
            <p>لا توجد رسائل أو ملاحظات حتى الآن</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className={`flex items-center gap-2 mb-1 text-xs text-surface-500 ${isMe ? 'flex-row-reverse' : ''}`}>
                  <span className="font-medium">{isMe ? 'أنت' : 'النظام / مستخدم'}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDateTime(msg.created_at)}</span>
                  {msg.is_internal && (
                    <span className="flex items-center gap-1 text-orange-600 bg-orange-50 dark:bg-orange-900/30 px-1.5 py-0.5 rounded">
                      <Lock className="w-3 h-3" /> ملاحظة داخلية
                    </span>
                  )}
                </div>
                <div 
                  className={`max-w-[85%] p-3 rounded-2xl ${
                    msg.is_internal 
                      ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-900 dark:text-orange-100 border border-orange-200 dark:border-orange-800'
                      : isMe
                        ? 'bg-primary-600 text-white rounded-tl-none'
                        : 'bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-white rounded-tr-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm">{msg.message}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSendMessage} className="p-4 border-t border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800">
        <div className="mb-3 flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer text-surface-600 dark:text-surface-300">
            <input 
              type="checkbox" 
              checked={!isInternal}
              onChange={() => setIsInternal(false)}
              className="rounded border-surface-300 text-primary-600 focus:ring-primary-600"
            />
            رسالة للمتقدم
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer text-orange-600 dark:text-orange-400">
            <input 
              type="checkbox" 
              checked={isInternal}
              onChange={() => setIsInternal(true)}
              className="rounded border-orange-300 text-orange-600 focus:ring-orange-600"
            />
            <Lock className="w-3.5 h-3.5" /> ملاحظة داخلية (للمقيمين والإدارة فقط)
          </label>
        </div>
        
        <div className="flex gap-2">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={isInternal ? "اكتب ملاحظة داخلية للجنة..." : "اكتب رسالة للمتقدم للرد عليها..."}
            className={`flex-1 input-field resize-none h-10 min-h-[40px] max-h-[120px] py-2 ${isInternal ? 'focus:border-orange-500 focus:ring-orange-500' : ''}`}
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={isSending || !newMessage.trim()}
            className={`px-4 py-2 rounded-lg text-white flex items-center justify-center transition-colors ${
              isInternal 
                ? 'bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300' 
                : 'bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300'
            }`}
          >
            {isSending ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5 rtl:rotate-180" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
