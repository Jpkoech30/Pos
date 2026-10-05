import api from './api';

export const catalogApi = {
  search: (q) =>
    api.get(`/catalog/search?q=${encodeURIComponent(q)}`).then((r) => r.data),
};