import api from './api';

export const staffApi = {
  list: () => api.get('/staff').then((r) => r.data),

  create: ({ email, name, password, role }) =>
    api.post('/staff', { email, name, password, role }).then((r) => r.data),

  setRole: (id, role) =>
    api.patch(`/staff/${id}/role`, { role }).then((r) => r.data),

  deactivate: (id) =>
    api.patch(`/staff/${id}/deactivate`).then((r) => r.data),

  activate: (id) =>
    api.patch(`/staff/${id}/activate`).then((r) => r.data),

  resetPassword: (id, password) =>
    api.post(`/staff/${id}/reset-password`, { password }).then((r) => r.data),
};