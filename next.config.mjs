/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  productionBrowserSourceMaps: true,
  webpack: (config, { dev }) => {
    // Safari can surface "Cannot access uninitialized variable" with some optimized bundles.
    // Disabling minimization + module concatenation makes output more robust and debuggable.
    if (!dev) {
      config.optimization = config.optimization || {}
      config.optimization.minimize = false
      config.optimization.concatenateModules = false
    }
    return config
  },
}

export default nextConfig
