import React, { useState, useContext, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SignatureCanvas from 'react-signature-canvas';
import { AuthContext } from '../context/AuthContext';
import { createSignature } from '../api/signatures';
// import AppHeader from '../components/AppHeader';
import { PenLine, Trash2, Save, ArrowLeft, RefreshCw, CheckCircle } from 'lucide-react';
import Toast from '../components/Toast';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://hfa-portal-backend.onrender.com/api';

export default function SignatureSetup() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const sigCanvas = useRef();

  const [existingSig, setExistingSig] = useState(null);
  const [checking, setChecking] = useState(true);
  const [redrawMode, setRedrawMode] = useState(false);

  const [name, setName] = useState(user?.full_name || '');
  const [loading, setLoading] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'info') => setToast({ message, type });

  // Check localStorage first, then API
  useEffect(() => {
    const stored = localStorage.getItem('my_signature');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.signature_url) {
          setExistingSig(parsed);
          setChecking(false);
          return;
        }
      } catch (_) {}
    }

    // Fall back to API
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/signatures`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        const mine = list.find(s => s.user_id === (user?.id || user?._id) || s.username === user?.email);
        if (mine?.signature_url) {
          setExistingSig(mine);
          localStorage.setItem('my_signature', JSON.stringify(mine));
          setName(mine.name || user?.full_name || '');
        }
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [user]);

  const handleClear = () => {
    sigCanvas.current.clear();
    setIsEmpty(true);
  };

  // Pure JS: convert a data: URL string to a Blob without using fetch()
  const dataURLtoBlob = (dataUrl) => {
    const [header, base64] = dataUrl.split(',');
    const mime = header.match(/:(.*?);/)[1];
    const binary = atob(base64);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
    return new Blob([array], { type: mime });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (sigCanvas.current.isEmpty()) {
      showToast('Please draw your signature first.', 'error');
      return;
    }
    setLoading(true);
    try {
      const dataUrl = sigCanvas.current.toDataURL('image/png');
      const blob = dataURLtoBlob(dataUrl);
      const file = new File([blob], 'signature.png', { type: 'image/png' });

      const formData = new FormData();
      formData.append('name', name);
      formData.append('username', user.email || user.username || '');
      formData.append('user_id', user.id || user._id || '');
      formData.append('signature_file', file);

      const response = await createSignature(formData);
      // API may return { data: {...} } or the object directly
      const savedSig = response?.data || response;
      localStorage.setItem('my_signature', JSON.stringify(savedSig));
      setExistingSig(savedSig);
      setRedrawMode(false);
    } catch (err) {
      showToast(err.message || 'Failed to save signature. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ---- Loading check ----
  if (checking) {
    return (
      <>
        <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
        {/* <AppHeader title="Signature" /> */}
        <div className="state-container" style={{ minHeight: '60vh' }}>
          <span className="spinner spinner-dark" style={{ width: 26, height: 26 }} />
          <p className="state-message">Checking your signature…</p>
        </div>
      </>
    );
  }

  // ---- Existing signature preview (not in redraw mode) ----
  if (existingSig && !redrawMode) {
    const sigUrl = existingSig.signature_url?.startsWith('/')
      ? `https://hfa-portal-backend.onrender.com${existingSig.signature_url}`
      : existingSig.signature_url;

    return (
      <>
        <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
        {/* <AppHeader title="Signature" /> */}
        <div className="app-content" style={{ paddingBottom: 40 }}>
          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--primary)', fontWeight: 600, fontSize: 14, marginBottom: 16, padding: 0 }}
          >
            <ArrowLeft size={16} /> Back
          </button>

          {/* Success info card */}
          <div className="card" style={{ background: 'var(--primary-subtle)', border: '1px solid var(--primary-border)', marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <CheckCircle size={18} color="var(--primary)" style={{ flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary)' }}>Signature on file</p>
                <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>
                  Signed as <strong>{existingSig.name}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Signature image preview */}
          <div className="card" style={{ padding: 16, textAlign: 'center' }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Your Signature
            </p>
            <div style={{ background: '#f9f9f9', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 0', marginBottom: 16 }}>
              <img
                src={sigUrl}
                alt="Your signature"
                style={{ maxWidth: '100%', maxHeight: 120, objectFit: 'contain' }}
                onError={e => { e.target.style.display = 'none'; }}
              />
            </div>
            <button
              className="btn btn-secondary"
              onClick={() => { setRedrawMode(true); setIsEmpty(true); }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}
            >
              <RefreshCw size={15} /> Redraw Signature
            </button>
          </div>
        </div>
      </>
    );
  }

  // ---- Draw / Redraw mode ----
  return (
    <>
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
      {/* <AppHeader title="Signature Setup" /> */}
      <div className="app-content" style={{ paddingBottom: 40 }}>
        {/* Back button */}
        <button
          onClick={() => redrawMode ? setRedrawMode(false) : navigate(-1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--primary)', fontWeight: 600, fontSize: 14, marginBottom: 16, padding: 0 }}
        >
          <ArrowLeft size={16} /> {redrawMode ? 'Cancel' : 'Back'}
        </button>

        {/* Info card */}
        <div className="card" style={{ background: 'var(--primary-subtle)', border: '1px solid var(--primary-border)', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <PenLine size={18} color="var(--primary)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary)', marginBottom: 4 }}>
                {redrawMode ? 'Redraw your signature' : 'One-time setup'}
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
                Draw your signature in the box below. It will be securely stored and attached automatically when you sign logsheets.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              className="form-control"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your full name"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Draw Signature</label>
            <div style={{
              border: `1.5px solid ${isEmpty ? 'var(--border)' : 'var(--primary)'}`,
              borderRadius: 12,
              overflow: 'hidden',
              background: '#fff',
              transition: 'border-color 0.2s',
            }}>
              <SignatureCanvas
                ref={sigCanvas}
                canvasProps={{ width: 340, height: 160, style: { display: 'block', width: '100%' } }}
                backgroundColor="#ffffff"
                onBegin={() => setIsEmpty(false)}
              />
            </div>
            <button
              type="button"
              onClick={handleClear}
              style={{ marginTop: 8, background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, padding: '4px 0' }}
            >
              <Trash2 size={13} /> Clear pad
            </button>
          </div>

          <button
            className="btn btn-primary"
            type="submit"
            disabled={loading || isEmpty}
            style={{ borderRadius: 14, padding: 14 }}
          >
            {loading ? <span className="spinner" /> : <><Save size={18} /> Save Signature</>}
          </button>
        </form>
      </div>
    </>
  );
}