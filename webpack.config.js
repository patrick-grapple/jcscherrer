const HtmlWebPackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const ModuleFederationPlugin = require("webpack/lib/container/ModuleFederationPlugin");
const path = require("path");
const webpack = require("webpack");
const sveltePreprocess = require("svelte-preprocess");
const includeEnv = require("svelte-environment-variables");

const mode = process.env.NODE_ENV || "development";
const prod = mode === "production";

module.exports = {
  entry: "./src/main.ts",

  output: {
    path: __dirname + "/public",
    // in prod it is to auto.  localhost:8080 is used for development
    publicPath: "/",
    // publicPath: "auto",
  },

  resolve: {
    extensions: [".tsx", ".ts", ".jsx", ".js", ".json"],
  },

  resolve: {
    alias: {
      svelte: path.resolve("node_modules", "svelte"),
    },
    extensions: [".mjs", ".js", ".ts", ".svelte"],
    mainFields: ["svelte", "browser", "module", "main"],
  },

  devServer: {
    port: 4000,
    historyApiFallback: {
      index: "/",
    },
    allowedHosts: "all",
  },

  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.svelte$/,
        use: {
          loader: "svelte-loader",
          options: {
            compilerOptions: {
              dev: !prod, // Default: false
            },
            emitCss: prod,
            hotReload: !prod,
            preprocess: sveltePreprocess({ sourceMap: true }),
          },
        },
      },
      {
        test: /\.css$/,
        use: [
          /**
           * MiniCssExtractPlugin doesn't support HMR.
           * For developing, use 'style-loader' instead.
           * */
          prod ? MiniCssExtractPlugin.loader : "style-loader",
          "css-loader",
          {
            loader: "postcss-loader",
            options: {
              postcssOptions: {
                plugins: {
                  tailwindcss: {},
                  autoprefixer: {},
                },
              },
            },
          },
        ],
      },
      {
        test: /\.(png|jpe?g|gif)$/i,
        use: [
          {
            loader: "file-loader",
          },
        ],
      },
    ],
  },

  mode,
  plugins: [
    new MiniCssExtractPlugin({
      filename: "[name].css",
    }),
    new HtmlWebPackPlugin({
      template: "./src/index.html",
      chunks: ["main"],
    }),
    new webpack.DefinePlugin({
      ...includeEnv(),
    }),
    new ModuleFederationPlugin({
      // only alphanumeric characters are allowed.
      name: "consumer",
      remotes: {
        // App: "Components@http://localhost:3000/remoteEntry.js", // local
        // App: "jcsbojcsboasas@https://jcs-bo-jcs-boas-as-ui.jcscherrer.cloud20x.com/remoteEntry.js", // prod
        // App: "jcsbodevjcsbodevasas@https://jcs-bo-dev-jcs-bo-devas-as-ui.uat.cloud20x.com/remoteEntry.js", // uat
        App: `${process.env.CONTAINER_NAME}@${process.env.SVELTE_APP_REMOTE_URL}/remoteEntry.js`,
      },
    }),
  ],
  devtool: prod ? false : "source-map",
};
console.log("SVELTE_APP_REMOTE_URL: ${process.env.SVELTE_APP_REMOTE_URL}");
console.log("CONTAINER_NAME: ${process.env.CONTAINER_NAME}");
