import axios from 'axios';
import Constants from 'expo-constants';

// Adicione a porta 3000 à URL base
const apiBaseUrl =
  Constants.expoConfig?.extra?.apiBaseUrl ?? 'https://trazai.shop:3000';
const assetBaseUrl =
  Constants.expoConfig?.extra?.assetBaseUrl ?? 'https://trazai.shop:3000';

const api = axios.create({
  baseURL: `${apiBaseUrl}/api`,
});

export const ASSET_BASE_URL = assetBaseUrl;

export default api;