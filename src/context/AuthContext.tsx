import { createContext, useState, useEffect, useCallback, ReactNode, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { User } from '../types';

interface AuthContextType {
  isAuthenticated: boolean;
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
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const publicPaths = ['/auth/signin', '/auth/signup'];

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
        if (!publicPaths.includes(location.pathname)) {
          navigate('/auth/signin');
        }
      }
    } else {
      setIsAuthenticated(false);
      setUser(null);
      setToken(null);
      if (!publicPaths.includes(location.pathname)) {
        navigate('/auth/signin');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback((newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    navigate('/auth/signin');
  }, [navigate]);

  const updateUser = useCallback((updatedUser: User) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
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
