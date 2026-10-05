import api from './api';

export const authApi = {
  signup: (email, password, name, shopName) =>
    api.post('/auth/signup', { email, password, name, shopName }).then((r) => r.data),

  login: (email, password) =>
    api.post('/auth/login', { email, password }).then((r) => r.data),

  me: () => api.get('/auth/me').then((r) => r.data),
};