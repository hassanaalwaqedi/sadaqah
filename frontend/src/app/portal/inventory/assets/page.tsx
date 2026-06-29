"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon, PlusIcon, QrCodeIcon } from "@heroicons/react/24/outline";

interface Asset {
  id: string;
  asset_number: string;
  name_en: string;
  category: { name_en: string } | null;
  location: { name_en: string } | null;
  status: string;
  current_value: number;
}

export default function AssetList() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const response = await apiClient.get("/assets");
        setAssets(response.data || []);
      } catch (error) {
        toast.error("Failed to load assets");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAssets();
  }, []);

  const filteredAssets = assets.filter((a) =>
    (a.name_en?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    (a.asset_number?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Asset Register</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            View and manage all enterprise assets in the system.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/portal/inventory/assets/new" className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-md transition-all">
            <PlusIcon className="w-5 h-5" />
            New Asset
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-sm border border-gray-100 dark:border-surface-700 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-surface-700 flex flex-col md:flex-row gap-4 items-center justify-between bg-gray-50 dark:bg-surface-800/50">
          <div className="relative w-full md:max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or ID..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-900 focus:ring-2 focus:ring-primary-500 transition-shadow"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-surface-900 border border-gray-200 dark:border-surface-600 rounded-xl hover:bg-gray-50 dark:hover:bg-surface-700 transition-colors">
            <AdjustmentsHorizontalIcon className="w-5 h-5" />
            Filters
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-surface-700/30 text-gray-500 dark:text-gray-400 text-sm">
                <th className="p-4 font-medium border-b border-gray-100 dark:border-surface-700">Asset</th>
                <th className="p-4 font-medium border-b border-gray-100 dark:border-surface-700">Category</th>
                <th className="p-4 font-medium border-b border-gray-100 dark:border-surface-700">Location</th>
                <th className="p-4 font-medium border-b border-gray-100 dark:border-surface-700">Status</th>
                <th className="p-4 font-medium border-b border-gray-100 dark:border-surface-700">Value</th>
                <th className="p-4 font-medium border-b border-gray-100 dark:border-surface-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-surface-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">Loading assets...</td>
                </tr>
              ) : filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">No assets found matching your criteria.</td>
                </tr>
              ) : (
                filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50 dark:hover:bg-surface-700/50 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400">
                          <QrCodeIcon className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{asset.name_en}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{asset.asset_number}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600 dark:text-gray-300">
                      {asset.category?.name_en || "N/A"}
                    </td>
                    <td className="p-4 text-gray-600 dark:text-gray-300">
                      {asset.location?.name_en || "Unassigned"}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        asset.status === 'available' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        asset.status === 'assigned' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                        asset.status === 'maintenance' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                      }`}>
                        {asset.status.charAt(0).toUpperCase() + asset.status.slice(1)}
                      </span>
                    </td>
                    <td className="p-4 text-gray-900 dark:text-white font-medium">
                      ${asset.current_value?.toLocaleString() || "0"}
                    </td>
                    <td className="p-4 text-right">
                      <button className="text-primary-600 hover:text-primary-700 font-medium text-sm">View Details</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
