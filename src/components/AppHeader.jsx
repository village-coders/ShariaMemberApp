import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { LogOut } from 'lucide-react';
import hfaLogo from '../assets/hfa-logo.png';

export default function AppHeader({ title }) {
  const { user, logout } = useContext(AuthContext);
  return (
    <header className="app-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          background: '#fff',
          borderRadius: '8px',
          padding: '4px 6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <img
            src={hfaLogo}
            alt="HFA"
            style={{ height: '26px', objectFit: 'contain', display: 'block' }}
          />
        </div>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{title}</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)', marginTop: '1px' }}>
            {user?.full_name} &middot; {user?.role?.replace(/_/g, ' ')}
          </div>
        </div>
      </div>
      <button
        onClick={logout}
        style={{
          background: 'rgba(255,255,255,0.15)',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          borderRadius: '8px',
          padding: '7px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title="Logout"
      >
        <LogOut size={18} />
      </button>
    </header>
  );
}