import api from './api';

export const usersApi = {
  getProfile: () => api.get('/users/me').then((r) => r.data),

  updateProfile: (data) => api.patch('/users/me', data).then((r) => r.data),

  changePassword: (currentPassword, newPassword) =>
    api.post('/users/me/change-password', { currentPassword, newPassword }).then((r) => r.data),
};