import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import { getLogsheetById, getAddOnById, getApplicationById } from '../api/logsheets';
import { API_BASE, getFileUrl } from '../api/client';
import {
  ArrowLeft,
  Package,
  FileText,
  ExternalLink,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Layers,
  FlaskConical,
  Box,
  Sparkles,
  ClipboardCheck,
  Info
} from 'lucide-react';
import LoadingState from '../components/LoadingState';

// Helper to choose section icon based on field key
function getSectionIcon(key) {
  const k = key.toLowerCase();
  if (k.includes('ingredient') || k.includes('material')) return <Layers size={16} color="var(--primary)" />;
  if (k.includes('aid') || k.includes('process') || k.includes('chemical')) return <FlaskConical size={16} color="var(--primary)" />;
  if (k.includes('animal') || k.includes('derivative') || k.includes('halal')) return <ShieldCheck size={16} color="var(--primary)" />;
  if (k.includes('pack') || k.includes('container')) return <Box size={16} color="var(--primary)" />;
  if (k.includes('product')) return <Package size={16} color="var(--primary)" />;
  return <Sparkles size={16} color="var(--primary)" />;
}

function FormDataViewer({ formData }) {
  if (!formData || typeof formData !== 'object' || Object.keys(formData).length === 0) {
    return null;
  }

  const parseValue = (val) => {
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        try { return JSON.parse(trimmed); } catch (e) { return val; }
      }
    }
    return val;
  };

  const isFileVal = (v) =>
    typeof v === 'string' && v !== '—' && (
      v.startsWith('http://') || v.startsWith('https://') ||
      v.startsWith('/api/files') || v.startsWith('/uploads') ||
      /\.(pdf|png|jpe?g|doc|docx)$/i.test(v)
    );

  const renderField = (k, v) => {
    const raw = v === null || v === undefined || v === '' ? '—' : (typeof v === 'object' ? JSON.stringify(v) : String(v));
    const label = k.replace(/_/g, ' ');
    const isHalal = k.includes('halal') || k.includes('certificate') || k.includes('status');
    const isFile = isFileVal(raw);

    return (
      <div key={k} style={{
        display: 'flex',
        flexDirection: isFile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isFile ? 'flex-start' : 'flex-start',
        gap: isFile ? 6 : 8,
        padding: '8px 0',
        borderBottom: '1px solid var(--divider)',
        flexWrap: 'wrap',
      }}>
        <span style={{ color: 'var(--text-3)', fontSize: 12, fontWeight: 600, textTransform: 'capitalize', flexShrink: 0, minWidth: 100, maxWidth: '50%' }}>
          {label}
        </span>
        {isFile ? (
          <a
            href={getFileUrl(raw)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              color: 'var(--primary)', fontWeight: 600, fontSize: 12,
              textDecoration: 'none', background: 'var(--primary-subtle)',
              padding: '6px 10px', borderRadius: 8, border: '1px solid var(--primary-border)',
              width: '100%', boxSizing: 'border-box', justifyContent: 'center'
            }}
          >
            <ExternalLink size={13} /> View Document
          </a>
        ) : isHalal && raw !== '—' ? (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: 'var(--primary-subtle)', color: 'var(--primary)',
            padding: '3px 8px', borderRadius: 6, fontWeight: 600, fontSize: 11
          }}>
            <CheckCircle2 size={11} /> {raw}
          </span>
        ) : (
          <span style={{ color: 'var(--text-1)', fontWeight: 600, fontSize: 13, textAlign: 'right', wordBreak: 'break-word', flex: 1 }}>
            {raw}
          </span>
        )}
      </div>
    );
  };

  const renderSection = (key, rawData) => {
    const data = parseValue(rawData);
    const title = key.replace(/_/g, ' ').toUpperCase();
    const icon = getSectionIcon(key);

    if (Array.isArray(data)) {
      if (data.length === 0) return null;

      if (typeof data[0] === 'object' && data[0] !== null) {
        return (
          <div key={key} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {icon}
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)', textTransform: 'uppercase' }}>{title}</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--primary)', background: 'var(--primary-subtle)', padding: '2px 8px', borderRadius: 99 }}>
                {data.length} item{data.length > 1 ? 's' : ''}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.map((row, rIdx) => {
                const titleVal = row.name || row.product_name || row.packaging_material || row.constituent || `Item #${rIdx + 1}`;
                return (
                  <div key={rIdx} style={{ background: '#ffffff', borderRadius: 12, border: '1px solid var(--border)', padding: '12px 14px', boxShadow: 'var(--shadow-xs)' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', marginBottom: 4, paddingBottom: 6, borderBottom: '1px solid var(--divider)' }}>
                      #{rIdx + 1}. {typeof titleVal === 'object' ? JSON.stringify(titleVal) : String(titleVal)}
                    </div>
                    {Object.entries(row).map(([k, v]) => renderField(k, v))}
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      // Primitive array
      return (
        <div key={key} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            {icon} {title}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {data.map((item, i) => (
              <span key={i} style={{ background: '#ffffff', border: '1px solid var(--border)', padding: '4px 10px', borderRadius: 8, fontSize: 12, color: 'var(--text-1)', fontWeight: 500 }}>
                {String(item)}
              </span>
            ))}
          </div>
        </div>
      );
    }

    if (typeof data === 'object' && data !== null) {
      return (
        <div key={key} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            {icon} {title}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {Object.entries(data).map(([k, v]) => renderField(k, v))}
          </div>
        </div>
      );
    }

    // Scalar
    const displayVal = String(data);
    const isYesNo = ['yes', 'no', 'true', 'false'].includes(displayVal.toLowerCase());
    const isPositive = ['yes', 'true'].includes(displayVal.toLowerCase());

    return (
      <div key={key} style={{ background: '#ffffff', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
        <span style={{ color: 'var(--text-3)', fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>
          {key.replace(/_/g, ' ')}
        </span>
        {isYesNo ? (
          <span style={{
            fontSize: 11, fontWeight: 700,
            color: isPositive ? 'var(--primary)' : 'var(--text-3)',
            background: isPositive ? 'var(--primary-subtle)' : '#f1f5f9',
            padding: '3px 10px', borderRadius: 99, display: 'inline-flex', alignItems: 'center', gap: 4
          }}>
            {isPositive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
            {displayVal.toUpperCase()}
          </span>
        ) : (
          <strong style={{ color: 'var(--text-1)', fontSize: 13, wordBreak: 'break-word' }}>{displayVal}</strong>
        )}
      </div>
    );
  };

  const entries = Object.entries(formData);
  const complexEntries = [];
  const simpleEntries = [];

  entries.forEach(([key, rawValue]) => {
    const val = parseValue(rawValue);
    if (Array.isArray(val) || (typeof val === 'object' && val !== null)) {
      complexEntries.push([key, val]);
    } else {
      simpleEntries.push([key, val]);
    }
  });

  return (
    <div style={{ marginTop: 10 }}>
      {simpleEntries.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid var(--border)', padding: '0 14px', marginBottom: 14 }}>
          {simpleEntries.map(([k, v]) => renderSection(k, v))}
        </div>
      )}
      {complexEntries.map(([k, v]) => renderSection(k, v))}
    </div>
  );
}

export default function ProductDetail() {
  const { id, prodIdx } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const indexNum = parseInt(prodIdx, 10);

  const [logsheet, setLogsheet] = useState(state?.logsheet || null);
  const [appData, setAppData] = useState(state?.app || null);
  const [loading, setLoading] = useState(!state?.app);

  useEffect(() => {
    if (appData) return;

    // Fetch data if accessed directly
    async function loadData() {
      setLoading(true);
      try {
        if (id) {
          const token = localStorage.getItem('token');
          const headers = token ? { Authorization: `Bearer ${token}` } : {};

          // Check if id is a logsheet id or an addon id
          const lsRes = await getLogsheetById(id).catch(() => null);
          const ls = lsRes?.data || lsRes;
          if (ls && ls._id) {
            setLogsheet(ls);
            const addonId = ls.addon_application_id?._id || ls.addon_application_id;
            const appId = ls.application_id?._id || ls.application_id;

            let loadedApp = null;
            if (addonId) {
              loadedApp = await getAddOnById(addonId).catch(() => null);
            } else if (appId) {
              loadedApp = await getApplicationById(appId).catch(() => null);
            }

            const appResult = loadedApp?.data || loadedApp;
            if (appResult && (appResult._id || appResult.products || appResult.product_approval_form)) {
              setAppData(appResult);
            } else {
              // Fallback search
              const allAddonsRes = await fetch(`${API_BASE}/add-on-applications`, { headers }).then(r => r.json()).catch(() => null);
              const list = allAddonsRes?.data || (Array.isArray(allAddonsRes) ? allAddonsRes : []);
              const clientId = ls.client_id?._id || ls.client_id?.id || ls.client_id;
              const companyName = (ls.company_name || '').toLowerCase().trim();

              const match = list.find(a => {
                const aClientId = a.client_id?._id || a.client_id?.id || a.client_id;
                const aCompany = (a.client_id?.company_name || a.company_name || '').toLowerCase().trim();
                return (clientId && aClientId === clientId) || (companyName && aCompany === companyName);
              });
              if (match) setAppData(match);
            }
          } else {
            // Try fetching directly as addon
            const res = await getAddOnById(id).catch(() => null);
            if (res) {
              setAppData(res.data || res);
            }
          }
        }
      } catch (err) {
        console.error('Error loading product form details', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id, appData]);

  if (loading) return <LoadingState />;
  if (!appData && !state?.product) {
    return (
      <div style={{ padding: 16 }}>
        <button className="btn btn-secondary" onClick={() => navigate(-1)} style={{ width: 'auto', padding: '10px 18px' }}>
          <ArrowLeft size={16} /> Go Back
        </button>
        <p style={{ marginTop: 16, color: 'var(--text-3)' }}>Product details not found.</p>
      </div>
    );
  }

  const addOnProducts = Array.isArray(appData?.products) && appData.products.length > 0 ? appData.products : [];
  const certProducts = Array.isArray(appData?.certificate_id?.products_covered)
    ? appData.certificate_id.products_covered.map(p => typeof p === 'string' ? { name: p, isExisting: true } : p)
    : [];
  const legacyProduct = appData?.new_product_name ? [{ name: appData.new_product_name, type: 'Add product', isNew: true }] : [];

  const responsesList = Array.isArray(appData?.product_approval_form?.product_responses)
    ? appData.product_approval_form.product_responses
    : (Array.isArray(logsheet?.product_approval_form?.product_responses) ? logsheet.product_approval_form.product_responses : []);

  let allProductItems = addOnProducts.length > 0 ? addOnProducts : [...legacyProduct, ...certProducts];
  if (allProductItems.length === 0 && responsesList.length > 0) {
    allProductItems = responsesList.map((r, i) => ({
      name: r.product_name || `Product #${r.product_index !== undefined ? r.product_index + 1 : i + 1}`,
      code: r.form_data?.code || r.form_data?.product_code,
      type: 'Add-on Product',
      response: r
    }));
  }

  const product = allProductItems[indexNum] || state?.product || responsesList[indexNum];

  if (!product) {
    return (
      <div style={{ padding: 16 }}>
        <button className="btn btn-secondary" onClick={() => navigate(-1)} style={{ width: 'auto', padding: '10px 18px' }}>
          <ArrowLeft size={16} /> Go Back
        </button>
        <p style={{ marginTop: 16, color: 'var(--text-3)' }}>Product not found.</p>
      </div>
    );
  }

  const prodName = typeof product === 'string' ? product : (product.name || product.product_name || 'Unnamed Product');
  const prodType = product.type || (product.isExisting ? 'Existing Covered Product' : (product.isNew ? 'New Product' : null));
  const prodCode = product.code || product.product_code;
  const sn = product.sn || (indexNum + 1);

  const prodResponse = Array.isArray(responsesList)
    ? (responsesList.find(r => r.product_index === indexNum || (prodName && r.product_name?.toLowerCase() === prodName?.toLowerCase())) || responsesList[indexNum])
    : null;

  const formRequested = appData?.status === 'product_approval_form_enabled' || Boolean(appData?.product_approval_form?.sent_at);
  const companyName = logsheet?.company_name || appData?.client_id?.company_name || appData?.company_name || appData?.establishment_name || 'Company';

  return (
    <>
      <div className="app-content" style={{ paddingBottom: 100 }}>

        {/* Back + title row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'var(--primary-subtle)', border: 'none', color: 'var(--primary)', cursor: 'pointer', borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}
          >
            <ArrowLeft size={15} /> Back
          </button>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>Product #{sn} Detail</span>
        </div>

        {/* Product Hero Card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Package size={20} color="var(--primary)" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>
                {sn}. {prodName}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 4 }}>
                {prodCode && (
                  <span style={{ fontSize: 12, color: 'var(--text-3)', background: 'var(--bg)', padding: '2px 8px', borderRadius: 6 }}>
                    Code: {prodCode}
                  </span>
                )}
                {prodType && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--primary)', background: 'var(--primary-subtle)', padding: '2px 8px', borderRadius: 99 }}>
                    {prodType}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Company Info Row */}
        <div className="card" style={{ padding: '4px 16px' }}>
          <div className="detail-row">
            <div className="detail-label">Company</div>
            <div className="detail-value">{companyName}</div>
          </div>
          {appData?.status && (
            <div className="detail-row">
              <div className="detail-label">Status</div>
              <div className="detail-value">
                <StatusBadge status={appData.status} />
              </div>
            </div>
          )}
        </div>

        {/* Client Approval Form Submission Section */}
        <div style={{ marginTop: 16 }}>
          <p className="section-heading" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileText size={16} /> Client Filled Approval Form
          </p>

          {prodResponse ? (
            <div className="card" style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, borderBottom: '1px solid var(--divider)', paddingBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ClipboardCheck size={14} /> SUBMITTED RESPONSE
                </span>
                {prodResponse.saved_at && (
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                    {new Date(prodResponse.saved_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>

              {prodResponse.response_text && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4 }}>
                    CLIENT RESPONSE / NOTES
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-1)', background: 'var(--bg)', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', lineHeight: 1.4 }}>
                    {prodResponse.response_text}
                  </div>
                </div>
              )}

              {/* Mobile-First Form Data Viewer */}
              {prodResponse.form_data && (
                <FormDataViewer formData={prodResponse.form_data} />
              )}

              {prodResponse.response_url ? (
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--divider)' }}>
                  <a
                    href={getFileUrl(prodResponse.response_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      width: '100%',
                      fontSize: 13,
                      color: 'var(--primary)',
                      fontWeight: 600,
                      textDecoration: 'none',
                      background: 'var(--primary-subtle)',
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1px solid var(--primary-border)'
                    }}
                  >
                    <ExternalLink size={15} /> View Attached Client Document
                  </a>
                </div>
              ) : (
                <div style={{ fontSize: 12, color: 'var(--text-3)', fontStyle: 'italic', marginTop: 8 }}>
                  No file attachment uploaded by client.
                </div>
              )}
            </div>
          ) : (
            <div className="card" style={{ padding: 16, textAlign: 'center' }}>
              <FileText size={22} color="var(--text-3)" style={{ marginBottom: 4 }} />
              <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>
                {formRequested ? 'Client approval form response is pending submission.' : 'Product Approval Form has not been requested or filled yet.'}
              </p>
            </div>
          )}
        </div>

        {/* Form Template Reference if available */}
        {appData?.product_approval_form?.form_file_url && (
          <div className="card" style={{ marginTop: 12, padding: '12px 14px', background: 'var(--primary-subtle)', border: '1px solid var(--primary-border)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Info size={14} /> Form Template
            </div>
            <a
              href={getFileUrl(appData.product_approval_form.form_file_url)}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4 }}
            >
              <ExternalLink size={13} /> View Product Approval Form Template
            </a>
          </div>
        )}
      </div>
    </>
  );
}
