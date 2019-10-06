const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const path = require('path');


module.exports = ({NODE_ENV, WATCH, LOCAL_SRV}) => {
  const development = NODE_ENV === 'development';
  const watch = WATCH === 'true';
  const localServer = LOCAL_SRV || false;
  console.log("SERVER: ", !development ? 'Production' :  LOCAL_SRV || 'QA Server');
  console.log("development: ", development);
  console.log("WATCH: ", watch);
  let plugins = [];
  if (development) {
    console.log('development environment');
    plugins = [
      new ExtractTextPlugin({
        filename: 'style.css',
        allChunks: true,
      }),
      new webpack.NamedModulesPlugin(),
      new webpack.HotModuleReplacementPlugin(),
      new webpack.DefinePlugin({
        'process.env': {
          'NODE_ENV': JSON.stringify('development'),
          'ON_BOADRDING_URL': JSON.stringify(localServer || 'https://onboarding-dev.veritex.io'),
          'PRAXIS_REQUEST': JSON.stringify('https://dev.cotix.io'),
          'PRAXIS_URL': JSON.stringify('https://cashier-test.praxispay.com'),
          'PRAXIS_FE': JSON.stringify('Praxis TEST_4'),
          'FRONTEND_NAME': JSON.stringify('Veritex')
        }
      }),
    ];
  } else {
    console.log('production environment')
    plugins = plugins.concat([
      new webpack.DefinePlugin({
        'process.env': {
          'NODE_ENV': JSON.stringify('prod'),
          'ON_BOADRDING_URL': JSON.stringify('https://onboarding.veritex.io'),
          'PRAXIS_REQUEST': JSON.stringify('https://api.cotix.io'),
          'PRAXIS_URL': JSON.stringify('https://cashier.praxispay.com'),
          'PRAXIS_FE': JSON.stringify('Veritex'), 
          'FRONTEND_NAME': JSON.stringify('Veritex')
        }
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
  
  return {
    entry: ['babel-polyfill', './src/index.js'],
    output: {
      path: path.resolve(__dirname, watch ? '../v2retailTemplate/js' : 'build'),
      filename: 'widgets.min.js',
      sourceMapFilename: '[file].map',
      hotUpdateChunkFilename: 'hot/hot-update.js',
      hotUpdateMainFilename: 'hot/hot-update.json'
    },
    externals: ['ws', 'jQuery'],
    module: {
      noParse: [
        /\/ws\//,
        /socket\.io\/lib\/index\.js/
      ],
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
          test: /\\.(gif|ttf|eot|svg|woff2?)$/,
          use: 'url-loader?name=[name].[ext]',
        },
        {
          test: /\.(jpe?g|gif|woff|woff2|eot|ttf|svg|eot)(\?[a-z0-9=.]+)?$/,
          loader: 'url-loader?limit=100000&name=[name].[ext]' 
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
        { test: /\.less$/, use: ['style-loader', 'css-loader', 'less-loader'] },
      ],
    },
    resolve: {
      extensions: ['.js', '.jsx', '.json'],
    },
    node: {
      fs: 'empty',
    },
    devtool: 'source-map',
    devServer: {
      socket: 'socket',
      port: 8080,
      hot: true,
    },
    plugins,
  };
};