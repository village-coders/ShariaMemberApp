import { apiClient } from './client';

export const getLogsheets = () => apiClient('/application-logsheets');
export const getLogsheetById = (id) => apiClient(`/application-logsheets/${id}`);
export const signLogsheet = (id, role, signature_url, signature_name, comment) => apiClient(`/application-logsheets/${id}/sign`, {
  method: 'PUT',
  body: JSON.stringify({ role, signature_url, signature_name, comment })
});
export const getApplicationById = (id) => apiClient(`/applications/${id}`);
export const getAddOnById = (id) => apiClient(`/add-on-applications/${id}`);