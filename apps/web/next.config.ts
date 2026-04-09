import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@lexical-editor/editor'],
  webpack: (config) => {
    // Resolve "source" condition so transpilePackages uses .ts source
    const defaults = config.resolve.conditionNames ?? ['browser', 'module', 'import', 'require', 'default']
    config.resolve.conditionNames = ['source', ...defaults]
    return config
  },
}

export default nextConfig
