const path = require('node:path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

let localAddress = {
  fullName: 'Amina Okafor',
  line1: '48 Orchard Lane',
  city: 'Bristol',
  postcode: 'BS1 4QR'
};

module.exports = {
  entry: './src/main.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'assets/[name].[contenthash].js',
    clean: true,
    publicPath: '/'
  },
  resolve: { extensions: ['.ts', '.tsx', '.js'] },
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      title: 'Address book'
    })
  ],
  devServer: {
    port: 4173,
    open: true,
    historyApiFallback: true,
    hot: true,
    setupMiddlewares: (middlewares) => {
      middlewares.unshift({
        name: 'local-profile-api',
        path: '/api/profile/delivery-address',
        middleware: (request, response, next) => {
          response.setHeader('Content-Type', 'application/json');
          if (request.method === 'GET') {
            response.end(JSON.stringify(localAddress));
            return;
          }
          if (request.method !== 'PUT') {
            next();
            return;
          }
          let body = '';
          request.on('data', (chunk) => {
            body += chunk;
          });
          request.on('end', () => {
            try {
              localAddress = JSON.parse(body);
              response.end(JSON.stringify(localAddress));
            } catch {
              response.statusCode = 400;
              response.end(JSON.stringify({ message: 'Invalid address payload.' }));
            }
          });
        }
      });
      return middlewares;
    }
  }
};
