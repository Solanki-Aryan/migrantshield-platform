import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('ms_token');
    const storedUser = localStorage.getItem('ms_user');
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('ms_token');
        localStorage.removeItem('ms_user');
      }
    }
    setLoading(false);
  }, []);

  function login(userData, authToken) {
    localStorage.setItem('ms_token', authToken);
    localStorage.setItem('ms_user', JSON.stringify(userData));
    setToken(authToken);
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('ms_token');
    localStorage.removeItem('ms_user');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
