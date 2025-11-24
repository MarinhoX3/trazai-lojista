import axios from "axios";
import Constants from "expo-constants";

// Lê os valores definidos em expo.extra no app.json
const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl;
const ASSET_BASE_URL = Constants.expoConfig?.extra?.assetBaseUrl;

if (!API_BASE_URL) {
  console.warn("⚠ API_BASE_URL não encontrado em expo.extra!");
}

// Instância principal do Axios
const api = axios.create({
  baseURL: API_BASE_URL, // agora fica: https://trazai.shop/api
});

// Interceptador de requisição
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// Interceptador de resposta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log("Unauthorized access - redirect to login");
    }
    return Promise.reject(error);
  }
);

export { ASSET_BASE_URL };
export default api;
