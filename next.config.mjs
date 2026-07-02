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
  webpack(config) {
    config.module.rules.push({
      test: /app\/(opengraph|twitter)-image\.tsx$/,
      use: require.resolve("./lib/build/empty-module.js"),
    });
    return config;
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
};

export default nextConfig;
