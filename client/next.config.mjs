/** @type {import('next').NextConfig} */
const nextConfig = {
  // Strict Mode sengaja dimatikan: di dev mode React me-mount effect 2x,
  // yang membuat socket join room 2x dan bisa memicu "room full" palsu.
  reactStrictMode: false,
};

export default nextConfig;
