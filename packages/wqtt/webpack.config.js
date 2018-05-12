/* eslint-env node */

const path = require('path');
// const HtmlWebpackPlugin = require('html-webpack-plugin');
// const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

const config = {
  entry: './src/index.js',
  output: {
    filename: 'wqtt.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'wqtt',
    libraryTarget: 'umd',
  },
  devtool: 'inline-source-map',
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
    // new UglifyJSPlugin()
  ],
};

module.exports = config;
