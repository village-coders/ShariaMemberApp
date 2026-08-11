import { apiClient } from './client';

export const getMySignature = async (userId) => {
  const res = await apiClient('/signatures');
  // Return the first signature found for this user (or array if not filtered by user_id)
  return res.find(s => s.user_id === userId || s.username);
};

export const createSignature = (formData) => apiClient('/signatures', {
  method: 'POST',
  body: formData // multipart/form-data
});