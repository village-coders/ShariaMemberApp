import React from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import { ChevronRight, FileText } from 'lucide-react';

export default function LogsheetListItem({ logsheet }) {
  const navigate = useNavigate();
  const company = logsheet.company_name || 'Unknown Company';
  const date = (logsheet.created_at || logsheet.createdAt)
    ? new Date(logsheet.created_at || logsheet.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';
  const auditType = logsheet.audit_type || 'Audit';

  return (
    <div
      className="card"
      onClick={() => navigate(`/logsheet/${logsheet._id || logsheet.id}`, { state: { logsheet } })}
      style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}
    >
      <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <FileText size={20} color="var(--primary)" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="card-title" style={{ marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{company}</div>
        <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 6 }}>{auditType} &middot; {date}</div>
        <StatusBadge status={logsheet.status} />
      </div>
      <ChevronRight size={18} color="var(--text-3)" style={{ flexShrink: 0 }} />
    </div>
  );
}