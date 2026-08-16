import React, { useState, useEffect, useContext } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { FileClock, FolderOpen, PenLine } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { getMySignature } from '../api/signatures';

export default function DashboardLayout() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [checkedSig, setCheckedSig] = useState(false);

  useEffect(() => {
    if (user && !checkedSig) {
      // Check for stored signature first from localStorage
      const stored = localStorage.getItem('my_signature');
      if (stored) {
        setCheckedSig(true);
        return;
      }
      getMySignature(user.id)
        .then(sig => {
          if (!sig) {
            navigate('/setup-signature');
          } else {
            localStorage.setItem('my_signature', JSON.stringify(sig));
            setCheckedSig(true);
          }
        })
        .catch(() => setCheckedSig(true)); // on error, let them through
    }
  }, [user, checkedSig, navigate]);

  if (!checkedSig) {
    return (
      <div className="state-container" style={{ minHeight: '100vh' }}>
        <span className="spinner spinner-dark" style={{ width: 28, height: 28 }} />
        <p className="state-message">Checking your account…</p>
      </div>
    );
  }

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
          <PenLine size={22} />
          <span>Signature</span>
        </NavLink>
      </nav>
    </>
  );
}