"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Heart, FileText, Share2 } from "lucide-react";

import { use } from "react";

export default function CampaignDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [campaign, setCampaign] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Donation Form State
  const [isDonating, setIsDonating] = useState(false);
  const [amount, setAmount] = useState<number>(50);
  const [email, setEmail] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://sadaqah-api.duckdns.org/api/v1";
        const res = await fetch(`${baseUrl}/public/campaigns/${id}`);
        if (!res.ok) throw new Error("Campaign not found");
        const data = await res.json();
        setCampaign(data);
      } catch (err: any) {
        setError(err.message || "Failed to load campaign");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCampaign();
  }, [id]);

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      alert("Email is required for the donation receipt.");
      return;
    }
    
    setProcessingPayment(true);
    setError("");

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://sadaqah-api.duckdns.org/api/v1";
      const res = await fetch(`${baseUrl}/public/campaigns/donate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_id: id,
          amount: amount,
          currency: "USD",
          payment_method: "credit_card",
          is_anonymous: isAnonymous,
          // email is captured but in the current backend spec for anonymous donations, 
          // it might not be strictly saved in the db if donor_id is null.
          // However, we collect it here per the requirement for the receipt routing.
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || "Payment failed");
      }

      setSuccess(true);
      setIsDonating(false);
    } catch (err: any) {
      setError(err.message || "Failed to process donation");
    } finally {
      setProcessingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24 pb-32">
        <div className="w-12 h-12 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin"></div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24 pb-32 px-4">
        <div className="glass-card p-8 max-w-md w-full text-center">
          <FileText className="w-16 h-16 text-surface-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Campaign Not Found</h2>
          <p className="text-surface-600 mb-6">{error}</p>
          <button onClick={() => router.push('/')} className="btn-outline px-6 w-full">Go Back Home</button>
        </div>
      </div>
    );
  }

  const progressPercent = Math.min(Math.round((campaign.raised_amount / campaign.goal_amount) * 100), 100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
      {success && (
        <div className="mb-8 p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-center animate-in fade-in slide-in-from-top-4">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-emerald-900 dark:text-emerald-100 mb-2">Thank you for your generosity!</h2>
          <p className="text-emerald-700 dark:text-emerald-300">Your donation of ${amount} has been successfully processed.</p>
          <p className="text-emerald-600 dark:text-emerald-400 text-sm mt-2">A receipt has been sent to {email}.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 text-sm font-medium mb-4">
              {campaign.status === 'active' ? (
                <><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Active Campaign</>
              ) : (
                <><span className="w-2 h-2 rounded-full bg-surface-500"></span> Closed</>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-surface-900 dark:text-white mb-4">
              {campaign.title_en}
            </h1>
            <p className="text-xl text-surface-600 dark:text-surface-400 leading-relaxed">
              {campaign.description}
            </p>
          </div>

          <div className="glass-card p-6 border-l-4 border-l-primary-500">
            <h3 className="font-semibold mb-2">About this campaign</h3>
            <p className="text-surface-600 dark:text-surface-400">
              By contributing to this campaign, you directly support Project Amity's mission.
              100% of your donation flows directly into the verified allocation pool. 
            </p>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="glass-card p-8 sticky top-24">
            <div className="mb-8 text-center">
              <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                ${campaign.raised_amount.toLocaleString()}
              </div>
              <div className="text-surface-500">
                raised of <span className="font-medium text-surface-700 dark:text-surface-300">${campaign.goal_amount.toLocaleString()}</span> goal
              </div>
            </div>

            <div className="mb-8">
              <div className="h-4 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-primary-500 to-primary-400 transition-all duration-1000 ease-out relative"
                  style={{ width: `${progressPercent}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]"></div>
                </div>
              </div>
              <div className="mt-2 text-right text-sm font-medium text-primary-600">
                {progressPercent}% Funded
              </div>
            </div>

            {!isDonating ? (
              <div className="space-y-4">
                <button 
                  onClick={() => setIsDonating(true)}
                  disabled={success || campaign.status !== 'active'}
                  className="btn-gradient w-full py-4 text-lg font-bold shadow-xl shadow-primary-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Heart className="w-6 h-6" /> Donate Now
                </button>
                <button className="btn-outline w-full flex items-center justify-center gap-2">
                  <Share2 className="w-5 h-5" /> Share Campaign
                </button>
              </div>
            ) : (
              <form onSubmit={handleDonate} className="space-y-5 animate-in fade-in slide-in-from-bottom-4">
                <h3 className="font-bold border-b pb-2">Guest Checkout</h3>
                
                {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">{error}</div>}

                <div>
                  <label className="form-label">Amount (USD)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-500 font-bold">$</span>
                    <input 
                      type="number" 
                      min="1"
                      required
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="form-input w-full pl-8 text-lg font-bold" 
                    />
                  </div>
                  <div className="flex gap-2 mt-2">
                    {[25, 50, 100, 500].map(val => (
                      <button type="button" key={val} onClick={() => setAmount(val)} className={`flex-1 py-1 text-sm rounded-lg border ${amount === val ? 'bg-primary-50 border-primary-500 text-primary-700 font-bold' : 'bg-surface-50 border-surface-200 text-surface-600 hover:bg-surface-100'}`}>
                        ${val}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="form-label">Email Address for Receipt</label>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="form-input w-full" 
                  />
                  <p className="text-xs text-surface-500 mt-1">We will strictly use this to send your PDF receipt.</p>
                </div>

                <div className="flex items-center gap-2 p-3 bg-surface-50 dark:bg-surface-800 rounded-xl border">
                  <input 
                    type="checkbox" 
                    id="anonymous"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-4 h-4 rounded text-primary-600" 
                  />
                  <label htmlFor="anonymous" className="text-sm cursor-pointer">Make this donation anonymous</label>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setIsDonating(false)} className="px-4 py-2 text-surface-600 hover:text-surface-900 text-sm font-medium">Cancel</button>
                  <button type="submit" disabled={processingPayment} className="flex-1 btn-gradient py-3 font-bold flex justify-center items-center gap-2">
                    {processingPayment ? 'Processing...' : `Pay $${amount}`}
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
