"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { apiClient } from "@/lib/api-client";
import ProfileVault from "@/components/profile/ProfileVault";
import { UserCircleIcon, IdentificationIcon, TagIcon, PencilIcon, ArrowUpTrayIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const { register, handleSubmit, reset } = useForm();

  const fetchProfile = async () => {
    try {
      const res = await apiClient.get("/profile");
      const data = res.data;
      setProfileData(data);
      reset({
        first_name_ar: data.identity?.first_name_ar || "",
        last_name_ar: data.identity?.last_name_ar || "",
        first_name_en: data.identity?.first_name_en || "",
        last_name_en: data.identity?.last_name_en || "",
        phone: data.identity?.phone || "",
        date_of_birth: data.identity?.date_of_birth ? new Date(data.identity.date_of_birth).toISOString().split('T')[0] : "",
      });
    } catch (e) {
      console.error("Failed to load profile", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (data: any) => {
    setIsSubmitting(true);
    try {
      await apiClient.put("/profile", data);
      toast.success("تم تحديث الملف الشخصي بنجاح");
      setIsEditing(false);
      fetchProfile();
      refreshUser();
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ أثناء التحديث");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "avatars");

    try {
      const fileRes = await apiClient.post("/files/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const fileData = fileRes.data;

      await apiClient.put("/profile", {
        avatar_file_id: fileData.id,
      });

      toast.success("تم رفع الصورة بنجاح");
      fetchProfile();
      refreshUser();
    } catch (error: any) {
      toast.error(error.message || "فشل رفع الصورة");
    } finally {
      setAvatarUploading(false);
    }
  };

  if (isLoading) return <div className="p-8 text-right" dir="rtl">جاري التحميل...</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            الملف الشخصي الشامل
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            إدارة معلوماتك الشخصية، اهتماماتك، ومستنداتك عبر جميع الأقسام.
          </p>
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
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              <PencilIcon className="-mr-1 ml-2 h-4 w-4" />
              تعديل
            </button>
          </div>
          <div className="px-4 py-5 sm:p-6 space-y-6">
            
            <div className="flex items-center space-x-6 space-x-reverse">
              <div className="shrink-0 relative">
                <div className="h-24 w-24 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-3xl font-bold overflow-hidden border-2 border-primary-200">
                  {user?.profile?.avatar_url ? (
                    <img src={user.profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    user?.profile?.first_name_ar?.[0] || user?.profile?.first_name_en?.[0] || "U"
                  )}
                </div>
                <label className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow-md border border-gray-200 cursor-pointer hover:bg-gray-50">
                  <ArrowUpTrayIcon className="h-4 w-4 text-gray-600" />
                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={avatarUploading} />
                </label>
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900">
                  {profileData?.identity?.first_name_ar || profileData?.identity?.first_name_en}{" "}
                  {profileData?.identity?.last_name_ar || profileData?.identity?.last_name_en}
                </h4>
                <p className="text-sm text-gray-500">{user?.email}</p>
                {avatarUploading && <p className="text-xs text-primary-600 mt-1">جاري رفع الصورة...</p>}
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
                <span className="text-sm text-gray-500">لم يتم اختيار اهتمامات.</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Vault */}
      <ProfileVault />

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-gray-900 bg-opacity-50 p-4">
          <div className="relative w-full max-w-2xl rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-4">
              <h3 className="text-xl font-semibold text-gray-900">تعديل المعلومات الأساسية</h3>
              <button
                onClick={() => setIsEditing(false)}
                className="ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit(handleUpdateProfile)} className="p-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mb-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900">الاسم الأول (عربي)</label>
                  <input
                    {...register("first_name_ar")}
                    type="text"
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900">الاسم الأخير (عربي)</label>
                  <input
                    {...register("last_name_ar")}
                    type="text"
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900">الاسم الأول (إنجليزي)</label>
                  <input
                    {...register("first_name_en")}
                    type="text"
                    dir="ltr"
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 text-left"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900">الاسم الأخير (إنجليزي)</label>
                  <input
                    {...register("last_name_en")}
                    type="text"
                    dir="ltr"
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 text-left"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900">رقم الهاتف</label>
                  <input
                    {...register("phone")}
                    type="text"
                    dir="ltr"
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 text-left"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900">تاريخ الميلاد</label>
                  <input
                    {...register("date_of_birth")}
                    type="date"
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-4 space-x-reverse border-t pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-primary-700 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-primary-800 focus:outline-none focus:ring-4 focus:ring-primary-300"
                >
                  {isSubmitting ? "جاري الحفظ..." : "حفظ التغييرات"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:z-10 focus:outline-none focus:ring-4 focus:ring-primary-300"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
