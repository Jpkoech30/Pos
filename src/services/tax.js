import api from './api';

export const taxApi = {
  summary: (from, to) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const qs = params.toString();
    return api.get(`/tax/summary${qs ? `?${qs}` : ''}`).then((r) => r.data);
  },
};