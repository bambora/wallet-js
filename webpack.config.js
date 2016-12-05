const webpack = require("webpack");


const isProduction = process.argv.indexOf('-p') !== -1;

module.exports = {
    entry: {
        wallet: "./src/wallet.ts",
    },
    output: {
        path: __dirname + "/dist",
        filename: "[name].js",
    
    },
    externals: {},
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
    plugins: [
        new webpack.SourceMapDevToolPlugin({
            filename: "wallet.sourcemap.js", // if no value is provided the sourcemap is inlined
            test: /\.(ts|js)($|\?)/i // process .js and .ts files only
        })
    ]
}