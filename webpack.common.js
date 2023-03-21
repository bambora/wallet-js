const path = require('path')
const webpack = require('webpack');

module.exports = {
  entry: {
    index: './src/index.ts',
  },
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
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    library: 'wallet',
    libraryTarget: 'umd',
    umdNamedDefine: true,
    clean: true,
  },
  externals: [
    {
      'whatwg-fetch': {
        root: 'whatwg-fetch',
        commonjs2: 'whatwg-fetch',
        commonjs: 'whatwg-fetch',
        amd: 'whatwg-fetch',
      },
    },
  ],
  plugins: [
    new webpack.DefinePlugin({
      VERSION: JSON.stringify(require('./package.json').version),
    }),
  ],
}
