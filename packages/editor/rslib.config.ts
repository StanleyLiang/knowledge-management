import { defineConfig } from '@rslib/core'

export default defineConfig({
  lib: [
    {
      format: 'esm',
      syntax: 'es2022',
      dts: true,
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
  },
})
