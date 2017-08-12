var path = require('path');
var outputPath = path.resolve(__dirname, 'build');
var sassPath = path.resolve(__dirname, 'src/scss');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var StyleLintPlugin = require('stylelint-webpack-plugin');
var WebpackObfuscator = require('webpack-obfuscator');
var webpack = require('webpack');

module.exports = {
    entry: {
        app: [
            './src/ts/app.ts'
        ]
    },
    output: {
        path: outputPath,
        filename: '[name].js',
        publicPath: 'build/'
    },
    resolve: {
        modules: [
            path.join(__dirname, 'src'),
            'node_modules'
        ],
        extensions: ['.jpg', '.png', '.ts', '.webpack.js', '.web.js', '.js']
    },
    devtool: 'source-map',
    module: {
        rules: [
            {
                test: /\.ts$/,
                enforce: "pre",
                loader: 'tslint-loader',
                options: {
                    emitErrors: false,
                    failOnHint: false,
                    typeCheck: true,
                    resourcePath: 'src/ts'
                },
                exclude: /node_modules/
            },
            {
                test: /\.ts$/,
                loader: 'awesome-typescript-loader',
                exclude: /node_modules/
            },
            {
                test: /\.(png|jpg)$/,
                loader: 'file-loader?name=../[path][name].[ext]'
            },
            {
                test: /\.scss$/,
                use: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use: [
                        {
                            loader: 'css-loader',
                            options: {
                                importLoaders: 1,
                                sourceMap:true
                            }
                        },
                        {
                            loader: 'postcss-loader?sourceMap'
                        },
                        {
                            loader: 'resolve-url-loader'
                        },
                        {
                            loader: 'sass-loader?sourceMap',
                            options: {
                                includePaths: [
                                    sassPath,
                                    'node_modules/normalize-scss/sass'
                                ]
                            }
                        }
                    ]
                })
            }
        ]
    },
    plugins: [
        new ExtractTextPlugin('[name].css'),
        new StyleLintPlugin({
          configFile: '.stylelintrc',
          syntax: 'scss',
          files: ['**/*.s?(a|c)ss'],
          failOnError: false,
        }),
        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.optimize.UglifyJsPlugin({
        compress: {
            warnings: false
        }
        }),
        new WebpackObfuscator ({
            rotateUnicodeArray: true,
        })
    ]
}
