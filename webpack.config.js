const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

const HTML_INDEX_PATH = './source/html/index.html';
const ENTRY_PATH = './source/main.ts';
const OUTPUT_PATH = path.resolve(__dirname, 'public');
const OUTPUT_JS_NAME = "main.js";

module.exports = {
  mode: 'development',
  devtool: 'eval-cheap-module-source-map',
  entry: ENTRY_PATH,
  output: {
    path: OUTPUT_PATH,
    filename: OUTPUT_JS_NAME,
  },
  // ------------------------------
  resolve: {
    extensions: [
      '.ts', '.js',
    ],
    alias: {
      '@css': path.resolve(__dirname, 'source/css/'),
      '@ts': path.resolve(__dirname, 'source/ts/'),
      '@shader': path.resolve(__dirname, 'source/shader'),
    },
  },
  // ------------------------------
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
      },
      {
        test: /\.css/,
        use: [
          "style-loader",
          {
            loader: "css-loader",
          }
        ]
      },
      {
        test: /.vert$/,
        use: 'ts-shader-loader'
      },
      {
        test: /.frag$/,
        use: 'ts-shader-loader'
      }
    ],
  },
  // ------------------------------
  plugins: [
    new HtmlWebpackPlugin({
      template: HTML_INDEX_PATH,
    })
  ],
  // ------------------------------
  devServer: {
    static: {
      directory: OUTPUT_PATH
    },
  },
};