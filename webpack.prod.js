const { merge } = require('webpack-merge')
const common = require('./webpack.common.js')
const TerserPlugin = require('terser-webpack-plugin')

module.exports = merge(common, {
  optimization: {
    minimize: true,
    usedExports: true,
    minimize: true,
    minimizer: [new TerserPlugin()],
  },
  mode: 'production',
})
