// app.config.js
import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  extra: {
    apiBaseUrl: process.env.API_BASE_URL,
    assetBaseUrl: process.env.ASSET_BASE_URL,
    eas: {
      projectId: '09852f0c-9a00-455b-bbfc-c7de37bedf91'
    }
  }
});
