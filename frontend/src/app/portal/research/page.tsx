"use client";

import { useState, useEffect } from "react";
import { 
  BeakerIcon, 
  DocumentTextIcon, 
  CurrencyDollarIcon, 
  PlusIcon,
  UsersIcon,
  AcademicCapIcon,
  BookOpenIcon,
  CalendarIcon
} from "@heroicons/react/24/outline";
import { formatDateTime } from "@/lib/utils";
import { apiClient as api } from "@/lib/api-client";

export default function ResearchDashboard() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get("/research/dashboard");
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">منصة البحث والتطوير الأكاديمي</h1>
          <p className="text-gray-500 mt-2 text-lg">منظومة متكاملة لدعم وتمويل وإدارة المشاريع البحثية والمؤتمرات العلمية</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 transition-colors font-medium">
            <DocumentTextIcon className="w-5 h-5 ml-2" />
            نشر ورقة علمية
          </button>
          <button className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg shadow-md hover:bg-primary-700 transition-colors font-medium">
            <PlusIcon className="w-5 h-5 ml-2" />
            اقتراح مشروع بحثي
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 rounded-full opacity-50"></div>
          <div className="flex justify-between items-start z-10">
            <div>
              <p className="text-sm font-medium text-gray-500">المشاريع البحثية النشطة</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">{data?.stats?.active_projects || 0}</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <BeakerIcon className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 text-sm text-blue-600 font-medium">مشاريع جارية وممولة</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-50 rounded-full opacity-50"></div>
          <div className="flex justify-between items-start z-10">
            <div>
              <p className="text-sm font-medium text-gray-500">منح بحثية مفتوحة</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">{data?.stats?.open_grants || 0}</h3>
            </div>
            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
              <CurrencyDollarIcon className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 text-sm text-green-600 font-medium">فرص تمويل متاحة للتقديم</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-50 rounded-full opacity-50"></div>
          <div className="flex justify-between items-start z-10">
            <div>
              <p className="text-sm font-medium text-gray-500">الأوراق العلمية المنشورة</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">{data?.stats?.published_papers || 0}</h3>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
              <BookOpenIcon className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 text-sm text-purple-600 font-medium">أبحاث ورسائل ومجلات</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-50 rounded-full opacity-50"></div>
          <div className="flex justify-between items-start z-10">
            <div>
              <p className="text-sm font-medium text-gray-500">مؤتمرات وفعاليات قادمة</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">{data?.stats?.upcoming_conferences || 0}</h3>
            </div>
            <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
              <AcademicCapIcon className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 text-sm text-orange-600 font-medium">Call for Papers</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Active Projects */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-800 flex items-center">
                <BeakerIcon className="w-5 h-5 ml-2 text-primary-600" />
                المشاريع البحثية الجارية
              </h2>
              <button className="text-sm text-primary-600 font-medium hover:text-primary-700">عرض الكل</button>
            </div>
            <div className="p-0">
              {data?.projects?.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                  {data.projects.map((proj: any) => (
                    <li key={proj.id} className="p-5 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-gray-900 text-lg">{proj.title}</h4>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{proj.abstract}</p>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          نشط
                        </span>
                      </div>
                      <div className="mt-4 flex items-center justify-between text-sm">
                        <div className="flex space-x-4 space-x-reverse text-gray-500">
                          <span className="flex items-center">
                            <CurrencyDollarIcon className="w-4 h-4 ml-1" />
                            الميزانية: ${proj.approved_budget || proj.requested_budget}
                          </span>
                          <span className="flex items-center">
                            <CalendarIcon className="w-4 h-4 ml-1" />
                            البدء: {formatDateTime(proj.start_date).split(" ")[0]}
                          </span>
                        </div>
                        <button className="text-primary-600 font-medium hover:underline">إدارة المشروع</button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-8 text-center text-gray-500">لا توجد مشاريع بحثية نشطة حالياً.</div>
              )}
            </div>
          </div>

          {/* Publications */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-800 flex items-center">
                <BookOpenIcon className="w-5 h-5 ml-2 text-purple-600" />
                أحدث المنشورات العلمية
              </h2>
              <button className="text-sm text-primary-600 font-medium hover:text-primary-700">المكتبة الرقمية</button>
            </div>
            <div className="p-0">
              {data?.publications?.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                  {data.publications.map((pub: any) => (
                    <li key={pub.id} className="p-5 hover:bg-gray-50 transition-colors flex gap-4">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                          <DocumentTextIcon className="w-6 h-6" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 leading-tight">{pub.title}</h4>
                        <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                          <span className="font-medium text-gray-700">{pub.journal_name || pub.publication_type}</span>
                          <span>&bull;</span>
                          <span>{formatDateTime(pub.publication_date).split(" ")[0]}</span>
                          {pub.doi && (
                            <>
                              <span>&bull;</span>
                              <span className="text-blue-500 text-xs font-mono">{pub.doi}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-8 text-center text-gray-500">لا توجد منشورات مسجلة بعد.</div>
              )}
            </div>
          </div>

        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          
          {/* Open Grants */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100 overflow-hidden">
            <div className="p-5 border-b border-green-200/50">
              <h2 className="text-lg font-bold text-green-900 flex items-center">
                <CurrencyDollarIcon className="w-5 h-5 ml-2" />
                منح بحثية مفتوحة
              </h2>
            </div>
            <div className="p-5 space-y-4">
              {data?.grants?.length > 0 ? (
                data.grants.map((grant: any) => (
                  <div key={grant.id} className="bg-white rounded-lg p-4 shadow-sm border border-green-100">
                    <h4 className="font-bold text-gray-900 mb-1">{grant.name_ar}</h4>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{grant.description}</p>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-50">
                      <span className="text-xs font-medium text-gray-500">
                        ينتهي التقديم: {formatDateTime(grant.application_deadline).split(" ")[0]}
                      </span>
                      <button className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md font-medium transition-colors">
                        تقديم طلب
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-green-800 text-sm py-4">لا توجد منح مفتوحة حالياً.</div>
              )}
            </div>
          </div>

          {/* Upcoming Conferences */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-100 overflow-hidden">
            <div className="p-5 border-b border-orange-200/50">
              <h2 className="text-lg font-bold text-orange-900 flex items-center">
                <AcademicCapIcon className="w-5 h-5 ml-2" />
                مؤتمرات (Call for Papers)
              </h2>
            </div>
            <div className="p-5 space-y-4">
              {data?.conferences?.length > 0 ? (
                data.conferences.map((conf: any) => (
                  <div key={conf.id} className="bg-white rounded-lg p-4 shadow-sm border border-orange-100">
                    <h4 className="font-bold text-gray-900 mb-1">{conf.name_ar}</h4>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-1">{conf.description}</p>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-50">
                      <span className="text-xs font-medium text-red-600">
                        موعد الأوراق: {formatDateTime(conf.submission_deadline).split(" ")[0]}
                      </span>
                      <button className="text-sm text-orange-600 hover:text-orange-700 font-medium">
                        إرسال ورقة
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-orange-800 text-sm py-4">لا توجد مؤتمرات قادمة.</div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
