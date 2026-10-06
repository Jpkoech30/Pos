import api from './api';

export const mpesaApi = {
  initiateStk: ({ phone, items, idempotencyKey }) =>
    api.post('/mpesa/stkpush', { phone, items, idempotencyKey }).then((r) => r.data),

  status: (orderId) =>
    api.get(`/mpesa/status/${orderId}`).then((r) => r.data),

  query: (orderId) =>
    api.get(`/mpesa/query/${orderId}`).then((r) => r.data),

  cancel: (orderId) =>
    api.post(`/mpesa/cancel/${orderId}`).then((r) => r.data),
};