import api from './api';

export const stockApi = {
  recentActivity: (limit = 20) =>
    api.get(`/stock/activity?limit=${limit}`).then((r) => r.data),
};