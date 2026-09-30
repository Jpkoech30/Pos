import api from './api';

export const mpesaApi = {
  initiateStk: ({ phone, items }) =>
    api.post('/mpesa/stkpush', { phone, items }).then((r) => r.data),
  status: (orderId) =>
    api.get(`/mpesa/status/${orderId}`).then((r) => r.data),
};