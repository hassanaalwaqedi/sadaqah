/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.NODE_ENV === "production" ? "export" : undefined,
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: "http://localhost:8080/api/v1/:path*",
      },
    ];
  },
};

export default nextConfig;
