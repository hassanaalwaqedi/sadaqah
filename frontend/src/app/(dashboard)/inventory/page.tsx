"use client";

import { useState } from "react";
import { CubeIcon, QrCodeIcon, MapPinIcon, CheckBadgeIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

const MOCK_ASSETS = [
  {
    id: "a-001",
    asset_tag: "IT-LAP-2024-001",
    name: "MacBook Pro 16\" (M3 Max)",
    condition: "new",
    location: "IT Storage Room A",
    purchase_cost: 3499.00
  },
  {
    id: "a-002",
    asset_tag: "LAB-MIC-001",
    name: "Electron Microscope Zeiss",
    condition: "good",
    location: "Biology Lab 304",
    purchase_cost: 45000.00
  },
  {
    id: "a-003",
    asset_tag: "FURN-CHR-089",
    name: "Ergonomic Office Chair",
    condition: "poor",
    location: "Faculty Office 211",
    purchase_cost: 250.00
  }
];

export default function InventoryDashboard() {
  const [assets] = useState(MOCK_ASSETS);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Inventory & Assets</h1>
          <p className="text-surface-600 dark:text-surface-400 mt-1">
            Track IT equipment, lab machinery, furniture, and maintain their condition.
          </p>
        </div>
        <button className="btn-gradient px-4 py-2 flex items-center gap-2">
          <QrCodeIcon className="w-5 h-5" /> Scan Asset
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-50 dark:bg-surface-800/50 text-surface-600 dark:text-surface-400 border-b">
            <tr>
              <th className="px-6 py-4 font-medium">Asset Details</th>
              <th className="px-6 py-4 font-medium">Location</th>
              <th className="px-6 py-4 font-medium">Condition</th>
              <th className="px-6 py-4 font-medium text-right">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
            {assets.map((asset) => (
              <tr key={asset.id} className="hover:bg-surface-50 dark:hover:bg-surface-800/20 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-surface-100 dark:bg-surface-800 rounded-xl text-surface-500">
                      <CubeIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-surface-900 dark:text-white">{asset.name}</p>
                      <p className="text-xs text-surface-500 font-mono mt-1 flex items-center gap-1">
                        <QrCodeIcon className="w-3 h-3" /> {asset.asset_tag}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-surface-600 dark:text-surface-400">
                    <MapPinIcon className="w-4 h-4 text-primary-500" />
                    {asset.location}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {asset.condition === 'new' && <CheckBadgeIcon className="w-5 h-5 text-emerald-500" />}
                    {asset.condition === 'good' && <CheckBadgeIcon className="w-5 h-5 text-blue-500" />}
                    {asset.condition === 'poor' && <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />}
                    <span className="capitalize font-medium">{asset.condition}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right font-mono font-medium text-surface-700 dark:text-surface-300">
                  ${asset.purchase_cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
