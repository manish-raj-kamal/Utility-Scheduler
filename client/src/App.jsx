import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppLayout from './layouts/AppLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UserDashboard from './pages/UserDashboard';
import UtilitiesPage from './pages/UtilitiesPage';
import CalendarPage from './pages/CalendarPage';
import MyBookingsPage from './pages/MyBookingsPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/AdminDashboard';
import AdminUtilities from './pages/AdminUtilities';
import AdminBookings from './pages/AdminBookings';
import AdminUsers from './pages/AdminUsers';
import AnalyticsPage from './pages/AnalyticsPage';
import AuditLogsPage from './pages/AuditLogsPage';
import OrgVerificationPage from './pages/OrgVerificationPage';
import AdminOrganizations from './pages/AdminOrganizations';
import NotFoundPage from './pages/NotFoundPage';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-wrap">
        <div className="auth-card"><h2>Loading...</h2></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;
  if (adminOnly && !['org_admin', 'superadmin'].includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) {
    return <Navigate to={['org_admin', 'superadmin'].includes(user.role) ? '/admin' : '/dashboard'} />;
  }
  return children;
};

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/utilities" element={<UtilitiesPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/my-bookings" element={<MyBookingsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/verification" element={<OrgVerificationPage />} />
      </Route>

      <Route element={<ProtectedRoute adminOnly><AppLayout /></ProtectedRoute>}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/utilities" element={<AdminUtilities />} />
        <Route path="/admin/bookings" element={<AdminBookings />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/analytics" element={<AnalyticsPage />} />
        <Route path="/admin/audit" element={<AuditLogsPage />} />
        <Route path="/admin/organizations" element={<AdminOrganizations />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
