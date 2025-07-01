import axios from 'axios';

const api = axios.create({
  // Esta é a versão correta, sem o espaço e o ".app" extra no final
  baseURL: 'https://a524-2804-29b8-5180-cdb-18a7-51e8-ebca-b0d9.ngrok-free.app'
});

export default api;