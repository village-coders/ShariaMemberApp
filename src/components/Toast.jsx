import React, { useEffect } from 'react';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

/**
 * Toast notification component.
 * Props:
 *  - message: string
 *  - type: 'success' | 'error' | 'info'  (default: 'info')
 *  - onClose: () => void
 *  - duration: number in ms (default 3500, pass 0 to not auto-dismiss)
 */
export default function Toast({ message, type = 'info', onClose, duration = 3500 }) {
  useEffect(() => {
    if (!message || duration === 0) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [message, duration, onClose]);

  if (!message) return null;

  const styles = {
    success: { bg: '#f0fdf4', border: '#86efac', color: '#166534', Icon: CheckCircle, iconColor: '#16a34a' },
    error:   { bg: '#fef2f2', border: '#fca5a5', color: '#991b1b', Icon: AlertTriangle, iconColor: '#dc2626' },
    info:    { bg: '#eff6ff', border: '#93c5fd', color: '#1e40af', Icon: Info, iconColor: '#2563eb' },
  };
  const { bg, border, color, Icon, iconColor } = styles[type] || styles.info;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 90,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        width: 'calc(100% - 40px)',
        maxWidth: 420,
        background: bg,
        border: `1.5px solid ${border}`,
        borderRadius: 14,
        padding: '14px 14px 14px 16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.13)',
        animation: 'toast-slide-up 0.3s ease',
      }}
    >
      <Icon size={20} color={iconColor} style={{ marginTop: 1, flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color, lineHeight: 1.45 }}>{message}</span>
      <button
        onClick={onClose}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: border, flexShrink: 0, marginTop: 1 }}
      >
        <X size={16} />
      </button>
      <style>{`
        @keyframes toast-slide-up {
          from { opacity: 0; transform: translateX(-50%) translateY(16px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}
