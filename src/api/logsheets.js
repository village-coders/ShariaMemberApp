import { apiClient } from './client';

export const isKfcLogsheet = (l) => {
  if (!l || typeof l !== 'object') return false;
  const standard = String(l.certificate_standard || '').toUpperCase();
  const certType = String(l.certificate_type || '').toUpperCase();
  const suggestedCert = String(l.suggested_certificate_type || '').toUpperCase();
  const company = String(l.company_name || l.client_id?.company_name || '').toUpperCase();
  const est = String(l.establishment_name || '').toUpperCase();
  const category = String(l.product_category || '').toUpperCase();
  const prodName = String(l.product_name || '').toUpperCase();
  const scope = String(l.scope || '').toUpperCase();
  const directRef = String(l.direct_ref || '').toUpperCase();
  const logNo = String(l.logsheet_number || '').toUpperCase();
  const auditType = String(l.audit_type || '').toUpperCase();
  const kfcRef = String(l.kfc_ref || '').toUpperCase();

  return (
    Boolean(l.is_kfc) ||
    l.source_type === 'kfc' ||
    l.logsheet_type === 'kfc' ||
    standard.includes('KFC') ||
    certType.includes('KFC') ||
    suggestedCert.includes('KFC') ||
    company.includes('KFC') ||
    company.includes('KENTUCKY') ||
    est.includes('KFC') ||
    est.includes('KENTUCKY') ||
    category.includes('KFC') ||
    prodName.includes('KFC') ||
    scope.includes('KFC') ||
    directRef.includes('KFC') ||
    logNo.includes('KFC') ||
    auditType.includes('KFC') ||
    kfcRef.includes('KFC')
  );
};

export const getLogsheets = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.status) query.append('status', params.status);
  if (params.limit) query.append('limit', params.limit);
  if (params.source_type && params.source_type !== 'kfc') query.append('source_type', params.source_type);
  if (params.client_id) query.append('client_id', params.client_id);
  if (params.application_id) query.append('application_id', params.application_id);

  const qs = query.toString();
  const mainUrl = `/application-logsheets${qs ? `?${qs}` : ''}`;

  try {
    const mainPromise = apiClient(mainUrl).catch(() => ({ data: [] }));
    const directPromise = apiClient('/application-logsheets/direct-history').catch(() => ({ data: [] }));

    const [mainRes, directRes] = await Promise.all([mainPromise, directPromise]);

    const mainList = Array.isArray(mainRes?.data) ? mainRes.data : (Array.isArray(mainRes) ? mainRes : []);
    const directList = Array.isArray(directRes?.data) ? directRes.data : (Array.isArray(directRes) ? directRes : []);

    const seen = new Set();
    const merged = [];

    for (const item of [...mainList, ...directList]) {
      const id = String(item._id || item.id || '');
      if (id) {
        if (!seen.has(id)) {
          seen.add(id);
          merged.push(item);
        }
      } else {
        merged.push(item);
      }
    }

    return { data: merged };
  } catch (err) {
    return apiClient(mainUrl);
  }
};

export const getLogsheetById = async (id) => {
  try {
    const res = await apiClient(`/application-logsheets/${id}`);
    if (res?.data || res?._id) return res;
  } catch (err) {
    // fallback to application search if needed
  }
  return apiClient(`/application-logsheets/application/${id}`).catch(() => null);
};

export const signLogsheet = (id, role, signature_url, signature_name, comment) => apiClient(`/application-logsheets/${id}/sign`, {
  method: 'PUT',
  body: JSON.stringify({ role, signature_url, signature_name, comment })
});

export const getApplicationById = (id) => apiClient(`/applications/${id}`);

export const getAddOnById = (id) => apiClient(`/add-on-applications/${id}`);
