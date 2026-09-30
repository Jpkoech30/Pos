import api from './api';

export const productsApi = {
  list: () => api.get('/products').then((r) => r.data),

  get: (id) => api.get(`/products/${id}`).then((r) => r.data),

  create: (data) => api.post('/products', data).then((r) => r.data),

  update: (id, data) =>
    api.patch(`/products/${id}`, data).then((r) => r.data),

  remove: (id) => api.delete(`/products/${id}`).then((r) => r.data),
};