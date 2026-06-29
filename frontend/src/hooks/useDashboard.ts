import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { toast } from "react-hot-toast";

export interface DashboardData {
  summary: {
    scholarships?: { pending: number; under_review: number; approved: number; rejected: number; total: number };
    innovation?: { open_events: number; pending_evaluations: number; total_applications: number };
    finance?: { total_income: number; total_expense: number; net_balance: number };
  };
  my_work: {
    assigned_cases: AssignedCase[];
    pending_tasks: PendingTask[];
  };
  alerts: DashboardAlert[];
  activities: DashboardAction[];
  health?: {
    database_status: string;
    redis_status: string;
    uptime_seconds: number;
  };
}

export interface AssignedCase {
  id: string;
  title: string;
  type: string;
  priority: string;
  status: string;
  applicant: string;
  created_at: string;
}

export interface PendingTask {
  id: string;
  title: string;
  description: string;
  type: string;
  due_date: string;
}

export interface DashboardAlert {
  id: string;
  type: "warning" | "danger" | "info";
  title: string;
  message: string;
  action_url?: string;
  created_at: string;
}

export interface DashboardAction {
  id: string;
  module: string;
  action: string;
  description: string;
  actor: string;
  created_at: string;
}

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await apiClient.get("/dashboard");
        setData(response.data);
      } catch (error: any) {
        toast.error("حدث خطأ أثناء تحميل بيانات لوحة التحكم");
        console.error("Dashboard fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  return { data, isLoading };
}
