import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import { getLogsheetById, getApplicationById, getAddOnById, signLogsheet } from '../api/logsheets';
import { API_BASE, getFileUrl } from '../api/client';
import {
  ArrowLeft,
  PenLine,
  CheckCircle,
  Calendar,
  FileText,
  Package,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Layers
} from 'lucide-react';
import LoadingState from '../components/LoadingState';
import Toast from '../components/Toast';

const ROLES = [
  { value: 'mufti',   label: "Shari'a Member (Mufti 1)" },
  { value: 'mufti2',  label: "Shari'a Member (Mufti 2)" },
  { value: 'manager', label: 'Certification Manager' },
  { value: 'ceo',     label: 'CEO' },
];

function SigStatus({ name }) {
  return name ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <CheckCircle size={13} color="var(--status-done-text)" />
      <span style={{ fontSize: 12, color: 'var(--status-done-text)', fontWeight: 600 }}>{name}</span>
    </div>
  ) : (
    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Pending</span>
  );
}

export default function LogsheetDetail() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const [logsheet, setLogsheet] = useState(state?.logsheet || null);
  const [loadingLogsheet, setLoadingLogsheet] = useState(!state?.logsheet);
  const [appDetails, setAppDetails] = useState(state?.app || null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [showSignModal, setShowSignModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState('mufti');
  const [submitting, setSubmitting] = useState(false);
  const [mySig, setMySig] = useState(null);
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'info') => setToast({ message, type });

  useEffect(() => {
    const stored = localStorage.getItem('my_signature');
    if (stored) {
      try {
        setMySig(JSON.parse(stored));
      } catch (e) {}
    }
  }, []);

  // 1. Fetch Logsheet if not in state
  useEffect(() => {
    if (!logsheet && id) {
      setLoadingLogsheet(true);
      getLogsheetById(id)
        .then(res => {
          const ls = res.data || res;
          setLogsheet(ls);
        })
        .catch(err => console.error('Failed to load logsheet', err))
        .finally(() => setLoadingLogsheet(false));
    }
  }, [id, logsheet]);

  // 2. Fetch associated Application or AddOn Application details
  useEffect(() => {
    if (!logsheet) return;

    const addonObj = logsheet.addon_application_id;
    const addonId = typeof addonObj === 'object' && addonObj?._id ? addonObj._id : addonObj;

    const appObj = logsheet.application_id;
    const appId = typeof appObj === 'object' && appObj?._id ? appObj._id : appObj;

    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const tryFallbackAddon = () => {
      fetch(`${API_BASE}/add-on-applications`, { headers })
        .then(r => r.json())
        .then(res => {
          const list = res.data || (Array.isArray(res) ? res : []);
          const clientId = logsheet.client_id?._id || logsheet.client_id?.id || logsheet.client_id;
          const companyName = (logsheet.company_name || '').toLowerCase().trim();

          const match = list.find(a => {
            const aClientId = a.client_id?._id || a.client_id?.id || a.client_id;
            const aCompany = (a.client_id?.company_name || a.company_name || '').toLowerCase().trim();
            return (clientId && aClientId === clientId) || (companyName && aCompany && aCompany === companyName);
          });

          if (match) {
            setAppDetails(match);
          }
        })
        .catch(console.error);
    };

    if (addonId) {
      setLoadingDetails(true);
      getAddOnById(addonId)
        .then(res => {
          const data = res.data || res;
          if (data && (data._id || data.products || data.product_approval_form)) {
            setAppDetails(data);
          } else {
            tryFallbackAddon();
          }
        })
        .catch(() => tryFallbackAddon())
        .finally(() => setLoadingDetails(false));
    } else if (appId) {
      setLoadingDetails(true);
      getApplicationById(appId)
        .then(res => {
          const data = res.data || res;
          if (data && (data._id || (data.products && data.products.length > 0))) {
            setAppDetails(data);
          } else {
            tryFallbackAddon();
          }
        })
        .catch(() => tryFallbackAddon())
        .finally(() => setLoadingDetails(false));
    } else {
      tryFallbackAddon();
    }
  }, [logsheet]);

  if (loadingLogsheet) return <LoadingState />;

  if (!logsheet) {
    return (
      <div style={{ padding: 16 }}>
        <button className="btn btn-secondary" onClick={() => navigate(-1)} style={{ width: 'auto', padding: '10px 18px' }}>
          <ArrowLeft size={16} /> Go Back
        </button>
        <p style={{ marginTop: 16, color: 'var(--text-3)' }}>Logsheet not found.</p>
      </div>
    );
  }

  const isCompleted = logsheet.status?.includes('Waiting For Certificate') || logsheet.status?.includes('Completed');
  const totalSigned = [logsheet.mufti_signature, logsheet.mufti2_signature, logsheet.manager_signature, logsheet.ceo_signature].filter(Boolean).length;

  const handleSign = async () => {
    if (!mySig?.signature_url) {
      showToast('No stored signature found. Please set up your signature in the Signature tab first.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await signLogsheet(logsheet._id || logsheet.id, selectedRole, mySig.signature_url, mySig.name, '');
      setShowSignModal(false);
      showToast('Logsheet signed successfully! ✓', 'success');
      // Wait for the toast to be visible before navigating away
      setTimeout(() => navigate(-1), 2000);
    } catch (err) {
      showToast(err.message || 'Failed to sign logsheet', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Extract products from all potential places
  const rawAddonProducts = Array.isArray(appDetails?.products) && appDetails.products.length > 0 ? appDetails.products : [];
  const certProducts = Array.isArray(appDetails?.certificate_id?.products_covered)
    ? appDetails.certificate_id.products_covered.map(p => typeof p === 'string' ? { name: p, isExisting: true } : p)
    : [];
  const legacyProduct = appDetails?.new_product_name ? [{ name: appDetails.new_product_name, type: 'Add product', isNew: true }] : [];

  const formResponses = Array.isArray(appDetails?.product_approval_form?.product_responses)
    ? appDetails.product_approval_form.product_responses
    : (Array.isArray(logsheet?.product_approval_form?.product_responses) ? logsheet.product_approval_form.product_responses : []);

  let allProductItems = rawAddonProducts.length > 0 ? rawAddonProducts : [...legacyProduct, ...certProducts];

  // If no explicit product array exists but client submitted product responses, construct products list
  if (allProductItems.length === 0 && formResponses.length > 0) {
    allProductItems = formResponses.map((r, i) => ({
      name: r.product_name || `Product #${r.product_index !== undefined ? r.product_index + 1 : i + 1}`,
      code: r.form_data?.code || r.form_data?.product_code,
      type: 'Add-on Product',
      response: r
    }));
  }

  // If still empty, check if logsheet has product_category containing products (e.g. "Sugar, Salt, Sweet, Maggi")
  if (allProductItems.length === 0 && logsheet?.product_category && logsheet.product_category.includes(',')) {
    const parsedNames = logsheet.product_category.split(',').map(s => s.trim()).filter(Boolean);
    if (parsedNames.length > 0) {
      allProductItems = parsedNames.map((name, i) => ({
        name,
        type: 'Product',
        sn: i + 1
      }));
    }
  }

  const isAddon = logsheet.source_type === 'addon_application' || Boolean(logsheet.addon_application_id) || Boolean(appDetails?.action_type);

  return (
    <>
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
      <div className="app-content" style={{ paddingBottom: 100 }}>

        {/* Back + title row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'var(--primary-subtle)', border: 'none', color: 'var(--primary)', cursor: 'pointer', borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}
          >
            <ArrowLeft size={15} /> Back
          </button>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>Logsheet Detail</span>
        </div>

        {/* Hero Card */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>
                {logsheet.company_name || appDetails?.client_id?.company_name || 'Applicant Company'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-3)' }}>
                {logsheet.audit_type || (isAddon ? 'Add-on Application' : 'Halal Audit')}
              </div>
            </div>
            <StatusBadge status={logsheet.status} />
          </div>

          {/* Signature Progress */}
          <div style={{ marginTop: 12, background: 'var(--primary-subtle)', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>Committee Signatures</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>{totalSigned}/4</span>
            </div>
            <div style={{ height: 4, background: 'var(--primary-border)', borderRadius: 99 }}>
              <div style={{ height: '100%', width: `${(totalSigned / 4) * 100}%`, background: 'var(--primary)', borderRadius: 99, transition: 'width 0.4s ease' }} />
            </div>
          </div>
        </div>

        {/* Assessment Card */}
        <p className="section-heading">Logsheet Assessment</p>
        <div className="card" style={{ padding: '4px 16px' }}>
          {[
            { label: 'Auditors', value: logsheet.auditors || '—' },
            { label: 'NCs Close Status', value: logsheet.ncs_close || '—' },
            { label: 'Documentation Status', value: logsheet.docs_satisfactory || '—' },
            { label: 'Pork-Free Statement', value: logsheet.pork_free_statement || '—' },
            { label: 'Annual Certificate', value: logsheet.annual_certificate || '—' },
            { label: 'Batch Certificate', value: logsheet.batch_certificate || '—' },
            { label: 'Reviewed By', value: logsheet.reviewed_by || logsheet.reviewer_name || '—' },
            { label: 'Logsheet Comment', value: logsheet.comment || 'None' },
          ].map(({ label, value }) => (
            <div key={label} className="detail-row">
              <div className="detail-label">{label}</div>
              <div className="detail-value">{value}</div>
            </div>
          ))}
        </div>

        {/* Assigned Products & Approval Form Section */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <p className="section-heading" style={{ margin: 0 }}>
              Assigned Products & Approval Forms ({allProductItems.length})
            </p>
          </div>

          {loadingDetails && <LoadingState />}

          {!loadingDetails && allProductItems.length === 0 && (
            <div className="card" style={{ padding: 16, textAlign: 'center' }}>
              <Package size={22} color="var(--text-3)" style={{ marginBottom: 4 }} />
              <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>
                No products found for this logsheet.
              </p>
            </div>
          )}

          {allProductItems.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {allProductItems.map((prod, idx) => {
                const prodName = typeof prod === 'string' ? prod : (prod.name || 'Unnamed Product');
                const prodType = prod.type || (prod.isExisting ? 'Existing Covered' : (prod.isNew ? 'New Product' : null));
                const prodCode = prod.code;
                const sn = prod.sn || (idx + 1);

                // Find corresponding filled response
                const hasResp = formResponses.find(r => r.product_index === idx || (prodName && r.product_name?.toLowerCase() === prodName?.toLowerCase()));

                return (
                  <div
                    key={idx}
                    className="card"
                    onClick={() => navigate(`/logsheet/${logsheet._id || logsheet.id}/product/${idx}`, {
                      state: { app: appDetails, logsheet, product: prod, index: idx }
                    })}
                    style={{
                      padding: '14px 16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      border: hasResp ? '1.5px solid var(--primary-border)' : '1px solid var(--border)',
                      boxShadow: 'var(--shadow-xs)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Package size={20} color="var(--primary)" />
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {sn}. {prodName}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 4 }}>
                          {prodCode && (
                            <span style={{ fontSize: 11, color: 'var(--text-3)', background: 'var(--bg)', padding: '1px 6px', borderRadius: 4 }}>
                              Code: {prodCode}
                            </span>
                          )}
                          {prodType && (
                            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--primary)', background: 'var(--primary-subtle)', padding: '1px 6px', borderRadius: 4 }}>
                              {prodType}
                            </span>
                          )}
                          {hasResp ? (
                            <span style={{ fontSize: 11, color: 'var(--status-done-text)', background: 'var(--status-done-bg)', padding: '1px 6px', borderRadius: 4, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                              <CheckCircle2 size={11} /> Filled Form
                            </span>
                          ) : (
                            <span style={{ fontSize: 11, color: 'var(--text-3)', fontStyle: 'italic' }}>
                              Tap to view
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>View Form</span>
                      <ChevronRight size={18} color="var(--primary)" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Context Information */}
        {!loadingDetails && appDetails && (
          <div style={{ marginTop: 14 }}>
            <p className="section-heading">
              {isAddon ? 'Add-on Details' : 'Application Details'}
            </p>
            <div className="card" style={{ padding: '4px 16px' }}>
              {isAddon ? (
                [
                  { label: 'Contact Person', value: appDetails.contact_name || '—' },
                  { label: 'Contact Email', value: appDetails.contact_email || '—' },
                  { label: 'Contact Phone', value: appDetails.contact_phone || '—' },
                  { label: 'Action Type', value: appDetails.action_type?.toUpperCase() || '—' },
                  { label: 'Client Message', value: appDetails.message || '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="detail-row">
                    <div className="detail-label">{label}</div>
                    <div className="detail-value">{value}</div>
                  </div>
                ))
              ) : (
                [
                  { label: 'Application No.', value: appDetails.application_number || '—' },
                  { label: 'Type', value: appDetails.application_type || '—' },
                  { label: 'Category', value: appDetails.category || '—' },
                  { label: 'Establishment Name', value: appDetails.establishment_name || '—' },
                  { label: 'Scope', value: appDetails.scope || '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="detail-row">
                    <div className="detail-label">{label}</div>
                    <div className="detail-value">{value}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Signature Status */}
        <p className="section-heading" style={{ marginTop: 16 }}>Signature Status</p>
        <div className="sig-grid">
          {[
            { label: 'Mufti 1', name: logsheet.mufti_sign_name },
            { label: 'Mufti 2', name: logsheet.mufti2_sign_name },
            { label: 'Manager', name: logsheet.manager_sign_name },
            { label: 'CEO', name: logsheet.ceo_sign_name },
          ].map(({ label, name }) => (
            <div key={label} className="sig-cell">
              <div className="sig-cell-dot" style={{ background: name ? 'var(--status-done-text)' : 'var(--text-3)' }} />
              <div>
                <div className="sig-cell-label">{label}</div>
                <SigStatus name={name} />
              </div>
            </div>
          ))}
        </div>

        {/* Action */}
        {!isCompleted && (
          <button className="btn btn-primary" onClick={() => setShowSignModal(true)} style={{ marginTop: 16, borderRadius: 14, padding: 14 }}>
            <PenLine size={18} /> Sign Logsheet
          </button>
        )}

        {isCompleted && (
          <div className="card" style={{ textAlign: 'center', background: 'var(--status-done-bg)', border: '1px solid var(--primary-border)', marginTop: 16 }}>
            <CheckCircle size={22} color="var(--primary)" style={{ marginBottom: 6 }} />
            <p style={{ color: 'var(--primary)', fontWeight: 600, fontSize: 14 }}>All signatures complete</p>
          </div>
        )}
      </div>

      {/* Sign Modal */}
      {showSignModal && (
        <div className="modal-overlay">
          <div className="modal-sheet">
            <h2 className="modal-title">Sign as Committee Member</h2>
            <p className="modal-message">Your saved signature (<strong>{mySig?.name || 'Not set'}</strong>) will be attached under the selected role.</p>

            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 10 }}>Select your role</p>
            <div className="chip-group" style={{ marginBottom: 20 }}>
              {ROLES.map(r => (
                <button
                  key={r.value}
                  className={`chip${selectedRole === r.value ? ' selected' : ''}`}
                  onClick={() => setSelectedRole(r.value)}
                  type="button"
                >
                  {r.label}
                </button>
              ))}
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowSignModal(false)} disabled={submitting}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSign} disabled={submitting}>
                {submitting ? <span className="spinner" /> : 'Confirm Signature'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}