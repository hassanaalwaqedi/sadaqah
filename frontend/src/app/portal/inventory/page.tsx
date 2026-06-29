"use client";

import { useState, useEffect } from "react";
import { 
  CubeIcon, 
  QrCodeIcon, 
  MapPinIcon, 
  ExclamationTriangleIcon, 
  BanknotesIcon, 
  WrenchScrewdriverIcon, 
  BuildingOffice2Icon, 
  PlusIcon,
  CheckBadgeIcon
} from "@heroicons/react/24/outline";
import { apiClient } from "@/lib/api-client";
import { toast } from "react-hot-toast";
import Link from "next/link";

interface DashboardStats {
  total_assets: number;
  active_assets: number;
  maintenance_assets: number;
  assigned_assets: number;
  total_value: number;
}

export default function InventoryDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiClient.get("/assets/dashboard");
        setStats(response.data);
      } catch (error) {
        console.error("Failed to load inventory stats", error);
        toast.error("حدث خطأ أثناء تحميل بيانات الأصول");
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <CubeIcon className="w-8 h-8 text-primary-600" />
            Enterprise Asset Management
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Track physical assets, consumables, locations, and maintenance records.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-surface-800 border border-gray-300 dark:border-surface-700 rounded-xl hover:bg-gray-50 dark:hover:bg-surface-700 transition-colors shadow-sm">
            <QrCodeIcon className="w-5 h-5" />
            Scan QR Code
          </button>
          <Link href="/portal/inventory/assets" className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-all shadow-md hover:shadow-lg">
            <PlusIcon className="w-5 h-5" />
            Register Asset
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-surface-200 dark:bg-surface-800 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-surface-700 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Assets</p>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.total_assets || 0}</h3>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <CubeIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="mt-4 text-sm text-green-600 flex items-center gap-1">
              Active: {stats?.active_assets || 0}
            </p>
          </div>

          <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-surface-700 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Assigned Custody</p>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.assigned_assets || 0}</h3>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                <BuildingOffice2Icon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="mt-4 text-sm text-purple-600">Assets currently assigned to staff</p>
          </div>

          <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-surface-700 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Under Maintenance</p>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.maintenance_assets || 0}</h3>
              </div>
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                <WrenchScrewdriverIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <p className="mt-4 text-sm text-orange-600">Assets requiring attention</p>
          </div>

          <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-surface-700 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Asset Value</p>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white">${stats?.total_value?.toLocaleString() || 0}</h3>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                <BanknotesIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <p className="mt-4 text-sm text-emerald-600">Estimated current value</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-surface-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ExclamationTriangleIcon className="w-6 h-6 text-orange-500" />
              Maintenance Alerts
            </h2>
            <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">View All</button>
          </div>
          <div className="flex flex-col items-center justify-center h-48 text-gray-500 dark:text-gray-400 text-center">
            <CheckBadgeIcon className="w-12 h-12 text-emerald-500 mb-3 opacity-50" />
            <p>No urgent maintenance required.</p>
            <p className="text-sm opacity-75">All assets are in good condition.</p>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-surface-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <MapPinIcon className="w-6 h-6 text-primary-500" />
              Top Locations
            </h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-surface-700/50 rounded-xl">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Headquarters</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Head Office</p>
              </div>
              <span className="bg-white dark:bg-surface-800 px-3 py-1 rounded-full text-sm font-medium border border-gray-200 dark:border-surface-600">
                120 Assets
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-surface-700/50 rounded-xl">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Istanbul Student Dormitory</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Housing</p>
              </div>
              <span className="bg-white dark:bg-surface-800 px-3 py-1 rounded-full text-sm font-medium border border-gray-200 dark:border-surface-600">
                450 Assets
              </span>
            </div>
          </div>
          <Link href="/portal/inventory/locations" className="mt-4 block text-center w-full py-3 bg-gray-50 dark:bg-surface-700 hover:bg-gray-100 dark:hover:bg-surface-600 text-gray-900 dark:text-white font-medium rounded-xl transition-colors">
            Manage Locations
          </Link>
        </div>
      </div>
    </div>
  );
}
