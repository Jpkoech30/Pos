import api from './api';

export const shopApi = {
  get: () => api.get('/shop').then((r) => r.data),

  update: ({ name, mpesaNumber, address }) =>
    api.patch('/shop', { name, mpesaNumber, address }).then((r) => r.data),

  setDaraja: ({ consumerKey, consumerSecret, passkey, shortcode, env }) =>
    api.put('/shop/daraja', {
      consumerKey,
      consumerSecret,
      passkey,
      shortcode,
      env,
    }).then((r) => r.data),

  clearDaraja: () =>
    api.delete('/shop/daraja').then((r) => r.data),

  testDaraja: ({ consumerKey, consumerSecret, passkey, shortcode, env }) =>
    api.post('/shop/daraja/test', {
      consumerKey,
      consumerSecret,
      passkey,
      shortcode,
      env,
    }).then((r) => r.data),
};