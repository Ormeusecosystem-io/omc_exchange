const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const path = require('path');

const development = process.env.NODE_ENV === 'development';
let plugins = [new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /en/)];

if (development) {
  plugins = plugins.concat([
    new ExtractTextPlugin({
      filename: 'style.css',
      allChunks: true,
    }),
  ]);
} else {
  plugins = plugins.concat([
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
    new UglifyJSPlugin({
      sourceMap: true,
    }),
    new ExtractTextPlugin({
      filename: 'style.css',
      allChunks: true,
    }),
  ]);
}

module.exports = {
  entry: ['babel-polyfill', './src/tradingIndex.js'],
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'widgets.min.js',
    sourceMapFilename: '[file].map',
  },
  externals: ['jquery'],
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [
            { loader: 'css-loader', options: { sourceMap: true } },
            { loader: 'autoprefixer-loader' },
          ],
        }),
      },
      {
        test: /\.scss$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [
            { loader: 'css-loader' },
            { loader: 'autoprefixer-loader' },
            { loader: 'sass-loader', options: { outputStyle: 'expanded' } },
          ],
        }),
      },
      {
        test: /\.html$/,
        use: ['html-loader'],
      },
      {
        test: /\.(png)$/,
        use: 'url-loader?limit=100000&mimetype=image/png',
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
  },
  devtool: development ? 'eval' : 'cheap-module-source-map',
  plugins,
};
