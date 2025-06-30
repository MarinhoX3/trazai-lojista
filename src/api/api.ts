import axios from 'axios';

const api = axios.create({
  // Esta é a versão correta, sem o espaço e o ".app" extra no final
  baseURL: 'https://f537-2804-29b8-5180-cdb-d461-9a75-4400-118.ngrok-free.app'
});

export default api;