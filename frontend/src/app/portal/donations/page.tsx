"use client";

import { useState } from "react";
import { Heart, Activity, HandHeart, CheckCircle2 } from "lucide-react";

const MOCK_CAMPAIGNS = [
  {
    id: "camp-001",
    title_en: "Emergency Student Relief Fund",
    description: "Supporting students who are facing sudden financial hardships with direct grants.",
    goal_amount: 50000,
    raised_amount: 32500,
    currency: "USD",
  },
  {
    id: "camp-002",
    title_en: "New Library Infrastructure",
    description: "Help us build the next-generation digital library for our researchers.",
    goal_amount: 120000,
    raised_amount: 15000,
    currency: "USD",
  }
];

export default function DonationsDashboard() {
  const [campaigns] = useState(MOCK_CAMPAIGNS);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [donationAmount, setDonationAmount] = useState<string>("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleDonate = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call to local gateway
    setTimeout(() => {
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
    }, 1000);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Donations & Campaigns</h1>
          <p className="text-surface-600 dark:text-surface-400 mt-2 max-w-2xl">
            Support the academic and social initiatives of the university. Your contributions empower the next generation.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-500" /> Active Campaigns
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {campaigns.map((camp) => {
              const progress = Math.min((camp.raised_amount / camp.goal_amount) * 100, 100);
              
              return (
                <div 
                  key={camp.id} 
                  className={`glass-card p-6 cursor-pointer transition-all ${
                    selectedCampaign === camp.id ? 'ring-2 ring-primary-500 shadow-lg shadow-primary-500/20' : 'hover:shadow-xl'
                  }`}
                  onClick={() => setSelectedCampaign(camp.id)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-rose-100 dark:bg-rose-900/30 rounded-xl text-rose-600 dark:text-rose-400">
                      <Heart className="w-6 h-6" />
                    </div>
                  </div>
                  <h3 className="font-bold text-lg mb-2 line-clamp-1">{camp.title_en}</h3>
                  <p className="text-sm text-surface-500 mb-6 line-clamp-2 h-10">{camp.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span>${camp.raised_amount.toLocaleString()}</span>
                      <span className="text-surface-500">Goal: ${camp.goal_amount.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-rose-400 to-rose-600 rounded-full"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="glass-card p-6 sticky top-24 border-t-4 border-t-rose-500">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <HandHeart className="w-5 h-5 text-rose-500" /> Make a Donation
            </h2>

            {isSuccess ? (
              <div className="py-8 flex flex-col items-center justify-center text-center animate-in zoom-in">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">Thank You!</h3>
                <p className="text-surface-600 dark:text-surface-400 text-sm">Your generous donation has been processed successfully.</p>
              </div>
            ) : (
              <form onSubmit={handleDonate} className="space-y-5">
                <div>
                  <label className="text-sm font-medium mb-1 block">Select Campaign</label>
                  <select 
                    className="form-input w-full"
                    value={selectedCampaign || ""}
                    onChange={(e) => setSelectedCampaign(e.target.value)}
                    required
                  >
                    <option value="" disabled>-- Choose a cause --</option>
                    {campaigns.map(c => <option key={c.id} value={c.id}>{c.title_en}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Amount (USD)</label>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {["50", "100", "500"].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setDonationAmount(amt)}
                        className={`py-2 text-sm rounded-lg border transition-all ${
                          donationAmount === amt 
                            ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20' 
                            : 'border-surface-200 dark:border-surface-700 hover:border-rose-500'
                        }`}
                      >
                        ${amt}
                      </button>
                    ))}
                  </div>
                  <input 
                    type="number" 
                    placeholder="Custom amount" 
                    className="form-input w-full"
                    value={donationAmount}
                    onChange={(e) => setDonationAmount(e.target.value)}
                    required
                    min="1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Payment Method</label>
                  <select className="form-input w-full">
                    <option value="card">Credit/Debit Card (Mock Gateway)</option>
                    <option value="bank">Bank Transfer</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-surface-200 dark:border-surface-700">
                  <button 
                    type="submit" 
                    className="w-full py-3 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-xl font-bold shadow-lg shadow-rose-500/25 transition-all"
                    disabled={!selectedCampaign || !donationAmount}
                  >
                    Donate ${donationAmount || "0"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
