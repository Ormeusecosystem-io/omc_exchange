const path = require('path');
const webpack = require("webpack");
const ExtractTextPlugin = require('extract-text-webpack-plugin')

module.exports = {
    entry: [
        // './js/addons.js', 
        // './js/tester.js',
        './js/lib/smoothscroll.js',
        './js/lib/jquery.countTo.js',
        './js/lib/validator.js',
        './js/lib/custom.js',
        './js/lib/growl.js',
        // './js/shift-themeing.js',
        // './js/lib/tether.min.js',
        './assets/css/retail/magnific-popup.css',
        // './assets/css/retail/bootstrap.min.css',
        // './assets/css/shift-styles.css'  
        './privacy.html',
        './files/legal/aml-ccx.doc',
        './files/legal/terms-ccx.doc',                
    ],
  output: {
    filename: 'shift-bundle.min.js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: [/node_modules/],
        use: [{
          loader: 'babel-loader'
        }]
      },
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader', 
          use: [
                { loader: 'css-loader', options: { minimize: true } }
            ],
        })
      }
    ]
  },
  plugins: [
    new ExtractTextPlugin('shift-styles.css'),
    new webpack.optimize.UglifyJsPlugin({
        include: /\.min\.js$/,
        minimize: true
      })
  ]
}