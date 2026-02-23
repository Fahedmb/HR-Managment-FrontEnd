import { createContext, useState, useEffect, useCallback, ReactNode, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '../types';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  userRole: 'HR' | 'EMPLOYEE' | 'MANAGER' | '';
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const navigate = useNavigate();

  // Hydrate auth state from localStorage on mount — NO navigation here;
  // ProtectedRoute handles redirects once isLoading becomes false.
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (storedToken && userData) {
      try {
        const parsedUser: User = JSON.parse(userData);
        setIsAuthenticated(true);
        setUser(parsedUser);
        setToken(storedToken);
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for 401 events fired by the axios interceptor so we can do a
  // soft React-Router logout instead of a hard window.location redirect.
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    navigate('/auth/signin');
  }, [navigate]);

  useEffect(() => {
    const handle401 = () => logout();
    window.addEventListener('auth-401', handle401);
    return () => window.removeEventListener('auth-401', handle401);
  }, [logout]);

  const login = useCallback((newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setIsAuthenticated(true);
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        userRole: (user?.role as 'HR' | 'EMPLOYEE' | 'MANAGER') || '',
        token,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
