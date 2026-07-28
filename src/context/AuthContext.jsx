import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('gti_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('gti_token');
    if (!token) {
      setLoading(false);
      return;
    }
    // Validasi token ke server saat aplikasi dimuat ulang (F5)
    api
      .me()
      .then((res) => {
        setUser(res.user);
        localStorage.setItem('gti_user', JSON.stringify(res.user));
      })
      .catch(() => {
        localStorage.removeItem('gti_token');
        localStorage.removeItem('gti_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (username, password) => {
    const res = await api.login(username, password);
    localStorage.setItem('gti_token', res.token);
    localStorage.setItem('gti_user', JSON.stringify(res.user));
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('gti_token');
    localStorage.removeItem('gti_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
