import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => localStorage.getItem('token') || null);
  const [role, setRole] = useState(() => localStorage.getItem('role') || null);

  function login(token, role) {
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    setUser(token);
    setRole(role);
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setUser(null);
    setRole(null);
  }

  useEffect(() => {
    setUser(localStorage.getItem('token'));
    setRole(localStorage.getItem('role'));
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 