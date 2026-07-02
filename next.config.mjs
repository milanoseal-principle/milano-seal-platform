/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack(config) {
    config.module.rules.push({
      test: /app\/dashboard\/intelligence\/sales-lab\/page\.tsx$/,
      use: require.resolve("./lib/build/emptyModule.js"),
    });
    return config;
  },
};

export default nextConfig;
