import { apiClient } from './client';

export const getLogsheets = (params = {}) => {
  const query = new URLSearchParams();
  if (params.status) query.append('status', params.status);
  if (params.limit) query.append('limit', params.limit);
  if (params.source_type) query.append('source_type', params.source_type);
  if (params.client_id) query.append('client_id', params.client_id);
  if (params.application_id) query.append('application_id', params.application_id);

  const qs = query.toString();
  return apiClient(`/application-logsheets${qs ? `?${qs}` : ''}`);
};

export const getLogsheetById = (id) => apiClient(`/application-logsheets/application/${id}`);

export const signLogsheet = (id, role, signature_url, signature_name, comment) => apiClient(`/application-logsheets/${id}/sign`, {
  method: 'PUT',
  body: JSON.stringify({ role, signature_url, signature_name, comment })
});

export const getApplicationById = (id) => apiClient(`/applications/${id}`);

export const getAddOnById = (id) => apiClient(`/add-on-applications/${id}`);