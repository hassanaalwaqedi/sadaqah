"use client";

import { useState, useEffect } from "react";
import { Heart, Activity, HandHeart, CheckCircle2, AlertCircle, Plus, FileText, ArrowRightLeft } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";

export default function DonationsDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("campaigns");
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [allDonations, setAllDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [donationAmount, setDonationAmount] = useState<string>("");
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("credit_card");
  const [createdDonation, setCreatedDonation] = useState<any>(null);
  
  // Bank Transfer Receipt Upload
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [receiptSuccess, setReceiptSuccess] = useState(false);
  // Allocation form state
  const [allocatingDonation, setAllocatingDonation] = useState<any | null>(null);
  const [allocationData, setAllocationData] = useState({ program: '', amount: 0, notes: '' });

  // Verification form state
  const [verifyingDonation, setVerifyingDonation] = useState<any | null>(null);
  const [verifyStatus, setVerifyStatus] = useState("approved");
  const [financeNotes, setFinanceNotes] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const campRes = await apiClient.get('/donations/campaigns');
      if (campRes.data) {
        setCampaigns(campRes.data);
      }
      
      const histRes = await apiClient.get('/donations/history');
      if (histRes.data) {
        setHistory(histRes.data);
      }

      if (user?.roles?.some(r => ['super_admin', 'financial_officer'].includes(r.name))) {
        const allRes = await apiClient.get('/donations/all');
        if (allRes.data) {
          setAllDonations(allRes.data);
        }
      }
    } catch (error) {
      console.error("Failed to fetch donations data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocatingDonation) return;
    try {
      await apiClient.post(`/donations/${allocatingDonation.id}/allocate`, {
        program: allocationData.program,
        amount: allocationData.amount,
        notes: allocationData.notes,
        status: "allocated"
      });
      setAllocatingDonation(null);
      fetchData();
    } catch (error) {
      console.error("Allocation failed", error);
      alert("حدث خطأ أثناء التخصيص");
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyingDonation) return;
    try {
      await apiClient.put(`/donations/${verifyingDonation.id}/verify`, {
        status: verifyStatus,
        finance_notes: financeNotes
      });
      setVerifyingDonation(null);
      fetchData();
    } catch (error) {
      console.error("Verification failed", error);
      alert("حدث خطأ أثناء المراجعة");
    }
  };

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign || !donationAmount) return;
    
    setSubmitting(true);
    try {
      const res = await apiClient.post('/public/donations/process', {
        campaign_id: selectedCampaign,
        donor_email: user?.email || "anonymous@example.com",
        amount: parseFloat(donationAmount),
        currency: "USD",
        payment_method: paymentMethod,
        is_anonymous: false,
        donation_type: "General",
        notes: ""
      });
      setCreatedDonation(res.data);
      setIsSuccess(true);
      setDonationAmount("");
      setSelectedCampaign(null);
      fetchData(); // Refresh history
      if (paymentMethod === "credit_card") {
        setTimeout(() => setIsSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Donation failed", error);
      alert("حدث خطأ أثناء معالجة التبرع");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadReceipt = async () => {
    if (!receiptFile || !createdDonation) return;
    setUploadingReceipt(true);
    try {
      // 1. Get Presigned URL
      const presignedRes = await apiClient.post('/files/presigned-url', {
        filename: receiptFile.name,
        content_type: receiptFile.type,
        file_size: receiptFile.size
      });
      
      const { url, object_name } = presignedRes.data;

      // 2. Upload to MinIO directly
      await fetch(url, {
        method: 'PUT',
        body: receiptFile,
        headers: { 'Content-Type': receiptFile.type }
      });

      // 3. Notify Backend
      await apiClient.post(`/donations/${createdDonation.id}/receipt`, {
        receipt_file_obj: object_name,
        transfer_date: new Date().toISOString(),
        bank_name: "مجهول"
      });

      setReceiptSuccess(true);
      fetchData();
      setTimeout(() => {
        setIsSuccess(false);
        setReceiptSuccess(false);
        setActiveTab("history");
      }, 3000);
    } catch (err) {
      console.error("Upload failed", err);
      alert("حدث خطأ أثناء رفع الإيصال");
    } finally {
      setUploadingReceipt(false);
    }
  };

  const isFinanceAdmin = user?.roles?.some(r => ['super_admin', 'financial_officer'].includes(r.name));

  return (
    <div className="space-y-8" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">نظام إدارة التبرعات والمانحين</h1>
          <p className="text-surface-600 dark:text-surface-400 mt-2">
            منصة متكاملة لإدارة التبرعات، متابعة الحملات، وتوثيق سجلات المانحين بشفافية كاملة.
          </p>
        </div>
        {isFinanceAdmin && (
          <Link href="/portal/donations/campaigns/create" className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            حملة جديدة
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-surface-200 dark:border-surface-800 pb-px">
        <button
          onClick={() => setActiveTab("campaigns")}
          className={`pb-3 px-1 font-medium border-b-2 transition-colors ${
            activeTab === "campaigns" 
              ? "border-primary-500 text-primary-600 dark:text-primary-400" 
              : "border-transparent text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
          }`}
        >
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            الحملات النشطة
          </div>
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`pb-3 px-1 font-medium border-b-2 transition-colors ${
            activeTab === "history" 
              ? "border-primary-500 text-primary-600 dark:text-primary-400" 
              : "border-transparent text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
          }`}
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            سجل تبرعاتي
          </div>
        </button>
        <button
          onClick={() => setActiveTab("donate")}
          className={`pb-3 px-1 font-medium border-b-2 transition-colors ${
            activeTab === "donate" 
              ? "border-primary-500 text-primary-600 dark:text-primary-400" 
              : "border-transparent text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
          }`}
        >
          <div className="flex items-center gap-2">
            <HandHeart className="w-4 h-4" />
            تبرع الآن
          </div>
        </button>
        {isFinanceAdmin && (
          <button
            onClick={() => setActiveTab("allocations")}
            className={`pb-3 px-1 font-medium border-b-2 transition-colors ${
              activeTab === "allocations" 
                ? "border-primary-500 text-primary-600 dark:text-primary-400" 
                : "border-transparent text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              الإدارة والتخصيص
            </div>
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="min-h-[400px]">
          {/* Campaigns Tab */}
          {activeTab === "campaigns" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.length === 0 ? (
                <div className="col-span-full py-12 text-center text-surface-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>لا توجد حملات نشطة حالياً.</p>
                </div>
              ) : (
                campaigns.map((camp: any) => {
                  const progress = Math.min((camp.raised_amount / camp.goal_amount) * 100, 100);
                  return (
                    <div key={camp.id} className="card p-6 flex flex-col hover:border-primary-500 transition-colors">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-bold">{camp.title_ar || camp.title_en}</h3>
                        <span className="badge badge-success shrink-0">{camp.status}</span>
                      </div>
                      
                      <p className="text-surface-600 dark:text-surface-400 text-sm mb-6 flex-grow">
                        {camp.description}
                      </p>

                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1 font-medium">
                            <span>تم جمع: {camp.raised_amount.toLocaleString()} {camp.currency}</span>
                            <span>الهدف: {camp.goal_amount.toLocaleString()} {camp.currency}</span>
                          </div>
                          <div className="h-2 w-full bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full transition-all duration-1000"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <p className="text-xs text-right mt-1 text-surface-500">{progress.toFixed(1)}%</p>
                        </div>

                        <button 
                          onClick={() => {
                            setSelectedCampaign(camp.id);
                            setActiveTab("donate");
                          }}
                          className="w-full btn-primary flex justify-center items-center gap-2"
                        >
                          <Heart className="w-4 h-4" />
                          المساهمة في الحملة
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === "history" && (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="border-b border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/50">
                      <th className="px-6 py-4 text-sm font-semibold text-surface-600 dark:text-surface-300">رقم المرجع</th>
                      <th className="px-6 py-4 text-sm font-semibold text-surface-600 dark:text-surface-300">التاريخ</th>
                      <th className="px-6 py-4 text-sm font-semibold text-surface-600 dark:text-surface-300">المبلغ</th>
                      <th className="px-6 py-4 text-sm font-semibold text-surface-600 dark:text-surface-300">الحالة</th>
                      <th className="px-6 py-4 text-sm font-semibold text-surface-600 dark:text-surface-300">النوع</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-200 dark:divide-surface-800">
                    {history.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-surface-500">
                          لا يوجد سجل تبرعات حتى الآن.
                        </td>
                      </tr>
                    ) : (
                      history.map((donation: any) => (
                        <tr key={donation.id} className="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium">{donation.id.substring(0, 8).toUpperCase()}</td>
                          <td className="px-6 py-4 text-sm text-surface-600 dark:text-surface-400">
                            {new Date(donation.donated_at).toLocaleDateString('ar-SA')}
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-success-600 dark:text-success-400">
                            {donation.amount.toLocaleString()} {donation.currency}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`badge ${
                              donation.status === 'completed' || donation.status === 'approved' ? 'badge-success' : 
                              donation.status === 'rejected' || donation.status === 'failed' ? 'badge-error' :
                              'badge-warning'
                            }`}>
                              {donation.status === 'completed' || donation.status === 'approved' ? 'مكتمل' :
                               donation.status === 'pending_verification' ? 'قيد المراجعة' :
                               donation.status === 'waiting_transfer' ? 'بانتظار التحويل' :
                               donation.status === 'need_info' ? 'مطلوب معلومات' :
                               donation.status === 'rejected' ? 'مرفوض' : donation.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-surface-600 dark:text-surface-400">
                            {donation.donation_type}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Donate Tab */}
          {activeTab === "donate" && (
            <div className="max-w-xl mx-auto">
              <div className="card p-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <HandHeart className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold">نموذج التبرع السريع</h2>
                  <p className="text-surface-500 mt-2">مساهمتك تصنع الفارق في حياة المستفيدين</p>
                </div>

                {isSuccess ? (
                  <div className="text-center py-8 animate-in zoom-in duration-300">
                    <CheckCircle2 className="w-20 h-20 text-success-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-success-600 mb-2">
                      {paymentMethod === 'bank_transfer' ? 'تم تسجيل طلب التبرع' : 'شكراً لعطائك!'}
                    </h3>
                    <p className="text-surface-600 mb-6">
                      {paymentMethod === 'bank_transfer' 
                        ? 'يرجى إتمام التحويل البنكي ورفع إيصال الدفع لاستكمال التبرع.' 
                        : 'تم استلام تبرعك بنجاح. سيتم إرسال إيصال التبرع إلى بريدك الإلكتروني.'}
                    </p>

                    {paymentMethod === 'bank_transfer' && createdDonation && !receiptSuccess && (
                      <div className="bg-surface-50 dark:bg-surface-800/50 rounded-xl p-6 border border-surface-200 dark:border-surface-800 text-right mb-6">
                        <div className="mb-4 pb-4 border-b border-surface-200 dark:border-surface-800">
                          <p className="text-sm text-surface-500 mb-1">رقم المرجع (يجب إرفاقه في تفاصيل التحويل):</p>
                          <p className="font-mono text-xl font-bold tracking-wider text-primary-600 dark:text-primary-400">
                            {createdDonation.reference_number || `DON-${createdDonation.id.substring(0,8).toUpperCase()}`}
                          </p>
                        </div>
                        
                        <div className="mb-6 space-y-2">
                          <p className="text-sm font-semibold">تفاصيل الحساب البنكي لجمعية الصداقة:</p>
                          <p className="text-sm">البنك: بنك التنمية الإسلامي</p>
                          <p className="text-sm">رقم الحساب: SA00 0000 0000 0000 0000 0000</p>
                        </div>

                        <div className="space-y-4">
                          <label className="block text-sm font-medium">رفع إيصال التحويل (PDF, JPG, PNG)</label>
                          <input 
                            type="file" 
                            accept=".pdf,image/png,image/jpeg,image/jpg"
                            className="input-field cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                            onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                          />
                          <button 
                            className="btn-primary w-full flex justify-center items-center gap-2"
                            onClick={handleUploadReceipt}
                            disabled={!receiptFile || uploadingReceipt}
                          >
                            {uploadingReceipt ? (
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <>
                                <FileText className="w-4 h-4" />
                                إرسال الإيصال
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {receiptSuccess && (
                      <div className="p-4 bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-400 rounded-lg mb-6">
                        تم استلام الإيصال بنجاح. سيقوم فريق المالية بمراجعته قريباً.
                      </div>
                    )}

                    {(!createdDonation || paymentMethod === 'credit_card' || receiptSuccess) && (
                      <button 
                        onClick={() => {
                          setIsSuccess(false);
                          setReceiptSuccess(false);
                          setActiveTab("history");
                        }}
                        className="btn-outline mt-6"
                      >
                        عرض السجل
                      </button>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleDonate} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">اختر الحملة</label>
                      <select 
                        className="input-field"
                        value={selectedCampaign || ""}
                        onChange={(e) => setSelectedCampaign(e.target.value)}
                        required
                      >
                        <option value="" disabled>-- الرجاء اختيار حملة --</option>
                        {campaigns.map((c: any) => (
                          <option key={c.id} value={c.id}>{c.title_ar || c.title_en}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">مبلغ التبرع (USD)</label>
                      <div className="grid grid-cols-4 gap-3 mb-3">
                        {[50, 100, 500, 1000].map(amt => (
                          <button
                            key={amt}
                            type="button"
                            className={`py-2 rounded-lg border text-sm font-medium transition-colors ${
                              donationAmount === amt.toString() 
                                ? "bg-primary-50 border-primary-500 text-primary-700 dark:bg-primary-900/20 dark:border-primary-500 dark:text-primary-400" 
                                : "border-surface-200 dark:border-surface-700 hover:border-primary-300"
                            }`}
                            onClick={() => setDonationAmount(amt.toString())}
                          >
                            ${amt}
                          </button>
                        ))}
                      </div>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-500 font-medium">$</span>
                        <input 
                          type="number" 
                          min="1"
                          step="0.01"
                          className="input-field pl-10"
                          placeholder="مبلغ آخر..."
                          value={donationAmount}
                          onChange={(e) => setDonationAmount(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-3">طريقة الدفع</label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                            paymentMethod === "credit_card"
                              ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                              : "border-surface-200 dark:border-surface-800 hover:border-primary-300"
                          }`}
                          onClick={() => setPaymentMethod("credit_card")}
                        >
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                          <span className="font-semibold">بطاقة ائتمان</span>
                        </button>
                        <button
                          type="button"
                          className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                            paymentMethod === "bank_transfer"
                              ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                              : "border-surface-200 dark:border-surface-800 hover:border-primary-300"
                          }`}
                          onClick={() => setPaymentMethod("bank_transfer")}
                        >
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>
                          <span className="font-semibold">تحويل بنكي</span>
                        </button>
                      </div>
                    </div>

                    {paymentMethod === "credit_card" && (
                      <div className="p-4 bg-surface-50 dark:bg-surface-800/50 rounded-xl border border-surface-200 dark:border-surface-800 space-y-4 animate-in slide-in-from-top-4 duration-300">
                        <h4 className="font-semibold text-sm">بيانات الدفع (للتجربة)</h4>
                        <div className="space-y-3">
                          <input type="text" className="input-field" placeholder="اسم حامل البطاقة" />
                          <input type="text" className="input-field" placeholder="رقم البطاقة (0000 0000 0000 0000)" />
                          <div className="flex gap-3">
                            <input type="text" className="input-field" placeholder="MM/YY" />
                            <input type="text" className="input-field" placeholder="CVC" />
                          </div>
                        </div>
                      </div>
                    )}

                    <button 
                      type="submit" 
                      disabled={submitting}
                      className="w-full btn-primary h-12 text-lg font-bold flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          إتمام التبرع
                          <ArrowRightLeft className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Allocations Tab (Admin) */}
          {activeTab === "allocations" && isFinanceAdmin && (
            <div className="space-y-6">
              {verifyingDonation ? (
                <div className="card p-6 max-w-xl mx-auto border-warning-200 dark:border-warning-800 border-2">
                  <h3 className="text-xl font-bold mb-4">مراجعة التحويل البنكي #{verifyingDonation.reference_number || verifyingDonation.id.substring(0,8)}</h3>
                  <div className="mb-6 p-4 bg-surface-50 dark:bg-surface-800/50 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-surface-500">المبلغ المُصرح:</span>
                      <span className="font-bold text-success-600">{verifyingDonation.amount} {verifyingDonation.currency}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-surface-500">البنك المُحول:</span>
                      <span>{verifyingDonation.bank_name || "غير محدد"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-surface-500">تاريخ التحويل:</span>
                      <span>{verifyingDonation.transfer_date ? new Date(verifyingDonation.transfer_date).toLocaleDateString('ar-SA') : "غير محدد"}</span>
                    </div>
                    {verifyingDonation.receipt_file_obj && (
                      <div className="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700">
                        <span className="text-sm font-medium block mb-2">إيصال التحويل المرفوع:</span>
                        <a href={`http://localhost:9000/sadaqah-files/${verifyingDonation.receipt_file_obj}`} target="_blank" rel="noopener noreferrer" className="btn-outline w-full flex justify-center items-center gap-2 text-sm">
                          <FileText className="w-4 h-4" /> عرض الإيصال
                        </a>
                      </div>
                    )}
                  </div>
                  <form onSubmit={handleVerify} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">قرار المراجعة</label>
                      <div className="grid grid-cols-3 gap-3">
                        <button type="button" onClick={() => setVerifyStatus("approved")} className={`py-2 rounded-lg border text-sm font-bold ${verifyStatus === "approved" ? "bg-success-50 border-success-500 text-success-700" : "border-surface-200"}`}>قبول</button>
                        <button type="button" onClick={() => setVerifyStatus("need_info")} className={`py-2 rounded-lg border text-sm font-bold ${verifyStatus === "need_info" ? "bg-warning-50 border-warning-500 text-warning-700" : "border-surface-200"}`}>طلب معلومات</button>
                        <button type="button" onClick={() => setVerifyStatus("rejected")} className={`py-2 rounded-lg border text-sm font-bold ${verifyStatus === "rejected" ? "bg-error-50 border-error-500 text-error-700" : "border-surface-200"}`}>رفض</button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">ملاحظات الإدارة المالية</label>
                      <textarea 
                        className="input-field min-h-[100px]"
                        value={financeNotes}
                        onChange={(e) => setFinanceNotes(e.target.value)}
                        placeholder="أدخل سبب الرفض أو المعلومات الإضافية المطلوبة..."
                      />
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button type="submit" className="btn-primary flex-1">حفظ القرار</button>
                      <button type="button" className="btn-outline flex-1" onClick={() => setVerifyingDonation(null)}>إلغاء</button>
                    </div>
                  </form>
                </div>
              ) : allocatingDonation ? (
                <div className="card p-6 max-w-xl mx-auto">
                  <h3 className="text-xl font-bold mb-4">تخصيص التبرع #{allocatingDonation.id.substring(0,8)}</h3>
                  <div className="mb-6 p-4 bg-surface-50 dark:bg-surface-800/50 rounded-lg">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-surface-500">المبلغ:</span>
                      <span className="font-bold text-success-600">{allocatingDonation.amount} {allocatingDonation.currency}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-surface-500">النوع:</span>
                      <span>{allocatingDonation.donation_type}</span>
                    </div>
                  </div>
                  <form onSubmit={handleAllocate} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">البرنامج / المصرف</label>
                      <select 
                        className="input-field"
                        value={allocationData.program}
                        onChange={(e) => setAllocationData({...allocationData, program: e.target.value})}
                        required
                      >
                        <option value="" disabled>اختر البرنامج</option>
                        <option value="scholarships">المنح الدراسية</option>
                        <option value="housing">السكن الطلابي</option>
                        <option value="innovation">مسابقات الابتكار</option>
                        <option value="general">دعم عام</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">المبلغ المخصص</label>
                      <input 
                        type="number" 
                        max={allocatingDonation.amount}
                        className="input-field"
                        value={allocationData.amount}
                        onChange={(e) => setAllocationData({...allocationData, amount: parseFloat(e.target.value)})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">ملاحظات التخصيص</label>
                      <textarea 
                        className="input-field min-h-[100px]"
                        value={allocationData.notes}
                        onChange={(e) => setAllocationData({...allocationData, notes: e.target.value})}
                      />
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button type="submit" className="btn-primary flex-1">حفظ التخصيص</button>
                      <button type="button" className="btn-outline flex-1" onClick={() => setAllocatingDonation(null)}>إلغاء</button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right">
                      <thead>
                        <tr className="border-b border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/50">
                          <th className="px-6 py-4 text-sm font-semibold text-surface-600 dark:text-surface-300">المرجع</th>
                          <th className="px-6 py-4 text-sm font-semibold text-surface-600 dark:text-surface-300">التاريخ</th>
                          <th className="px-6 py-4 text-sm font-semibold text-surface-600 dark:text-surface-300">المبلغ</th>
                          <th className="px-6 py-4 text-sm font-semibold text-surface-600 dark:text-surface-300">حالة التبرع</th>
                          <th className="px-6 py-4 text-sm font-semibold text-surface-600 dark:text-surface-300">حالة التخصيص</th>
                          <th className="px-6 py-4 text-sm font-semibold text-surface-600 dark:text-surface-300">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-200 dark:divide-surface-800">
                        {allDonations.map((donation: any) => (
                          <tr key={donation.id} className="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                            <td className="px-6 py-4 text-sm font-medium">{donation.reference_number || donation.id.substring(0, 8).toUpperCase()}</td>
                            <td className="px-6 py-4 text-sm text-surface-600 dark:text-surface-400">
                              {new Date(donation.donated_at || donation.created_at).toLocaleDateString('ar-SA')}
                            </td>
                            <td className="px-6 py-4 text-sm font-bold text-success-600 dark:text-success-400">
                              {donation.amount.toLocaleString()} {donation.currency}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`badge ${
                                donation.status === 'completed' || donation.status === 'approved' ? 'badge-success' : 
                                donation.status === 'rejected' || donation.status === 'failed' ? 'badge-error' :
                                'badge-warning'
                              }`}>
                                {donation.status === 'completed' || donation.status === 'approved' ? 'مكتمل' :
                                 donation.status === 'pending_verification' ? 'يجب مراجعته' :
                                 donation.status === 'waiting_transfer' ? 'بانتظار التحويل' :
                                 donation.status === 'need_info' ? 'مطلوب معلومات' :
                                 donation.status === 'rejected' ? 'مرفوض' : donation.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {donation.allocation_status === 'allocated' ? (
                                <span className="badge badge-success">مخصص</span>
                              ) : (
                                <span className="badge badge-warning">قيد الانتظار</span>
                              )}
                            </td>
                            <td className="px-6 py-4 flex gap-2">
                              {donation.status === 'pending_verification' && (
                                <button 
                                  className="text-warning-600 hover:underline text-sm font-bold"
                                  onClick={() => {
                                    setVerifyingDonation(donation);
                                    setVerifyStatus("approved");
                                    setFinanceNotes(donation.finance_notes || "");
                                  }}
                                >
                                  مراجعة الإيصال
                                </button>
                              )}
                              {donation.allocation_status !== 'allocated' && (donation.status === 'completed' || donation.status === 'approved') && (
                                <button 
                                  className="text-primary-600 hover:underline text-sm font-medium"
                                  onClick={() => {
                                    setAllocatingDonation(donation);
                                    setAllocationData({...allocationData, amount: donation.amount});
                                  }}
                                >
                                  تخصيص
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
