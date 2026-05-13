const path = require('path');

module.exports = {
  entry: './scripts/content-script',
  output: {
    filename: 'content-script.js',
    path: path.resolve(__dirname, ''),
  },
  mode: 'production',
  resolve: {
    extensions: ['.ts', '.js'],
  },

  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
};
