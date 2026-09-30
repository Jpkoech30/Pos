import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const LAN_IP = '192.168.18.4';
const BASE_URL = `http://${LAN_IP}:4000`;

console.log('🔗 API BASE_URL:', BASE_URL);

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  console.log('➡️  REQUEST:', config.method?.toUpperCase(), config.baseURL + config.url);
  const token = await SecureStore.getItemAsync('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let onUnauthorized = null;
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

api.interceptors.response.use(
  (res) => {
    console.log('✅ RESPONSE:', res.status, res.config.url);
    return res;
  },
  async (error) => {
    console.log('=== ❌ API ERROR ===');
    console.log('URL:', error.config?.baseURL + error.config?.url);
    console.log('Code:', error.code);
    console.log('Message:', error.message);
    console.log('Status:', error.response?.status);
    console.log('Data:', JSON.stringify(error.response?.data));
    console.log('====================');

    if (error.response?.status === 401 && onUnauthorized) {
      await onUnauthorized();
    }
    const message =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

export default api;