import React, { useContext } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { FileClock, FolderOpen, PenLine } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

export default function DashboardLayout() {
  const { mySignature } = useContext(AuthContext);

  return (
    <>
      <AppHeader title="Committee Member App" />
      <div className="app-content">
        <Outlet />
      </div>
      <nav className="bottom-nav">
        <NavLink to="/" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} end>
          <FileClock size={22} />
          <span>New</span>
        </NavLink>
        <NavLink to="/manage" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <FolderOpen size={22} />
          <span>Manage</span>
        </NavLink>
        <NavLink to="/setup-signature" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <div style={{ position: 'relative', display: 'inline-flex' }}>
            <PenLine size={22} />
            {mySignature?.signature_url && (
              <span
                title="Signature on file"
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -4,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: 'var(--status-done-text, #16a34a)',
                  border: '1.5px solid var(--surface, #ffffff)',
                }}
              />
            )}
          </div>
          <span>Signature</span>
        </NavLink>
      </nav>
    </>
  );
}