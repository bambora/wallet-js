import commonjs from '@rollup/plugin-commonjs'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import terser from '@rollup/plugin-terser'
import typescript from '@rollup/plugin-typescript'
import { defineConfig } from 'rollup'

const environment = process.env.NODE_ENV && process.env.NODE_ENV.toLowerCase()
const isProduction = environment === 'production'
const shouldUseSourceMaps = !isProduction

const commonPlugins = [
  typescript({
    module: 'es2015',
  }),
  nodeResolve({ preferBuiltins: false }),
  replace({
    preventAssignment: true,
    NPM_VERSION: process.env.npm_package_version,
  }),
  commonjs(),
]

const rollupConfig = defineConfig([
  {
    input: './src/index.ts',
    output: [
      // Unminified ESM:
      {
        name: 'BamboraWalletSDK',
        file: './dist/index.mjs',
        format: 'es',
        sourcemap: shouldUseSourceMaps,
      },

      // Unminified UMD:
      {
        name: 'BamboraWalletSDK',
        file: './dist/index.js',
        format: 'umd',
        sourcemap: shouldUseSourceMaps,
      },
    ],
    plugins: commonPlugins,
  },
  {
    input: './src/web.ts',
    output: {
      name: 'WorldlineOnlineCheckout',
      file: './dist/wallet.min.js',
      format: 'iife',
      sourcemap: false,
    },
    plugins: [
      ...commonPlugins,
      terser({
        format: {
          comments: false,
        },
      }),
    ],
  },
])

export default rollupConfig
