"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import ProfileVault from "@/components/profile/ProfileVault";
import { IdentificationIcon, TagIcon, ArrowRightIcon } from "@heroicons/react/24/outline";

export default function AdminUserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = await apiClient.get(`/admin/users/${userId}/profile`);
      setProfileData(res.data);
    } catch (e) {
      console.error("Failed to load user profile", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  if (isLoading) return <div className="p-8 text-right" dir="rtl">جاري التحميل...</div>;

  if (!profileData) {
    return (
      <div className="p-8 text-center" dir="rtl">
        <h2 className="text-xl font-semibold text-gray-900">لم يتم العثور على الملف الشخصي</h2>
        <button onClick={() => router.back()} className="mt-4 text-primary-600 hover:text-primary-800">
          العودة
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button 
            onClick={() => router.back()} 
            className="ml-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
            title="العودة"
          >
            <ArrowRightIcon className="h-6 w-6 text-gray-500" />
          </button>
          <div>
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              تفاصيل الملف الشخصي
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              عرض بيانات المستخدم ومستنداته (للقراءة فقط).
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Identity Card */}
        <div className="bg-white shadow sm:rounded-lg overflow-hidden border border-gray-100">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
              <IdentificationIcon className="h-5 w-5 ml-2 text-primary-500" />
              المعلومات الأساسية
            </h3>
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
              للقراءة فقط
            </span>
          </div>
          <div className="px-4 py-5 sm:p-6 space-y-6">
            
            <div className="flex items-center space-x-6 space-x-reverse">
              <div className="shrink-0 relative">
                <div className="h-24 w-24 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-3xl font-bold overflow-hidden border-2 border-primary-200">
                  {profileData?.identity?.first_name_ar?.[0] || profileData?.identity?.first_name_en?.[0] || "U"}
                </div>
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900">
                  {profileData?.identity?.first_name_ar || profileData?.identity?.first_name_en}{" "}
                  {profileData?.identity?.last_name_ar || profileData?.identity?.last_name_en}
                </h4>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-6">
              <div>
                <span className="block text-sm font-medium text-gray-500">رقم الهاتف</span>
                <span className="block text-sm text-gray-900 mt-1" dir="ltr" style={{textAlign: 'right'}}>
                  {profileData?.identity?.phone || "غير متوفر"}
                </span>
              </div>
              <div>
                <span className="block text-sm font-medium text-gray-500">تاريخ الميلاد</span>
                <span className="block text-sm text-gray-900 mt-1">
                  {profileData?.identity?.date_of_birth ? new Date(profileData.identity.date_of_birth).toLocaleDateString("ar-EG") : "غير متوفر"}
                </span>
              </div>
              <div>
                <span className="block text-sm font-medium text-gray-500">الجنسية</span>
                <span className="block text-sm text-gray-900 mt-1">{profileData?.identity?.nationality || "غير متوفر"}</span>
              </div>
              <div>
                <span className="block text-sm font-medium text-gray-500">الاسم بالإنجليزية</span>
                <span className="block text-sm text-gray-900 mt-1">
                  {profileData?.identity?.first_name_en} {profileData?.identity?.last_name_en}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Interests Card */}
        <div className="bg-white shadow sm:rounded-lg overflow-hidden border border-gray-100">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
              <TagIcon className="h-5 w-5 ml-2 text-primary-500" />
              الاهتمامات في المنصة
            </h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="flex flex-wrap gap-2">
              {profileData?.interests?.length > 0 ? (
                profileData.interests.map((interest: string) => (
                  <span
                    key={interest}
                    className="inline-flex items-center rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-800"
                  >
                    {interest}
                  </span>
                ))
              ) : (
                <span className="text-sm text-gray-500">لم يحدد المستخدم أي اهتمامات.</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Vault in Read-Only Mode */}
      <ProfileVault userId={userId} readOnly={true} />

    </div>
  );
}
