import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);

  useEffect(() => {
    const handleAuthError = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener('auth-error', handleAuthError);
    return () => window.removeEventListener('auth-error', handleAuthError);
  }, []);

  const handleLogin = (userData, tokenData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', tokenData);
    setUser(userData);
    setToken(tokenData);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login: handleLogin, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
};