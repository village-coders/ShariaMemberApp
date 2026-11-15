import React, { useState, useContext, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { login } from '../api/auth';
import ReCaptcha from '../components/ReCaptcha';
import hfaLogo from '../assets/hfa-logo.png';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const recaptchaRef = useRef(null);
  const { login: setAuth } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleRecaptchaChange = useCallback((token) => {
    setRecaptchaToken(token || '');
    setError((prev) => (prev && prev.includes('reCAPTCHA') ? '' : prev));
  }, []);

  const handleRecaptchaExpired = useCallback(() => {
    setRecaptchaToken('');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!recaptchaToken) {
      setError('Please complete the reCAPTCHA verification.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await login(username, password, recaptchaToken);
      if (res.token && res.user) {
        setAuth(res.user, res.token);
        navigate('/');
      } else {
        setError('Login failed. Please try again.');
        recaptchaRef.current?.reset();
        setRecaptchaToken('');
      }
    } catch (err) {
      setError(err.message || 'Login failed');
      recaptchaRef.current?.reset();
      setRecaptchaToken('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <img src={hfaLogo} alt="HFA Logo" />
        </div>
        <h1 className="login-title">Committee Member App</h1>
        <p className="login-subtitle">Sign in to your account</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              className="form-control"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-control"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
          </div>

          <ReCaptcha
            widgetRef={recaptchaRef}
            onChange={handleRecaptchaChange}
            onExpired={handleRecaptchaExpired}
          />

          <button
            className="btn btn-primary"
            type="submit"
            disabled={loading || !recaptchaToken}
            style={{
              marginTop: '8px',
              opacity: (!recaptchaToken || loading) ? 0.7 : 1,
              cursor: (!recaptchaToken || loading) ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? <span className="spinner" /> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
