const { merge } = require('webpack-merge')
const common = require('./webpack.common.js')

const config = {
  mode: 'production',
}

module.exports = [merge(common[0], config), merge(common[1], config)]
