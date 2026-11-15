import { apiClient } from './client';

export const login = (username, password, recaptchaToken) => apiClient('/auth/admin/login', {
  method: 'POST',
  body: JSON.stringify({
    username,
    password,
    recaptchaToken
  })
});
