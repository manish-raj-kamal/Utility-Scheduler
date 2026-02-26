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
import AppLoadingScreen from './components/AppLoadingScreen';

const getDefaultRouteForUser = (user) => {
  if (!user) return '/login';
  if (user.role === 'superadmin') return '/admin/organizations';
  if (user.role === 'org_admin') return '/admin';
  return user.organizationId ? '/dashboard' : '/verification';
};

const ProtectedRoute = ({ children, allowedRoles = null, requireOrganization = false }) => {
  const { user, loading } = useAuth();

  if (loading) return <AppLoadingScreen message="Checking your account and loading your workspace..." />;

  if (!user) return <Navigate to="/login" />;

  if (requireOrganization && user.role !== 'superadmin' && !user.organizationId) {
    return <Navigate to="/verification" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getDefaultRouteForUser(user)} />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <AppLoadingScreen message="Booting FairSlot..." />;
  if (user) {
    return <Navigate to={getDefaultRouteForUser(user)} />;
  }
  return children;
};

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

      {/* Universal: all logged-in users */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* Member + Org Admin: view/book utilities (no superadmin) */}
      <Route element={<ProtectedRoute allowedRoles={['member', 'org_admin']} requireOrganization><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/utilities" element={<UtilitiesPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/my-bookings" element={<MyBookingsPage />} />
      </Route>

      {/* Org Admin + Superadmin: admin home + analytics */}
      <Route element={<ProtectedRoute allowedRoles={['org_admin', 'superadmin']} requireOrganization><AppLayout /></ProtectedRoute>}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/analytics" element={<AnalyticsPage />} />
      </Route>

      {/* Org Admin only: manage utilities, bookings, members */}
      <Route element={<ProtectedRoute allowedRoles={['org_admin']} requireOrganization><AppLayout /></ProtectedRoute>}>
        <Route path="/admin/utilities" element={<AdminUtilities />} />
        <Route path="/admin/bookings" element={<AdminBookings />} />
        <Route path="/admin/users" element={<AdminUsers />} />
      </Route>

      {/* Logged-in users: join/create organization */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/verification" element={<OrgVerificationPage />} />
      </Route>

      {/* Superadmin only: organisations list, audit logs */}
      <Route element={<ProtectedRoute allowedRoles={['superadmin']} requireOrganization><AppLayout /></ProtectedRoute>}>
        <Route path="/admin/organizations" element={<AdminOrganizations />} />
        <Route path="/admin/audit" element={<AuditLogsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
