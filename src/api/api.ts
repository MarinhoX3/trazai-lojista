import axios from 'axios';

// CORREÇÃO: Use o endereço IP ou a URL com a porta correta
const apiBaseUrl = 'http://trazai.shop:3000';
const assetBaseUrl = 'http://trazai.shop:3000';

const api = axios.create({
  // A URL base agora aponta para o endereço correto do backend
  baseURL: `${apiBaseUrl}/api`,
});

export const ASSET_BASE_URL = assetBaseUrl;

export default api;