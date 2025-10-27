import axios from 'axios';

// URL base para ficheiros estáticos (imagens, etc.)
export const ASSET_BASE_URL = 'https://trazai.shop';

// Instância do Axios para chamadas da API, que vive dentro do caminho /api
const api = axios.create({
  baseURL: `${ASSET_BASE_URL}/api` // Resultado: 'https://trazai.shop/api'
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    // const token = getAuthToken(); // Implement your auth logic
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.log("Unauthorized access - redirect to login")
    }
    return Promise.reject(error)
  },
)

export default api;