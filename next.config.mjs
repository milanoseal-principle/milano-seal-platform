/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: process.cwd(),
  },
  async redirects() {
    return [
      {
        source: "/countries/:slug",
        destination: "/apostille/:slug",
        permanent: true,
      },
      {
        source: "/apostille-for/:slug",
        destination: "/apostille/:slug",
        permanent: true,
      },
      {
        source: "/apostille-for-:slug",
        destination: "/apostille/:slug",
        permanent: true,
      },
    ];
  },
}

export default nextConfig
