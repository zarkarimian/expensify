/** @type {import('next').NextConfig} */
const nextConfig = {
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
