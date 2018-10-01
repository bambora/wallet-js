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
            "whatwg-fetch": {
                root      : "whatwg-fetch",
                commonjs2 : "whatwg-fetch",
                commonjs  : "whatwg-fetch",
                amd       : "whatwg-fetch"
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