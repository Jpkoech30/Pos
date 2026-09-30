import api from './api';

export const authApi = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }).then((r) => r.data),

  signup: (email, password, name) =>
    api.post('/auth/signup', { email, password, name }).then((r) => r.data),

  me: () => api.get('/auth/me').then((r) => r.data),
};