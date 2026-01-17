import { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
const isDev = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `http://localhost:8000/api/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/sshterm/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // sshterm/wasm often needs these in dev
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              `connect-src 'self' ${
                isDev
                  ? "ws://localhost:8000 ws://localhost:3000"
                  : "wss://YOUR_DOMAIN"
              }`,
              "img-src 'self' data:",
              "font-src 'self' data:",
              "worker-src 'self' blob:",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
