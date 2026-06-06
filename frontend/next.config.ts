/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.NODE_ENV === "production" ? "standalone" : undefined,
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    // Only proxy API calls in development — in production the frontend
    // calls the backend directly via NEXT_PUBLIC_API_URL.
    if (process.env.NODE_ENV !== "development") return [];
    return [
      {
        source: "/api/v1/:path*",
        destination: "http://localhost:8080/api/v1/:path*",
      },
    ];
  },
};

export default nextConfig;
