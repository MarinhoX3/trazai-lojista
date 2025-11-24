import axios from "axios";
import Constants from "expo-constants";

// Tenta ler do app.json (expo.extra)
const API_BASE_URL =
  Constants.expoConfig?.extra?.apiBaseUrl ||
  Constants.manifest?.extra?.apiBaseUrl ||
  "https://trazai.shop/api"; // fallback final

const ASSET_BASE_URL =
  Constants.expoConfig?.extra?.assetBaseUrl ||
  Constants.manifest?.extra?.assetBaseUrl ||
  "https://trazai.shop";

console.log("🔧 API_BASE_URL carregado:", API_BASE_URL);
console.log("🔧 ASSET_BASE_URL carregado:", ASSET_BASE_URL);

// Instância do Axios
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Interceptadores
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log("🚫 Unauthorized — redirecionar login");
    }
    return Promise.reject(error);
  }
);

export { ASSET_BASE_URL };
export default api;
