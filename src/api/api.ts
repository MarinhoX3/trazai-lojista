// src/api/api.js

import axios from 'axios';

// URL base para arquivos estáticos (imagens, etc.)
export const ASSET_BASE_URL = 'https://trazai.shop';

// Instância do Axios para chamadas da API
const api = axios.create({
  baseURL: `${ASSET_BASE_URL}/api` // Continua como 'https://trazai.shop/api'
});

export default api;