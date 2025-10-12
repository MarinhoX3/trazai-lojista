import axios from 'axios';

// URL do backend via HTTPS + Nginx (proxy)
const apiBaseUrl = 'https://trazai.shop';
const assetBaseUrl = 'https://trazai.shop/uploads';

const api = axios.create({
  baseURL: `${apiBaseUrl}/api`, // já aponta para o proxy /api do Nginx
});

export const ASSET_BASE_URL = assetBaseUrl;

export default api;
