import axios from 'axios';

const api = axios.create({
  baseURL: 'https://trazai.shop'
});

export default api;