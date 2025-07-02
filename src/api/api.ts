import axios from 'axios';

const api = axios.create({
  // Esta é a versão correta, sem o espaço e o ".app" extra no final
  baseURL: 'https://3a1c-2804-29b8-5180-cdb-1cf0-4e9-be30-72e1.ngrok-free.app'
});

export default api;