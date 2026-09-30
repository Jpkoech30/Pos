import api from './api';

export const ordersApi = {
  create: (items, paymentMethod) =>
    api.post('/orders', { items, paymentMethod }).then((r) => r.data),

  list: () => api.get('/orders').then((r) => r.data),

  get: (id) => api.get(`/orders/${id}`).then((r) => r.data),
};