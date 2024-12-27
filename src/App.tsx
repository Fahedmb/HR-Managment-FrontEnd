import { useContext, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';

import Loader from './common/Loader';
import PageTitle from './components/PageTitle';
import SignIn from './pages/Authentication/SignIn';
import SignUp from './pages/Authentication/SignUp';
import Calendar from './pages/Calendar';
import Chart from './pages/Chart';
import ECommerce from './pages/Dashboard/DashboardEmployee.tsx';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Tables from './pages/Tables';
import DefaultLayout from './layout/DefaultLayout';
import { AuthProvider, AuthContext } from './context/AuthContext';
import DashboardHR from './pages/Dashboard/DashboardHR.tsx';
import TimesheetScheduleFormHR from './pages/UiElements/TimesheetScheduleFormHR.tsx';
import LeaveRequestFormHR from './pages/UiElements/LeaveRequestFormHR.tsx';
import TimesheetScheduleForm from './pages/Form/TimesheetScheduleForm.tsx';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useContext(AuthContext) || {};
  if (!isAuthenticated) {
    return <Navigate to="/auth/signin" />;
  }
  return <>{children}</>;
};

function App() {
  const [loading, setLoading] = useState(true);
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    // Just simulating a loading state
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <Loader />;

  return (
    <AuthProvider>
      {/* 
        Use DefaultLayout at the top-level so that every route
        gets the same consistent UI, without forcing signIn/signUp to be protected.
      */}
      <DefaultLayout>
        <Routes>
          {/* Public (no auth required) */}
          <Route
            path="/auth/signin"
            element={
              <>
                <PageTitle title="Sign In" />
                <SignIn />
              </>
            }
          />
          <Route
            path="/auth/signup"
            element={
              <>
                <PageTitle title="Sign Up" />
                <SignUp />
              </>
            }
          />

          {/* Protected (requires auth) */}
          <Route
            index
            element={
              <ProtectedRoute>
                <PageTitle title="Employee Dashboard" />
                <ECommerce />
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                <PageTitle title="Calendar" />
                <Calendar />
              </ProtectedRoute>
            }
          />
          <Route
            path="/Dashboard/DashboardHR.tsx"
            element={
              <ProtectedRoute>
                <PageTitle title="Dashboard HR" />
                <DashboardHR />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <PageTitle title="Profile" />
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/forms/TimesheetScheduleForm"
            element={
              <ProtectedRoute>
                <PageTitle title="Timesheet Schedule Form" />
                <TimesheetScheduleForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/forms/LeaveRequestFormHR"
            element={
              <ProtectedRoute>
                <PageTitle title="Leave Request Form" />
                <LeaveRequestFormHR />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tables"
            element={
              <ProtectedRoute>
                <PageTitle title="Tables" />
                <Tables />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <PageTitle title="Settings" />
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chart"
            element={
              <ProtectedRoute>
                <PageTitle title="Charts" />
                <Chart />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ui/TimesheetScheduleFormHR"
            element={
              <ProtectedRoute>
                <PageTitle title="Timesheet Schedule HR" />
                <TimesheetScheduleFormHR />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ui/LeaveRequestFormHR"
            element={
              <ProtectedRoute>
                <PageTitle title="Leave Request HR" />
                <LeaveRequestFormHR />
              </ProtectedRoute>
            }
          />
        </Routes>
      </DefaultLayout>
    </AuthProvider>
  );
}

export default App;
