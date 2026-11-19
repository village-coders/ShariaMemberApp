import { apiClient } from './client';

export const isExtensionLogsheet = (l) => {
  if (!l || typeof l !== 'object') return false;
  return (
    Boolean(l.is_extension) ||
    Boolean(l.extension_application_id) ||
    l.source_type === 'extension' ||
    l.logsheet_type === 'extension' ||
    String(l.audit_type || '').toLowerCase().includes('extension') ||
    String(l.certificate_standard || '').toLowerCase().includes('extension') ||
    Boolean(l.extension_duration_type || l.extension_days || l.justification)
  );
};

function normalizeExtensionAppToLogsheet(extApp) {
  if (!extApp || !extApp.logsheet_id || typeof extApp.logsheet_id !== 'object') return null;
  const ls = extApp.logsheet_id;
  const appId = String(extApp._id || extApp.id);
  const lsId = String(ls._id || ls.id || appId);
  const ref = extApp.application_number || `EXT-${appId.slice(-6).toUpperCase()}`;

  return {
    ...ls,
    _id: lsId,
    id: lsId,
    is_extension: true,
    is_extension_collection: true,
    source_type: 'extension',
    logsheet_type: 'extension',
    extension_application_id: appId,
    extension_app: extApp,
    application_number: extApp.application_number,
    logsheet_number: ls.logsheet_number || ref,
    direct_ref: ls.direct_ref || ref,
    company_name: ls.company_name || extApp.company_name || extApp.client_id?.company_name || extApp.client_id?.business_name || 'Applicant Company',
    site_name: extApp.site_name || extApp.site_id?.name || '',
    manufacturing_address: ls.facility_address || extApp.site_id?.address_1 || '',
    company_address: ls.facility_address || extApp.client_id?.address || '',
    contact_person: ls.contact_person || extApp.contact_person || extApp.client_id?.full_name || '',
    contact_email: extApp.contact_email || extApp.client_id?.email || '',
    audit_type: 'Certificate Extension Review',
    certificate_standard: ls.certificate_type || ls.suggested_certificate_type || ls.scheme || 'Extension Logsheet',
    comment: ls.comments || ls.comment || '',
    status: ls.status || 'Waiting for Signature',
    created_at: ls.created_at || extApp.created_at || extApp.createdAt,
    createdAt: ls.created_at || extApp.created_at || extApp.createdAt,
  };
}

export const getLogsheets = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.status) query.append('status', params.status);
  if (params.limit) query.append('limit', params.limit);
  if (params.source_type && params.source_type !== 'extension') {
    query.append('source_type', params.source_type);
  }
  if (params.client_id) query.append('client_id', params.client_id);
  if (params.application_id) query.append('application_id', params.application_id);

  const qs = query.toString();
  const mainUrl = `/application-logsheets${qs ? `?${qs}` : ''}`;

  try {
    const mainPromise = apiClient(mainUrl).catch(() => ({ data: [] }));
    const directPromise = apiClient('/application-logsheets/direct-history').catch(() => ({ data: [] }));
    const extPromise = apiClient('/extension-applications').catch(() => ({ data: [] }));

    const [mainRes, directRes, extRes] = await Promise.all([mainPromise, directPromise, extPromise]);

    const mainList = Array.isArray(mainRes?.data) ? mainRes.data : (Array.isArray(mainRes) ? mainRes : []);
    const directList = Array.isArray(directRes?.data) ? directRes.data : (Array.isArray(directRes) ? directRes : []);
    const extApps = Array.isArray(extRes?.data) ? extRes.data : (Array.isArray(extRes) ? extRes : []);

    const extLogsheets = extApps
      .map(normalizeExtensionAppToLogsheet)
      .filter(Boolean);

    const seen = new Set();
    const merged = [];

    for (const item of [...mainList, ...directList, ...extLogsheets]) {
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

export const getLogsheetById = async (id, stateLogsheet = null) => {
  if (stateLogsheet?.is_extension_collection && stateLogsheet?.extension_application_id) {
    try {
      const extAppRes = await apiClient(`/extension-applications/${stateLogsheet.extension_application_id}`);
      const extApp = extAppRes?.data || extAppRes;
      const normalized = normalizeExtensionAppToLogsheet(extApp);
      if (normalized) return { data: normalized };
    } catch (err) {
      // fall through
    }
  }

  try {
    const res = await apiClient(`/application-logsheets/${id}`);
    if (res?.data || res?._id) return res;
  } catch (err) {
    // fallback to extension applications or application_id search
  }

  try {
    const extRes = await apiClient('/extension-applications');
    const extApps = Array.isArray(extRes?.data) ? extRes.data : (Array.isArray(extRes) ? extRes : []);
    const match = extApps.find(a =>
      String(a._id) === String(id) ||
      String(a.logsheet_id?._id || a.logsheet_id) === String(id)
    );
    if (match) {
      const normalized = normalizeExtensionAppToLogsheet(match);
      if (normalized) return { data: normalized };
    }
  } catch (err) {
    // ignore
  }

  return apiClient(`/application-logsheets/application/${id}`).catch(() => null);
};

export const signLogsheet = (id, role, signature_url, signature_name, comment, logsheet = null) => {
  if (logsheet?.is_extension_collection && logsheet?.extension_application_id) {
    return apiClient(`/extension-applications/${logsheet.extension_application_id}/logsheet/sign`, {
      method: 'PUT',
      body: JSON.stringify({
        signature_role: role,
        signature_data: signature_url,
        signer_name: signature_name,
        comment
      })
    });
  }

  return apiClient(`/application-logsheets/${id}/sign`, {
    method: 'PUT',
    body: JSON.stringify({ role, signature_url, signature_name, comment })
  });
};

export const getApplicationById = (id) => apiClient(`/applications/${id}`);

export const getAddOnById = (id) => apiClient(`/add-on-applications/${id}`);
