const {merge} = require('webpack-merge')
const common = require('./webpack.common.js')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    contentBase: './dist',
    port: 8888
  },
  plugins: [
    // new HtmlWebpackPlugin({
    //   title: 'Test',
    //   filename: 'index.html',
    //   template: 'test/index.html'
    // }),
    // new CopyPlugin({
    //   patterns: [
    //   {
    //     from: 'test/*.svg',
    //     flatten: true
    //   }
    // ]})
  ]
})