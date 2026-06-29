import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/providers/auth-provider";
import { apiClient, API_BASE_URL } from "@/lib/api-client";

export interface Notification {
  id: string;
  type: string;
  priority: "info" | "success" | "warning" | "urgent" | "critical";
  title: string;
  message: string;
  link?: string;
  read_at?: string | null;
  created_at: string;
  metadata?: any;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  const fetchInitial = useCallback(async () => {
    try {
      const res = await apiClient.get("/notifications?limit=50");
      setNotifications(res.data.notifications || []);
      setUnreadCount(
        (res.data.notifications || []).filter((n: Notification) => !n.read_at).length
      );
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    fetchInitial();

    // Set up SSE
    const sseUrl = `${API_BASE_URL}/notifications/stream`;
    
    // We send the token via query string as a fallback, but rely on cookies (withCredentials) ideally
    const token = localStorage.getItem("access_token") || "";
    const es = new EventSource(`${sseUrl}?token=${token}`, { withCredentials: true });

    es.onopen = () => {
      setIsConnected(true);
    };

    es.addEventListener("notification", (event) => {
      try {
        const notif: Notification = JSON.parse(event.data);
        setNotifications((prev) => [notif, ...prev]);
        setUnreadCount((prev) => prev + 1);
        
        // Optional: Trigger a browser notification or a toast here
      } catch (err) {
        console.error("Failed to parse SSE notification", err);
      }
    });

    es.onerror = (error) => {
      console.error("SSE connection error", error);
      setIsConnected(false);
      es.close();
      
      // Auto reconnect could be handled here with setTimeout
    };

    return () => {
      es.close();
      setIsConnected(false);
    };
  }, [user, fetchInitial]);

  const markAsRead = async (id: string) => {
    try {
      await apiClient.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.put("/notifications/read-all");
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  };

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
  };
}
