import React, { createContext, useState, useEffect, useCallback } from 'react';
import { getMySignature, isUserSignatureMatch } from '../api/signatures';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('token') || null);

  const [mySignature, setMySignatureState] = useState(() => {
    try {
      const stored = localStorage.getItem('my_signature');
      const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
      if (stored && currentUser) {
        const parsed = JSON.parse(stored);
        if (parsed?.signature_url && isUserSignatureMatch(parsed, currentUser)) {
          return parsed;
        }
      }
      return null;
    } catch {
      return null;
    }
  });

  const [checkingSignature, setCheckingSignature] = useState(false);

  const setMySignature = (sig) => {
    if (sig && sig.signature_url) {
      localStorage.setItem('my_signature', JSON.stringify(sig));
      setMySignatureState(sig);
    } else {
      localStorage.removeItem('my_signature');
      setMySignatureState(null);
    }
  };

  const refreshSignature = useCallback(async (targetUser = user) => {
    if (!targetUser || !localStorage.getItem('token')) {
      return null;
    }
    setCheckingSignature(true);
    try {
      const sig = await getMySignature(targetUser);
      if (sig && sig.signature_url) {
        setMySignature(sig);
        return sig;
      } else {
        // If not found remotely, check if a valid local signature exists for this user
        const stored = localStorage.getItem('my_signature');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (isUserSignatureMatch(parsed, targetUser)) {
              setMySignatureState(parsed);
              return parsed;
            }
          } catch {
            // ignore
          }
        }
        return null;
      }
    } catch (err) {
      console.warn('Could not refresh signature:', err);
      return null;
    } finally {
      setCheckingSignature(false);
    }
  }, [user]);

  // Check for signature whenever user/token changes
  useEffect(() => {
    if (user && token) {
      refreshSignature(user);
    } else {
      setMySignatureState(null);
    }
  }, [user, token, refreshSignature]);

  useEffect(() => {
    const handleAuthError = () => {
      setUser(null);
      setToken(null);
      setMySignatureState(null);
      localStorage.removeItem('my_signature');
    };
    window.addEventListener('auth-error', handleAuthError);
    return () => window.removeEventListener('auth-error', handleAuthError);
  }, []);

  const handleLogin = (userData, tokenData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', tokenData);
    setUser(userData);
    setToken(tokenData);
    refreshSignature(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('my_signature');
    setUser(null);
    setToken(null);
    setMySignatureState(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login: handleLogin,
      logout: handleLogout,
      mySignature,
      setMySignature,
      refreshSignature,
      checkingSignature
    }}>
      {children}
    </AuthContext.Provider>
  );
};