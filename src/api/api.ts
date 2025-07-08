import axios from 'axios';

const api = axios.create({
  baseURL: 'https://trazai.shop/api' 
});

export default api;