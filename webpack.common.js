const path = require('path')
const webpack = require('webpack')
const _ = require('lodash')

const packageJSon = require('./package.json')
const exludesNames = _.union(
    _.keys(packageJSon.peerDependencies),
    _.keys(packageJSon.dependencies)
)


function externalRoots(name) {
  switch(name) {
    case 'react': return 'React';
    case 'react-dom': return 'ReactDOM';
    case 'lodash': return '_';
    default: return name

  }
}
const exludes = _.map(exludesNames, (v) => ({
  [v]: {
    commonjs: v,
    commonjs2: v,
    amd: v,
    root: externalRoots(v)
  }
}))

module.exports = {
  entry: './src/index.ts',
  // devtool: 'inline-source-map',
  watch: false,
  module: {
    rules: [
      {
        test: /\.ts|\.tsx$/,
        use: 'ts-loader',
        //exclude: /node_modules/,
        include: __dirname,
      },
      {
        test: /\.css$/,
        use: ['style-loader', {
          loader: "css-loader",
          options: {
            modules: true
          }
        }],
        // loader: 'style!css-loader?modules&importLoaders=1&localIdentName=[name]__[local]___[hash:base64:5]',
        //exclude: /node_modules/,
        include: __dirname,
      },
    ],
  },
  externals: exludes,
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    modules: [path.resolve(__dirname, './src'), 'node_modules'],
  },

  // devtool: 'inline-source-map',
  output: {
    filename: 'iLottie-lib.dist.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'iLottieLib',
    libraryTarget: 'umd',
    globalObject: 'this',
  },
  plugins: [new webpack.DefinePlugin({})],
}
