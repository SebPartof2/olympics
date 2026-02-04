import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    setIsLoading(true);
    const authenticated = await api.checkAuth();
    setIsAuthenticated(authenticated);
    setIsLoading(false);
  }

  function login(password) {
    api.setToken(password);
    return api.checkAuth().then((success) => {
      if (success) {
        setIsAuthenticated(true);
        return true;
      } else {
        api.clearToken();
        return false;
      }
    });
  }

  function logout() {
    api.clearToken();
    setIsAuthenticated(false);
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
