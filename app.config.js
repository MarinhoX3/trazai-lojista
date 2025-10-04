// app.config.js

import 'dotenv/config';

export default ({ config }) => {
  return {
    ...config,
    extra: {
      // A URL do seu servidor backend (EC2 ou ngrok)
      apiBaseUrl: process.env.API_BASE_URL,

      // A URL para ativos estáticos (imagens, etc.)
      assetBaseUrl: process.env.ASSET_BASE_URL,
    },
  };
};