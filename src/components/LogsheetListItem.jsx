import React from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import { ChevronRight, FileText, Package, CheckCircle, PenTool } from 'lucide-react';
import { getFileUrl } from '../api/client';

export default function LogsheetListItem({ logsheet }) {
  const navigate = useNavigate();
  const company = logsheet.company_name || 'Unknown Company';
  const date = (logsheet.created_at || logsheet.createdAt)
    ? new Date(logsheet.created_at || logsheet.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  const isAddon = logsheet.source_type === 'addon_application' || Boolean(logsheet.addon_application_id) || Boolean(logsheet.product_approval_form);

  const refNumber =
    logsheet.application_number ||
    logsheet.application_id?.application_number ||
    logsheet.addon_application_id?.application_number ||
    logsheet.applications?.application_number ||
    logsheet.direct_ref ||
    logsheet.kfc_ref ||
    logsheet.legacy_id ||
    (logsheet._id ? `APP-${String(logsheet._id).slice(-6).toUpperCase()}` : null);

  const signatureRoles = [
    { label: 'Mufti 1', name: logsheet.mufti_sign_name, signature: logsheet.mufti_signature, date: logsheet.mufti_sign_date },
    { label: 'Mufti 2', name: logsheet.mufti2_sign_name, signature: logsheet.mufti2_signature, date: logsheet.mufti2_sign_date },
    { label: 'Manager', name: logsheet.manager_sign_name, signature: logsheet.manager_signature, date: logsheet.manager_sign_date },
    { label: 'CEO', name: logsheet.ceo_sign_name, signature: logsheet.ceo_signature, date: logsheet.ceo_sign_date },
  ];

  const signedSignatures = signatureRoles.filter(s => s.name || s.signature);

  return (
    <div
      className="card"
      onClick={() => navigate(`/logsheet/${logsheet._id || logsheet.id}`, { state: { logsheet } })}
      style={{
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: '14px 16px',
        border: isAddon ? '1.5px solid #c7d2fe' : '1px solid var(--border)',
        boxShadow: 'var(--shadow-xs)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: isAddon ? '#eff6ff' : 'var(--primary-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          {isAddon ? (
            <Package size={22} color="#2563eb" />
          ) : (
            <FileText size={22} color="var(--primary)" />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
            <div className="card-title" style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {company}
            </div>
            {refNumber && (
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: 6,
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                color: 'var(--primary)',
                fontFamily: 'monospace',
                flexShrink: 0
              }}>
                Ref: {refNumber}
              </span>
            )}
          </div>

          {/* Type Badge & Date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 10.5,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 6,
              background: isAddon ? '#e0e7ff' : '#ecfdf5',
              color: isAddon ? '#3730a3' : '#065f46',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4
            }}>
              {isAddon ? '📦 Product Add-on' : '📋 Application'}
            </span>
            <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>&middot; {date}</span>
          </div>

          <StatusBadge status={logsheet.status} />
        </div>
        <ChevronRight size={18} color="var(--text-3)" style={{ flexShrink: 0 }} />
      </div>

      {/* Signed Signatures Section */}
      <div style={{
        paddingTop: 10,
        borderTop: '1px solid var(--divider)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <PenTool size={12} color="var(--primary)" />
            Signatures Signed ({signedSignatures.length}/4)
          </span>
        </div>

        {signedSignatures.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
            {signedSignatures.map((sig, idx) => (
              <div key={idx} style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: '6px 8px',
                display: 'flex',
                flexDirection: 'column',
                gap: 4
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle size={12} color="var(--status-done-text)" />
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-1)' }}>{sig.label}</span>
                </div>
                {sig.name && (
                  <span style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {sig.name}
                  </span>
                )}
                {sig.signature && (
                  <div style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: 6,
                    padding: '2px 4px',
                    height: 30,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 2
                  }}>
                    <img
                      src={getFileUrl(sig.signature)}
                      alt={`${sig.label} signature`}
                      style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                    />
                  </div>
                )}
                {sig.date && (
                  <span style={{ fontSize: 9.5, color: 'var(--text-3)', fontStyle: 'italic' }}>
                    {new Date(sig.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 11, color: 'var(--text-3)', fontStyle: 'italic' }}>
            No signatures signed yet
          </div>
        )}
      </div>
    </div>
  );
}