import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";

export interface SystemOverview {
  total_users: number;
  total_donations: number;
  active_campaigns: number;
  total_scholarships: number;
  pending_evaluations: number;
}

export interface ScholarshipStats {
  total_applications: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface InnovationStats {
  total_events: number;
  active_events: number;
  total_applications: number;
  pending_evaluations: number;
}

export interface FinanceStats {
  total_income: number;
  total_expense: number;
  net_balance: number;
}

export interface UserStats {
  total_users: number;
  active_users: number;
  verified_users: number;
}

export function useReports() {
  const [overview, setOverview] = useState<SystemOverview | null>(null);
  const [scholarships, setScholarships] = useState<ScholarshipStats | null>(null);
  const [innovation, setInnovation] = useState<InnovationStats | null>(null);
  const [finance, setFinance] = useState<FinanceStats | null>(null);
  const [users, setUsers] = useState<UserStats | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError("");
      try {
        const [ovRes, schRes, innRes, finRes, usrRes] = await Promise.all([
          apiClient.get("/reports/overview").catch(() => ({ data: null })),
          apiClient.get("/reports/scholarships").catch(() => ({ data: null })),
          apiClient.get("/reports/innovation").catch(() => ({ data: null })),
          apiClient.get("/reports/finance").catch(() => ({ data: null })),
          apiClient.get("/reports/users").catch(() => ({ data: null })),
        ]);

        if (ovRes.data) setOverview(ovRes.data);
        if (schRes.data) setScholarships(schRes.data);
        if (innRes.data) setInnovation(innRes.data);
        if (finRes.data) setFinance(finRes.data);
        if (usrRes.data) setUsers(usrRes.data);

      } catch (err: any) {
        setError("حدث خطأ أثناء تحميل التقارير.");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  return { overview, scholarships, innovation, finance, users, loading, error };
}
