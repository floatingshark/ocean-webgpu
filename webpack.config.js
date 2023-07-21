const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

const HTML_INDEX_PATH = './source/html/index.html';
const ENTRY_PATH = './source/main.ts';
const OUTPUT_PATH = path.resolve(__dirname, 'public');
const OUTPUT_JS_NAME = "main.js";

module.exports = {
    mode: 'development',
    entry: ENTRY_PATH,
    output: {
        path: OUTPUT_PATH,
        filename: OUTPUT_JS_NAME,
      },
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
                    options: { url: false }
                }
            ]
        }
      ],
    },
    resolve: {
      extensions: [
        '.ts', '.js',
      ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: HTML_INDEX_PATH,
        })
      ],
    devServer: {
        static: {
            directory: OUTPUT_PATH
          },
      },
  };