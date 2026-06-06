import axios from "axios";

// In development, Next.js rewrites proxy /api/v1 to localhost:8080.
// In production (Firebase static export), there is no proxy, so we hit the backend directly.
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://sadaqah-api.duckdns.org/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Crucial for sending/receiving cookies
  timeout: 30000,
});

// ── Response Interceptor: Handle token refresh ──
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(null);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh for 401 errors that aren't already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't intercept refresh token loops
      if (originalRequest.url === "/auth/refresh" || originalRequest.url === "/auth/login") {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call the refresh endpoint (it automatically sends the refresh_token cookie)
        await axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true });

        processQueue(null);

        // Retry the original request (it will now include the new access_token cookie)
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);

        // If refresh fails, cookies are likely cleared or expired. Redirect to login.
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
