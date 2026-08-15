/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  async redirects() {
    return [
      {
        source: "/docs/contracts",
        destination: "/docs/trace-contracts",
        permanent: true,
      },
      {
        source: "/docs/contracts/",
        destination: "/docs/trace-contracts/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
