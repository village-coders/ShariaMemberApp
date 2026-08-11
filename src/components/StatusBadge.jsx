import React from 'react';

const STATUS_MAP = {
  // Audit statuses
  inspection_assigned: { label: 'Assigned', bg: 'var(--status-progress-bg)', color: 'var(--status-progress-text)' },
  inspection_completed: { label: 'Completed', bg: 'var(--status-done-bg)', color: 'var(--status-done-text)' },
  // Logsheet statuses
  'Waiting for Signature': { label: 'Needs Signature', bg: 'var(--status-waiting-bg)', color: 'var(--status-waiting-text)' },
  'Waiting For Signature': { label: 'Needs Signature', bg: 'var(--status-waiting-bg)', color: 'var(--status-waiting-text)' },
  'Signed': { label: 'Signed', bg: 'var(--status-done-bg)', color: 'var(--status-done-text)' },
  'Waiting For Certificate': { label: 'Awaiting Certificate', bg: 'var(--status-progress-bg)', color: 'var(--status-progress-text)' },
  'Completed': { label: 'Completed', bg: 'var(--status-done-bg)', color: 'var(--status-done-text)' },
  // Add-on statuses
  submitted: { label: 'Submitted', bg: 'var(--status-new-bg)', color: 'var(--status-new-text)' },
  approved: { label: 'Approved', bg: 'var(--status-done-bg)', color: 'var(--status-done-text)' },
  completed: { label: 'Completed', bg: 'var(--status-done-bg)', color: 'var(--status-done-text)' },
  ready_for_certificate: { label: 'Ready for Cert.', bg: 'var(--status-progress-bg)', color: 'var(--status-progress-text)' },
};

export default function StatusBadge({ status }) {
  const mapped = STATUS_MAP[status];
  const label = mapped?.label || status?.replace(/_/g, ' ') || '—';
  const bg = mapped?.bg || 'var(--status-default-bg)';
  const color = mapped?.color || 'var(--status-default-text)';

  return (
    <span className="badge" style={{ backgroundColor: bg, color }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
      {label}
    </span>
  );
}