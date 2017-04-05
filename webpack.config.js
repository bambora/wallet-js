const webpack = require("webpack");


const isProduction = process.argv.indexOf("-p") !== -1;

module.exports = {
    entry: {
        index: "./src/index.ts",
    },
    output: {
        path: __dirname + "/dist",
        filename: "[name].js",
        library: "wallet",
        libraryTarget: "umd",
        umdNamedDefine: true
    },
    externals: [
        {
            "isomorphic-fetch": {
                root      : "isomorphic-fetch",
                commonjs2 : "isomorphic-fetch",
                commonjs  : "isomorphic-fetch",
                amd       : "isomorphic-fetch"
            }
        }
    ],
    resolve: {
        extensions: [".webpack.js", ".web.js", ".ts", ".js"],
    },
    devServer: {
        port: 3000,
        historyApiFallback: true,
    },
    module: {
        loaders: [
            { 
                test: /\.ts$/, 
                loader: "ts-loader", 
                exclude: /node_modules/,
            }
        ]

    },
    devtool: "source-map",
    // plugins: [
    //     new webpack.SourceMapDevToolPlugin({
    //         filename: null, // if no value is provided the sourcemap is inlined
    //         test: /\.(ts|js)($|\?)/i // process .js and .ts files only
    //     })
    // ]
}