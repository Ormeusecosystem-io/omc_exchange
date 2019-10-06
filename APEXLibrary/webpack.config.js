const webpack = require('webpack');
const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

module.exports = ({WATCH, NODE_ENV}) => {
  
  const development = NODE_ENV === 'development';
  const watch = WATCH === 'true';

  console.log("WATCH: ", WATCH);
  console.log("isDevelopment: ", development);
  

    let plugins = [];

    if (development) {
      plugins = [
        new webpack.NamedModulesPlugin(),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': JSON.stringify('development')
        })
      ];
    } else {
      plugins = plugins.concat([
       new UglifyJsPlugin({
            "uglifyOptions":{
                    compress: {
                        warnings: false
                    },
                    sourceMap: true
              }
        }),
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': JSON.stringify('production'),
          'process.env.URL': JSON.stringify('https://api.cotix.io')
        })
      ]);
    }
return {
  // module.exports = {
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, watch ? '../v2retailTemplate/js' : 'build'),
      filename: 'library.min.js',
      sourceMapFilename: '[file].map',
      hotUpdateChunkFilename: 'hot/hot-update.js',
      hotUpdateMainFilename: 'hot/hot-update.json'
    },
    // externals: {
    //   APConfig: {
    //     commonjs: 'APConfig',
    //     amd: 'APConfig',
    //     root: 'APConfig'
    //   }
    // },
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: 'babel-loader',
        }
      ]
    },
    resolve: {
      extensions: ['.js', '.jsx', '.json']
    },
    devtool: 'source-map',
    devServer: {
      port: 8081,
      hot: true,
    },
    plugins
  }
};
