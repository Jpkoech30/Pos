import api from './api';

// Module-level state for the currently checked-in staff member.
// Set by ShiftContext; read by ordersApi.create so every order is
// attributed to whoever is on shift, not whoever is logged in.
let currentStaffId = null;

export function setCurrentStaffId(id) {
  currentStaffId = id;
}

export const ordersApi = {
  create: (items, paymentMethod, extra = {}) =>
    api.post('/orders', {
      items,
      paymentMethod,
      ...(currentStaffId ? { staffId: currentStaffId } : {}),
      ...extra,
    }).then((r) => r.data),

  list: () => api.get('/orders').then((r) => r.data),

  get: (id) => api.get(`/orders/${id}`).then((r) => r.data),
};