import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { DocumentIcon, ArrowUpTrayIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

interface UserDocument {
  id: string;
  document_type: string;
  file_url: string;
  uploaded_at: string;
}

const DOCUMENT_TYPES = [
  { id: "id_card", label: "البطاقة الشخصية / الإقامة" },
  { id: "passport", label: "جواز السفر" },
  { id: "student_card", label: "البطاقة الجامعية" },
  { id: "transcript", label: "كشف الدرجات" },
  { id: "certificate", label: "الشهادة" },
  { id: "cv", label: "السيرة الذاتية" },
  { id: "recommendation", label: "رسالة توصية" },
  { id: "language_cert", label: "شهادة لغة" },
  { id: "other", label: "مستند آخر" },
];

export default function ProfileVault({ userId, readOnly }: { userId?: string; readOnly?: boolean }) {
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState(DOCUMENT_TYPES[0].id);

  const fetchDocuments = async () => {
    try {
      const endpoint = userId ? `/admin/users/${userId}/vault` : "/profile/vault";
      const res = await apiClient.get(endpoint);
      setDocuments(res.data || []);
    } catch (error: any) {
      toast.error(error.message || "فشل في تحميل المستندات");
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [userId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "vault");

    try {
      const fileRes = await apiClient.post("/files/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const endpoint = userId ? `/admin/users/${userId}/vault` : "/profile/vault";
      await apiClient.post(endpoint, {
        document_type: uploadType,
        file_url: fileRes.data.url,
        metadata: { original_name: file.name, size: file.size }
      });

      toast.success("تم رفع المستند بنجاح");
      fetchDocuments();
    } catch (error: any) {
      toast.error(error.message || "فشل رفع المستند");
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const getTypeLabel = (typeId: string) => {
    return DOCUMENT_TYPES.find(t => t.id === typeId)?.label || typeId;
  };

  return (
    <div className="bg-white shadow sm:rounded-lg overflow-hidden border border-gray-100">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
          <DocumentIcon className="h-5 w-5 ml-2 text-primary-500" />
          المستندات الشخصية
        </h3>
      </div>
      <div className="px-4 py-5 sm:p-6 space-y-6">
        <p className="text-sm text-gray-500">
          إدارة مستنداتك القابلة لإعادة الاستخدام في المنصة.
        </p>

        {!readOnly && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">نوع المستند</label>
              <select
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                {DOCUMENT_TYPES.map(t => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="flex-shrink-0 sm:self-end">
              <label className="relative inline-flex items-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 cursor-pointer disabled:opacity-50">
                <ArrowUpTrayIcon className="-mr-1 ml-2 h-5 w-5" />
                {isUploading ? "جاري الرفع..." : "رفع مستند جديد"}
                <input
                  type="file"
                  className="hidden"
                  onChange={handleUpload}
                  disabled={isUploading}
                />
              </label>
            </div>
          </div>
        )}

        <div className="mt-4">
          {documents.length > 0 ? (
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-right text-sm font-semibold text-gray-900 sm:pl-6">النوع</th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">تاريخ الرفع</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">إجراءات</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {documents.map((doc) => (
                    <tr key={doc.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {getTypeLabel(doc.document_type)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {new Date(doc.uploaded_at).toLocaleDateString("ar-EG")}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-left text-sm font-medium sm:pr-6">
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-900">
                          عرض
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-500 py-4 text-center">لا توجد مستندات مرفوعة حتى الآن.</p>
          )}
        </div>
      </div>
    </div>
  );
}
