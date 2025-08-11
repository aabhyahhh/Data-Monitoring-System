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

  function isTokenValid() {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    try {
      // Decode the JWT token to check expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch (error) {
      console.error('Error checking token validity:', error);
      return false;
    }
  }

  useEffect(() => {
    setUser(localStorage.getItem('token'));
    setRole(localStorage.getItem('role'));
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, login, logout, isTokenValid }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 