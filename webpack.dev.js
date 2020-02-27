const merge = require("webpack-merge");
const common = require("./webpack.common.js");
var webpack = require("webpack");

module.exports = merge(common, {
  mode: "development",
  devtool: "#source-map",
  plugins: [
    // new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    // Use NoErrorsPlugin for webpack 1.x
    new webpack.NoEmitOnErrorsPlugin()
  ]
});
