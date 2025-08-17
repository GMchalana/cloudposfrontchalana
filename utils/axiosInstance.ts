import axios from 'axios';

const api = axios.create({
  baseURL: 'https://cloudposbackchalana-hr2459ntd-chalana-prabhashwaras-projects.vercel.app/api', // adjust as needed
});

// Add token to headers automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
