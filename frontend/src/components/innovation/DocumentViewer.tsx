import { useState } from "react";
import { Download, ExternalLink, FileText, FileImage, AlertCircle, RefreshCw } from "lucide-react";
import Image from "next/image";

type DocumentViewerProps = {
  label: string;
  url: string;
  onMarkMissing?: () => void;
  onRequestReplacement?: () => void;
};

export function DocumentViewer({ label, url, onMarkMissing, onRequestReplacement }: DocumentViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState(false);

  const isImage = /\.(jpeg|jpg|gif|png)$/i.test(url) || url.startsWith('data:image');
  const isPdf = /\.pdf$/i.test(url) || url.startsWith('data:application/pdf');

  const getIcon = () => {
    if (isImage) return <FileImage className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  return (
    <div className="border border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden bg-white dark:bg-surface-900 shadow-sm flex flex-col h-full">
      {/* Header */}
      <div className="bg-surface-50 dark:bg-surface-800 p-3 border-b border-surface-200 dark:border-surface-700 flex justify-between items-center">
        <div className="flex items-center gap-2 text-surface-900 dark:text-white font-medium">
          {getIcon()}
          <span className="truncate max-w-[200px] text-sm">{label}</span>
        </div>
        <div className="flex gap-2">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 text-surface-500 hover:text-primary-600 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
            title="فتح في علامة تبويب جديدة"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          <a
            href={url}
            download
            className="p-1.5 text-surface-500 hover:text-primary-600 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
            title="تحميل المستند"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Viewer Body */}
      <div className="flex-1 min-h-[250px] bg-surface-100 dark:bg-surface-950 flex items-center justify-center p-2 relative overflow-hidden group">
        {error ? (
          <div className="text-center p-4">
            <AlertCircle className="w-8 h-8 text-surface-400 mx-auto mb-2" />
            <p className="text-sm text-surface-500">تعذر تحميل المعاينة</p>
          </div>
        ) : isImage ? (
          <div className="relative w-full h-full min-h-[250px]">
            <Image
              src={url}
              alt={label}
              fill
              className="object-contain"
              onError={() => setError(true)}
              unoptimized
            />
          </div>
        ) : isPdf ? (
          <iframe
            src={`${url}#toolbar=0`}
            className="w-full h-full min-h-[300px]"
            title={label}
            onError={() => setError(true)}
          />
        ) : (
          <div className="text-center p-4">
            <FileText className="w-12 h-12 text-surface-300 mx-auto mb-3" />
            <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">
              لا تتوفر معاينة لهذا النوع من الملفات
            </p>
            <a
              href={url}
              download
              className="btn-outline text-xs px-3 py-1.5 inline-flex items-center gap-2"
            >
              <Download className="w-3.5 h-3.5" /> تحميل للمشاهدة
            </a>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      {(onMarkMissing || onRequestReplacement) && (
        <div className="bg-white dark:bg-surface-900 p-3 border-t border-surface-200 dark:border-surface-700 flex justify-end gap-2 text-xs">
          {onMarkMissing && (
            <button
              onClick={onMarkMissing}
              className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <AlertCircle className="w-3.5 h-3.5" /> تبليغ عن نقص
            </button>
          )}
          {onRequestReplacement && (
            <button
              onClick={onRequestReplacement}
              className="text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 px-2 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> طلب استبدال
            </button>
          )}
        </div>
      )}
    </div>
  );
}
