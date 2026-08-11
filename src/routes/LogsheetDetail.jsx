import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import { signLogsheet, getApplicationById, getAddOnById } from '../api/logsheets';
import { ArrowLeft, PenLine, CheckCircle, User, Calendar, FileText, Clipboard, Package, ShieldAlert, Check } from 'lucide-react';
import LoadingState from '../components/LoadingState';

const ROLES = [
  { value: 'mufti',   label: "Shari'a Member (Mufti 1)" },
  { value: 'mufti2',  label: "Shari'a Member (Mufti 2)" },
  { value: 'manager', label: 'Certification Manager' },
  { value: 'ceo',     label: 'CEO' },
];

function SigStatus({ name, date }) {
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
  const logsheet = state?.logsheet;

  const [showSignModal, setShowSignModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState('mufti');
  const [submitting, setSubmitting] = useState(false);
  const [mySig, setMySig] = useState(null);

  const [appDetails, setAppDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('my_signature');
    if (stored) setMySig(JSON.parse(stored));
  }, []);

  useEffect(() => {
    if (!logsheet) return;
    const appId = logsheet.application_id?._id || logsheet.application_id;
    const addonId = logsheet.addon_application_id?._id || logsheet.addon_application_id;

    if (logsheet.source_type === 'addon_application' && addonId) {
      setLoadingDetails(true);
      getAddOnById(addonId)
        .then(res => setAppDetails(res.data || res))
        .catch(err => console.error('Failed to load add-on application details', err))
        .finally(() => setLoadingDetails(false));
    } else if (appId) {
      setLoadingDetails(true);
      getApplicationById(appId)
        .then(res => setAppDetails(res.data || res))
        .catch(err => console.error('Failed to load application details', err))
        .finally(() => setLoadingDetails(false));
    }
  }, [logsheet]);

  if (!logsheet) {
    return (
      <div style={{ padding: 16 }}>
        <button className="btn btn-secondary" onClick={() => navigate(-1)} style={{ width: 'auto', padding: '10px 18px' }}>
          Go Back
        </button>
        <p style={{ marginTop: 16, color: 'var(--text-3)' }}>Logsheet not found.</p>
      </div>
    );
  }

  const isCompleted = logsheet.status?.includes('Waiting For Certificate') || logsheet.status?.includes('Completed');
  const totalSigned = [logsheet.mufti_sign_name, logsheet.mufti2_sign_name, logsheet.manager_sign_name, logsheet.ceo_sign_name].filter(Boolean).length;

  const handleSign = async () => {
    if (!mySig?.signature_url) {
      alert('No stored signature found. Please set up your signature in the Signature tab first.');
      return;
    }
    setSubmitting(true);
    try {
      await signLogsheet(logsheet._id || logsheet.id, selectedRole, mySig.signature_url, mySig.name, '');
      alert('Logsheet signed successfully!');
      navigate(-1);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
      setShowSignModal(false);
    }
  };

  return (
    <>
      <div style={{ background: 'var(--primary)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 50 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', cursor: 'pointer', borderRadius: 8, padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 500 }}>
          <ArrowLeft size={16} /> Back
        </button>
        <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 600 }}>Logsheet Detail</span>
      </div>

      <div className="app-content" style={{ paddingBottom: 100 }}>
        {/* Hero */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>{logsheet.company_name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-3)' }}>{logsheet.audit_type}</div>
            </div>
            <StatusBadge status={logsheet.status} />
          </div>
          {/* Signature progress */}
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

        {/* Audit Info */}
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

        {/* Dynamic Context Details & Products */}
        {loadingDetails && <LoadingState />}
        {!loadingDetails && appDetails && (
          <>
            {logsheet.source_type === 'addon_application' ? (
              <>
                <p className="section-heading" style={{ marginTop: 16 }}>Add-on Details</p>
                <div className="card" style={{ padding: '4px 16px' }}>
                  {[
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
                  ))}
                </div>

                <p className="section-heading" style={{ marginTop: 16 }}>Add-on Products</p>
                {appDetails.products && appDetails.products.length > 0 ? (
                  appDetails.products.map((prod, idx) => (
                    <div key={idx} className="card" style={{ padding: '12px 14px', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Package size={15} color="var(--primary)" />
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{prod.name}</span>
                        {prod.code && <span style={{ fontSize: 12, color: 'var(--text-3)' }}>({prod.code})</span>}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
                        Action: <strong style={{ color: 'var(--primary)' }}>{prod.type}</strong>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="card" style={{ padding: 12, textAlign: 'center', color: 'var(--text-3)' }}>
                    No products specified in add-on.
                  </div>
                )}

                {/* Product Approval Form Details */}
                {appDetails.product_approval_form && (
                  <>
                    <p className="section-heading" style={{ marginTop: 16 }}>Product Approval Form</p>
                    <div className="card">
                      {appDetails.product_approval_form.form_text && (
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600 }}>FORM INSTRUCTIONS</div>
                          <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4, whiteSpace: 'pre-wrap' }}>
                            {appDetails.product_approval_form.form_text}
                          </div>
                        </div>
                      )}

                      {appDetails.product_approval_form.product_responses && appDetails.product_approval_form.product_responses.length > 0 && (
                        <div style={{ marginTop: 12 }}>
                          <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600, marginBottom: 8 }}>PRODUCT RESPONSES</div>
                          {appDetails.product_approval_form.product_responses.map((resp, idx) => (
                            <div key={idx} style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, marginBottom: 8, background: 'var(--surface-raised)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: 13, fontWeight: 600 }}>{resp.product_name || `Product #${resp.product_index}`}</span>
                                {resp.is_saved && <span style={{ fontSize: 11, color: 'var(--status-done-text)', background: 'var(--status-done-bg)', padding: '2px 6px', borderRadius: 4 }}>Saved</span>}
                              </div>
                              {resp.response_text && (
                                <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>
                                  Response: <em>{resp.response_text}</em>
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <p className="section-heading" style={{ marginTop: 16 }}>Application Details</p>
                <div className="card" style={{ padding: '4px 16px' }}>
                  {[
                    { label: 'Application No.', value: appDetails.application_number || '—' },
                    { label: 'Type', value: appDetails.application_type || '—' },
                    { label: 'Category', value: appDetails.category || '—' },
                    { label: 'Establishment Name', value: appDetails.establishment_name || '—' },
                    { label: 'Establishment Address', value: appDetails.establishment_address || '—' },
                    { label: 'Scope', value: appDetails.scope || '—' },
                    { label: 'Employee Count', value: appDetails.employee_count || '—' },
                    { label: 'Has Porcine?', value: appDetails.has_porcine ? 'Yes' : 'No' },
                    { label: 'Has Intoxicants?', value: appDetails.has_intoxicants ? 'Yes' : 'No' },
                  ].map(({ label, value }) => (
                    <div key={label} className="detail-row">
                      <div className="detail-label">{label}</div>
                      <div className="detail-value">{value}</div>
                    </div>
                  ))}
                </div>

                <p className="section-heading" style={{ marginTop: 16 }}>Products Covered</p>
                {appDetails.products && appDetails.products.length > 0 ? (
                  appDetails.products.map((prod, idx) => (
                    <div key={idx} className="card" style={{ padding: '12px 14px', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Package size={15} color="var(--primary)" />
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{prod.name}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>
                        <span>Brand: <strong>{prod.brand || '—'}</strong></span>
                        <span>Category: <strong>{prod.category || '—'}</strong></span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="card" style={{ padding: 12, textAlign: 'center', color: 'var(--text-3)' }}>
                    No products listed.
                  </div>
                )}
              </>
            )}
          </>
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