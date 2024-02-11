const path = require('path');

module.exports = {
  entry: './scripts/content-script.js',
  output: {
    filename: 'content-script.js',
    path: path.resolve(__dirname, ''),
  },
  mode: 'production',
};
