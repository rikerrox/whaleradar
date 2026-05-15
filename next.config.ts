import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    '.space-z.ai',
    'preview-chat-84b86d5c-302b-4d13-9524-52ba34eb97fe.space-z.ai',
  ],
};

export default nextConfig;
