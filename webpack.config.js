'use strict';

const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  target: 'web',
  entry: {
    'utils': './lib/index.js'
  },
  output: {
    library: 'bpanel-utils',
    libraryTarget: 'umd',
    path: path.join(__dirname, 'dist'),
    filename: '[name].js'
  },
  resolve: {
    modules: ['node_modules'],
    extensions: ['-browser.js', '.js', '.json', '.jsx'],
    symlinks: false,
    alias: {
      bcoin: path.resolve(__dirname, 'node_modules/bcoin/lib/bcoin-browser')
    }
  },

  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets:[ 'es2015', 'react', 'stage-2' ]
        }
      }
    ],
  },

  plugins: [
    new UglifyJsPlugin()
  ]
};
