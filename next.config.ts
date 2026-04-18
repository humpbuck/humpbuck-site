import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/series/astral", destination: "/series/rd-astral", permanent: true },
      {
        source: "/shop",
        has: [{ type: "query", key: "series", value: "astral" }],
        destination: "/shop?series=rd-astral",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "fastly.picsum.photos",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "pub-c8982b0d0821469baad86145989f3f64.r2.dev",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
