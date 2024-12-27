// src/context/AuthContext.tsx

import { createContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface AuthContextType {
  isAuthenticated: boolean;
  setAuthenticated: (authenticated: boolean) => void;
  userRole: string; // 'EMPLOYEE' or 'HR'
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user'); 
    // e.g. { "username": "...", "role": "EMPLOYEE" } or "HR"

    // These paths are allowed if not authenticated
    const publicPaths = ['/auth/signin', '/auth/signup'];

    if (token && userData) {
      setIsAuthenticated(true);

      try {
        const parsedUser = JSON.parse(userData);
        setUserRole(parsedUser.role || 'EMPLOYEE'); 
        // fallback 'EMPLOYEE' or handle however you wish
      } catch {
        setUserRole('EMPLOYEE');
      }
    } else {
      setIsAuthenticated(false);
      setUserRole('');
      if (!publicPaths.includes(location.pathname)) {
        navigate('/auth/signin');
      }
    }
  }, [navigate, location]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        setAuthenticated: setIsAuthenticated,
        userRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
