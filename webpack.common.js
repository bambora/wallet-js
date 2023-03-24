const path = require('path')
const webpack = require('webpack')
const { merge } = require('webpack-merge')

const TerserPlugin = require('terser-webpack-plugin');

const config = {
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  plugins: [
    new webpack.DefinePlugin({
      VERSION: JSON.stringify(require('./package.json').version),
    }),
  ],
}

const webConfig = merge(
  config,
  {
    entry: {
      web: {
        import: './src/web.ts',
        library: {
          name: 'web',
          type: 'commonjs'
        }
      }
    },
    target: ['web', 'es5'],
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'wallet.min.js',
      iife: true,
    },
    optimization: {
      minimizer: [new TerserPlugin({
        extractComments: false,
      })],
    },
  }
);

const nodeConfig = merge(
  config,
  {
    entry: {
      index: {
        import: './src/index.ts',
        library: {
          name: 'BamboraWalletSDK',
          umdNamedDefine: true,
          type: 'umd',
        }
      }
    },
    target: ['node', 'es5'],
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'index.js',
      libraryTarget: 'umd',
    },
    optimization: {
      minimize: false,
    }
  }
);

module.exports = [webConfig, nodeConfig]
