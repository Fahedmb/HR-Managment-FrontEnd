import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import DefaultLayout from './layout/DefaultLayout';
import Loader from './common/Loader';

// Auth pages (eager  needed immediately)
import SignIn from './pages/Authentication/SignIn';
import SignUp from './pages/Authentication/SignUp';

// App pages (lazy-loaded)
const DashboardHR = lazy(() => import('./pages/Dashboard/DashboardHR'));
const DashboardEmployee = lazy(() => import('./pages/Dashboard/DashboardEmployee'));
const Projects = lazy(() => import('./pages/Projects'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Teams = lazy(() => import('./pages/Teams'));
const Meetings = lazy(() => import('./pages/Meetings'));
const LeaveRequests = lazy(() => import('./pages/LeaveRequests'));
const Chat = lazy(() => import('./pages/Chat'));
const Users = lazy(() => import('./pages/Users'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Timesheet = lazy(() => import('./pages/Timesheet'));
const TimesheetManagement = lazy(() => import('./pages/HR/TimesheetManagement'));

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30000 } } });

// Route guard: redirect to sign-in if not authenticated
const ProtectedRoute: React.FC<{ roles?: string[] }> = ({ roles }) => {
  const { isAuthenticated, isLoading, userRole } = useAuth();
  if (isLoading) return <Loader />;
  if (!isAuthenticated) return <Navigate to="/auth/signin" replace />;
  if (roles && roles.length > 0 && !roles.includes(userRole)) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
};

// Smart dashboard: show HR or Employee dashboard based on role
const DashboardRoute: React.FC = () => {
  const { userRole } = useAuth();
  return userRole === 'HR' ? <DashboardHR /> : <DashboardEmployee />;
};

// Redirect root based on auth
const RootRedirect: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <Loader />;
  return <Navigate to={isAuthenticated ? '/dashboard' : '/auth/signin'} replace />;
};

const AppRoutes: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<RootRedirect />} />

      {/* Auth routes — redirect to dashboard if already logged in */}
      <Route path="/auth/signin" element={isLoading ? <Loader /> : isAuthenticated ? <Navigate to="/dashboard" replace /> : <SignIn />} />
      <Route path="/auth/signup" element={isLoading ? <Loader /> : isAuthenticated ? <Navigate to="/dashboard" replace /> : <SignUp />} />
      {/* Legacy path support */}
      <Route path="/auth/sign-in" element={<Navigate to="/auth/signin" replace />} />
      <Route path="/auth/sign-up" element={<Navigate to="/auth/signup" replace />} />

      {/* Protected app routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DefaultLayout />}>
          <Route path="/dashboard" element={<Suspense fallback={<Loader />}><DashboardRoute /></Suspense>} />
          <Route path="/tasks" element={<Suspense fallback={<Loader />}><Tasks /></Suspense>} />
          <Route path="/leave" element={<Suspense fallback={<Loader />}><LeaveRequests /></Suspense>} />
          <Route path="/calendar" element={<Suspense fallback={<Loader />}><Calendar /></Suspense>} />
          <Route path="/projects" element={<Suspense fallback={<Loader />}><Projects /></Suspense>} />
          <Route path="/teams" element={<Suspense fallback={<Loader />}><Teams /></Suspense>} />
          <Route path="/meetings" element={<Suspense fallback={<Loader />}><Meetings /></Suspense>} />
          <Route path="/chat" element={<Suspense fallback={<Loader />}><Chat /></Suspense>} />
          <Route path="/profile" element={<Suspense fallback={<Loader />}><Profile /></Suspense>} />
          <Route path="/settings" element={<Suspense fallback={<Loader />}><Settings /></Suspense>} />
          <Route path="/timesheet" element={<Suspense fallback={<Loader />}><Timesheet /></Suspense>} />

          {/* HR-only routes */}
          <Route element={<ProtectedRoute roles={['HR']} />}>
            <Route path="/users" element={<Suspense fallback={<Loader />}><Users /></Suspense>} />
            <Route path="/hr/timesheets" element={<Suspense fallback={<Loader />}><TimesheetManagement /></Suspense>} />
          </Route>
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <NotificationProvider>
            <Toaster position="top-right" toastOptions={{ duration: 4000, style: { borderRadius: '12px', fontSize: '14px' } }} />
            <AppRoutes />
          </NotificationProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
