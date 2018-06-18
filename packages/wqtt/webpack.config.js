/* eslint-env node */

const path = require('path');
// const HtmlWebpackPlugin = require('html-webpack-plugin');
// const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const config = {
  mode: process.env.WEBPACK_SERVE ? 'development' : 'production',
  entry: './src/index.js',
  output: {
    filename: 'wqtt.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'wqtt',
    libraryTarget: 'umd',
  },
  devtool: process.env.WEBPACK_SERVE ? 'eval' : 'source-map',
  devServer: {
    contentBase: './dist',
  },
  module: {
    rules: [{ test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader' }],
  },
  plugins: [
    // new HtmlWebpackPlugin({
    //   title: 'wqtt',
    // }),
    // new UglifyJSPlugin(),
    // new BundleAnalyzerPlugin(),
  ],
  serve: {
    port: 8888,
  },
};

module.exports = config;
