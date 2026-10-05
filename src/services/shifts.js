import api from './api';

export const shiftsApi = {
  current: () => api.get('/shifts/current').then((r) => r.data),
  open: ({ staffId, openingFloat } = {}) =>
    api.post('/shifts/open', { staffId, openingFloat }).then((r) => r.data),
  close: (shiftId, { countedCash, notes } = {}) =>
    api.post(`/shifts/${shiftId}/close`, { countedCash, notes }).then((r) => r.data),
  list: () => api.get('/shifts').then((r) => r.data),
  get: (shiftId) => api.get(`/shifts/${shiftId}`).then((r) => r.data),
};