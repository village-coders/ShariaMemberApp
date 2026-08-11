const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://hfa-portal-backend.onrender.com/api';

export const apiClient = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = { ...options.headers };
  
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });
  
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('auth-error'));
  }
  
  const data = await response.json().catch(() => ({}));
  
  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }
  
  return data;
};