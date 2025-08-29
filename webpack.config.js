const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  mode: "production",
  entry: {
    index: "./src/index.ts",
    sw: "./src/sw/sw.js",
    unauthorized: "./src/unauthorized.ts",
    "session-validator": "./src/session-validator.ts",
    "cache-handle": "./src/cache-handle/cache-handle.ts",
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [{ from: "./src/assets", to: "assets" }],
    }),
  ],
  resolve: {
    alias: {
      "@cache-handle": path.resolve(
        __dirname,
        "./src/cache-handle/cache-handle.ts"
      ),
    },
    extensions: [".ts", ".js"],
  },
  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "dist"),
  },
};
