// src/api/api.ts
import axios from "axios";

// ============================================
// 💡 URLs fixas — SEM depender do Expo extra
// ============================================
export const ASSET_BASE_URL = "https://trazai.shop";

const api = axios.create({
  baseURL: `${ASSET_BASE_URL}/api`, // https://trazai.shop/api
});

// ============================================
// 🔐 Interceptador de requisição
// ============================================
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================
// 🚨 Interceptador de resposta
// ============================================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log("⚠️ Unauthorized access - redirect to login");
    }
    return Promise.reject(error);
  }
);

export default api;
