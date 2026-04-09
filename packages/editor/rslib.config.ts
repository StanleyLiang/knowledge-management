import { defineConfig } from '@rslib/core'
import { pluginReact } from '@rsbuild/plugin-react'

export default defineConfig({
  plugins: [pluginReact()],
  lib: [
    {
      format: 'esm',
      syntax: 'es2022',
      dts: {
        distPath: './types',
      },
    },
    {
      format: 'cjs',
      syntax: 'es2022',
    },
  ],
  source: {
    entry: {
      index: './src/index.ts',
    },
  },
  output: {
    target: 'web',
    externals: ['react', 'react-dom', 'react/jsx-runtime'],
    distPath: {
      root: './dist',
    },
  },
})
