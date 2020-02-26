const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const Dotenv = require("dotenv-webpack");

module.exports = {
  entry: {
    app: "./src/index.js"
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: "Production",
      template: "./src/index.html"
    }),
    new Dotenv()
  ],
  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "dist")
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"]
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        exclude: /node_modules/,
        loader: "url-loader?limit=100000"
      }
    ]
  }
};
