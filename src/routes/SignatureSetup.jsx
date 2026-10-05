import React, { useState, useContext, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SignatureCanvas from 'react-signature-canvas';
import { AuthContext } from '../context/AuthContext';
import { createSignature } from '../api/signatures';
import { getFileUrl } from '../api/client';
import {
  PenLine,
  Trash2,
  Save,
  ArrowLeft,
  RefreshCw,
  UploadCloud,
  FileImage,
  Check
} from 'lucide-react';
import Toast from '../components/Toast';

export default function SignatureSetup() {
  const { user, mySignature, setMySignature, refreshSignature, checkingSignature } = useContext(AuthContext);
  const navigate = useNavigate();
  const sigCanvas = useRef(null);
  const fileInputRef = useRef(null);

  const [existingSig, setExistingSig] = useState(mySignature);
  const [checking, setChecking] = useState(!mySignature);
  const [replaceMode, setReplaceMode] = useState(false);

  // Tab mode: 'upload' or 'draw'
  const [inputMode, setInputMode] = useState('upload');

  const [name, setName] = useState(mySignature?.name || user?.full_name || '');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedPreview, setUploadedPreview] = useState(null);
  const [isCanvasEmpty, setIsCanvasEmpty] = useState(true);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'info') => setToast({ message, type });

  // Sync with context
  useEffect(() => {
    if (mySignature) {
      setExistingSig(mySignature);
      if (!name) setName(mySignature.name || user?.full_name || '');
      setChecking(false);
    }
  }, [mySignature, name, user?.full_name]);

  // Check for signature on mount if not already present
  useEffect(() => {
    let isMounted = true;
    if (!mySignature && user) {
      setChecking(true);
      refreshSignature(user)
        .then(sig => {
          if (isMounted && sig) {
            setExistingSig(sig);
            setName(sig.name || user?.full_name || '');
          }
        })
        .finally(() => {
          if (isMounted) setChecking(false);
        });
    } else {
      setChecking(false);
    }
    return () => { isMounted = false; };
  }, [user, mySignature, refreshSignature]);

  const handleClearCanvas = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
      setIsCanvasEmpty(true);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, SVG, WEBP).', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image file size must be less than 5MB.', 'error');
      return;
    }

    setUploadedFile(file);
    const previewUrl = URL.createObjectURL(file);
    setUploadedPreview(previewUrl);
  };

  const handleClearUploadedFile = () => {
    setUploadedFile(null);
    if (uploadedPreview) {
      URL.revokeObjectURL(uploadedPreview);
      setUploadedPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Convert canvas data: URL string to Blob without external fetch
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
    if (!name.trim()) {
      showToast('Please enter your full name.', 'error');
      return;
    }

    let fileToUpload = null;

    if (inputMode === 'upload') {
      if (!uploadedFile) {
        showToast('Please select a signature image file to upload.', 'error');
        return;
      }
      fileToUpload = uploadedFile;
    } else {
      if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
        showToast('Please draw your signature first.', 'error');
        return;
      }
      const dataUrl = sigCanvas.current.toDataURL('image/png');
      const blob = dataURLtoBlob(dataUrl);
      fileToUpload = new File([blob], 'signature.png', { type: 'image/png' });
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('username', user?.username || user?.email || '');
      formData.append('user_id', user?.id || user?._id || '');
      formData.append('signature_file', fileToUpload);

      const response = await createSignature(formData);
      const savedSig = response?.data || response;

      setMySignature(savedSig);
      setExistingSig(savedSig);
      setReplaceMode(false);
      handleClearUploadedFile();
      showToast('Signature saved successfully! ✓', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to save signature. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ---- Loading state ----
  if (checking || checkingSignature) {
    return (
      <>
        <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
        <div className="state-container" style={{ minHeight: '60vh' }}>
          <span className="spinner spinner-dark" style={{ width: 28, height: 28 }} />
          <p className="state-message">Checking for existing signature…</p>
        </div>
      </>
    );
  }

  // ---- Existing signature on file preview (when not in replace mode) ----
  if (existingSig?.signature_url && !replaceMode) {
    const sigUrl = getFileUrl(existingSig.signature_url);

    return (
      <>
        <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
        <div className="app-content" style={{ paddingBottom: 40 }}>
          {/* Back button */}
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: 'var(--primary)',
              fontWeight: 600,
              fontSize: 14,
              marginBottom: 16,
              padding: 0
            }}
          >
            <ArrowLeft size={16} /> Back to Logsheets
          </button>

          {/* Success Status Card */}
          <div className="card" style={{ background: 'var(--primary-subtle)', border: '1px solid var(--primary-border)', marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                flexShrink: 0
              }}>
                <Check size={20} strokeWidth={2.5} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>Signature on file</p>
                <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>
                  Authenticated for <strong>{existingSig.name || user?.full_name || user?.username}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Signature Preview Card */}
          <div className="card" style={{ padding: 20, textAlign: 'center' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Active Digital Signature
            </p>

            <div style={{
              background: '#f8fafc',
              border: '1.5px dashed var(--border)',
              borderRadius: 12,
              padding: '24px 16px',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 120
            }}>
              <img
                src={sigUrl}
                alt="Active Signature"
                style={{ maxWidth: '100%', maxHeight: 110, objectFit: 'contain' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  const fallback = e.target.parentElement.querySelector('.sig-fallback');
                  if (fallback) fallback.style.display = 'block';
                }}
              />
              <div className="sig-fallback" style={{ display: 'none', color: 'var(--text-3)', fontSize: 13 }}>
                Signature file on record ({existingSig.name})
              </div>
            </div>

            <div style={{ background: '#f1f5f9', borderRadius: 8, padding: '10px 12px', marginBottom: 20, textAlign: 'left' }}>
              <p style={{ fontSize: 12, color: 'var(--text-2)', margin: 0, lineHeight: 1.5 }}>
                ✓ This signature is automatically used when signing committee logsheets. You do not need to draw or upload anything further unless you wish to replace it.
              </p>
            </div>

            <button
              className="btn btn-secondary"
              onClick={() => {
                setReplaceMode(true);
                setName(existingSig.name || user?.full_name || '');
                setIsCanvasEmpty(true);
                handleClearUploadedFile();
              }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}
            >
              <RefreshCw size={15} /> Replace Signature
            </button>
          </div>
        </div>
      </>
    );
  }

  // ---- Draw / Upload mode (Setup or Replace) ----
  const hasExisting = Boolean(existingSig?.signature_url);

  return (
    <>
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
      <div className="app-content" style={{ paddingBottom: 40 }}>
        {/* Back button */}
        <button
          onClick={() => {
            if (replaceMode && hasExisting) {
              setReplaceMode(false);
            } else {
              navigate(-1);
            }
          }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: 'var(--primary)',
            fontWeight: 600,
            fontSize: 14,
            marginBottom: 16,
            padding: 0
          }}
        >
          <ArrowLeft size={16} /> {replaceMode ? 'Cancel & Keep Current' : 'Back'}
        </button>

        {/* Informational Guidance */}
        <div className="card" style={{ background: 'var(--primary-subtle)', border: '1px solid var(--primary-border)', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <FileImage size={20} color="var(--primary)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)', marginBottom: 4 }}>
                {replaceMode ? 'Replace Signature' : 'Add Signature'}
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>
                You can <strong>upload an image</strong> of your official signature (recommended) or <strong>draw it</strong> on screen. Drawing is not mandatory.
              </p>
            </div>
          </div>
        </div>

        {/* Input Method Selector Tabs */}
        <div style={{
          display: 'flex',
          background: '#e2e8f0',
          padding: 4,
          borderRadius: 12,
          marginBottom: 18,
          gap: 4
        }}>
          <button
            type="button"
            onClick={() => setInputMode('upload')}
            style={{
              flex: 1,
              padding: '10px 14px',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              background: inputMode === 'upload' ? '#ffffff' : 'transparent',
              color: inputMode === 'upload' ? 'var(--primary)' : 'var(--text-3)',
              boxShadow: inputMode === 'upload' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'all 0.2s'
            }}
          >
            <UploadCloud size={16} /> Upload Image (Recommended)
          </button>
          <button
            type="button"
            onClick={() => setInputMode('draw')}
            style={{
              flex: 1,
              padding: '10px 14px',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              background: inputMode === 'draw' ? '#ffffff' : 'transparent',
              color: inputMode === 'draw' ? 'var(--primary)' : 'var(--text-3)',
              boxShadow: inputMode === 'draw' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'all 0.2s'
            }}
          >
            <PenLine size={16} /> Draw on Screen
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label" style={{ fontWeight: 600 }}>Signatory Full Name</label>
            <input
              className="form-control"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Dr. A. Q. Al-Azhari"
              required
            />
          </div>

          {/* Mode 1: Upload Image */}
          {inputMode === 'upload' && (
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label" style={{ fontWeight: 600 }}>Signature Image File</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />

              {!uploadedPreview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed var(--border)',
                    borderRadius: 12,
                    padding: '30px 16px',
                    textAlign: 'center',
                    background: '#ffffff',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  <UploadCloud size={36} color="var(--primary)" style={{ margin: '0 auto 10px', display: 'block' }} />
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', marginBottom: 4 }}>
                    Tap to upload signature image
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>
                    PNG (transparent recommended), JPG, WEBP, or SVG up to 5MB
                  </p>
                </div>
              ) : (
                <div style={{
                  border: '1.5px solid var(--primary)',
                  borderRadius: 12,
                  padding: 16,
                  background: '#ffffff',
                  textAlign: 'center'
                }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginBottom: 10 }}>
                    Selected File Preview
                  </p>
                  <div style={{
                    background: '#f8fafc',
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 90
                  }}>
                    <img
                      src={uploadedPreview}
                      alt="Uploaded signature preview"
                      style={{ maxWidth: '100%', maxHeight: 90, objectFit: 'contain' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn btn-secondary"
                      style={{ width: 'auto', padding: '6px 12px', fontSize: 12 }}
                    >
                      Choose Different File
                    </button>
                    <button
                      type="button"
                      onClick={handleClearUploadedFile}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 12,
                        padding: '6px 10px'
                      }}
                    >
                      <Trash2 size={13} /> Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mode 2: Draw on Screen */}
          {inputMode === 'draw' && (
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label" style={{ fontWeight: 600 }}>Draw Signature</label>
              <div style={{
                border: `1.5px solid ${isCanvasEmpty ? 'var(--border)' : 'var(--primary)'}`,
                borderRadius: 12,
                overflow: 'hidden',
                background: '#ffffff',
                transition: 'border-color 0.2s',
              }}>
                <SignatureCanvas
                  ref={sigCanvas}
                  canvasProps={{ width: 340, height: 160, style: { display: 'block', width: '100%' } }}
                  backgroundColor="#ffffff"
                  onBegin={() => setIsCanvasEmpty(false)}
                />
              </div>
              <button
                type="button"
                onClick={handleClearCanvas}
                style={{
                  marginTop: 8,
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-3)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 13,
                  padding: '4px 0'
                }}
              >
                <Trash2 size={13} /> Clear pad
              </button>
            </div>
          )}

          <button
            className="btn btn-primary"
            type="submit"
            disabled={loading || (inputMode === 'upload' ? !uploadedFile : isCanvasEmpty)}
            style={{ borderRadius: 14, padding: 14, width: '100%' }}
          >
            {loading ? <span className="spinner" /> : <><Save size={18} /> Save & Apply Signature</>}
          </button>
        </form>
      </div>
    </>
  );
}