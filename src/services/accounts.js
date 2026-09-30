import api from './api';

export const accountsApi = {
  list: () => api.get('/accounts').then((r) => r.data),

  transactions: (accountId) =>
    api.get(`/accounts/${accountId}/transactions`).then((r) => r.data),
};