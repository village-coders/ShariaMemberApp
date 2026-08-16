import React from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import { ChevronRight, FileText, Package } from 'lucide-react';

export default function LogsheetListItem({ logsheet }) {
  const navigate = useNavigate();
  const company = logsheet.company_name || 'Unknown Company';
  const date = (logsheet.created_at || logsheet.createdAt)
    ? new Date(logsheet.created_at || logsheet.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  const isAddon = logsheet.source_type === 'addon_application' || Boolean(logsheet.addon_application_id) || Boolean(logsheet.product_approval_form);

  return (
    <div
      className="card"
      onClick={() => navigate(`/logsheet/${logsheet._id || logsheet.id}`, { state: { logsheet } })}
      style={{
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 16px',
        border: isAddon ? '1.5px solid #c7d2fe' : '1px solid var(--border)',
        boxShadow: 'var(--shadow-xs)'
      }}
    >
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
        <div className="card-title" style={{ marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {company}
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
  );
}