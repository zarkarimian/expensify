/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["portside-reclining-anger.ngrok-free.dev"],
  async redirects() {
    return [
      {
        source: "/dashbord",
        destination: "/dashboard",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
