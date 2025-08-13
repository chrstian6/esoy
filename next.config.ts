import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["flowbite.s3.amazonaws.com"], // Add this line
  },
};

export default nextConfig;
