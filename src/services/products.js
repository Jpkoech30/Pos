import api from './api';

export const productsApi = {
  list: () => api.get('/products').then((r) => r.data),

  get: (id) => api.get(`/products/${id}`).then((r) => r.data),

  lookup: (barcode) =>
    api.get(`/products/lookup/${barcode}`).then((r) => r.data),

  create: (payload) =>
    api.post('/products', payload).then((r) => r.data),

  update: (id, payload) =>
    api.patch(`/products/${id}`, payload).then((r) => r.data),

  remove: (id) =>
    api.delete(`/products/${id}`).then((r) => r.data),

  adjustStock: (id, { change, reason, note }) =>
    api.post(`/products/${id}/stock`, { change, reason, note }).then((r) => r.data),

  movements: (id, limit = 50) =>
    api.get(`/products/${id}/movements?limit=${limit}`).then((r) => r.data),
};