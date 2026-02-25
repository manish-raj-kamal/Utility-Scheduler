import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const API = axios.create({ baseURL });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const registerUser = (data) => API.post('/auth/register', data);
export const registerWithOrg = (data) => API.post('/auth/register-org', data);
export const sendRegistrationOtp = (email) => API.post('/auth/send-register-otp', { email });
export const loginUser = (data) => API.post('/auth/login', data);
export const googleLoginUser = (credential) => API.post('/auth/google', { credential });
export const getMe = () => API.get('/auth/me');

export const getUtilities = () => API.get('/utilities');
export const getUtilityById = (id) => API.get(`/utilities/${id}`);
export const createUtility = (data) => API.post('/utilities', data);
export const updateUtility = (id, data) => API.put(`/utilities/${id}`, data);
export const deleteUtility = (id) => API.delete(`/utilities/${id}`);

export const requestBooking = (data) => API.post('/bookings/request', data);
export const getMyBookings = () => API.get('/bookings/my');
export const getAllBookings = () => API.get('/bookings/all');
export const getCalendar = (params) => API.get('/bookings/calendar', { params });
export const cancelBooking = (id) => API.post(`/bookings/cancel/${id}`);
export const adminOverrideBooking = (data) => API.post('/bookings/admin/override', data);

export const getRazorpayKey = () => API.get('/payments/key');
export const createPaymentOrder = (data) => API.post('/payments/create-order', data);
export const verifyPayment = (data) => API.post('/payments/verify', data);
export const getMyPayments = () => API.get('/payments/my');

export const getDashboardStats = () => API.get('/analytics/dashboard');
export const getMostUsedUtilities = () => API.get('/analytics/most-used');
export const getBookingsPerWeek = () => API.get('/analytics/bookings-per-week');
export const getConflictRate = () => API.get('/analytics/conflict-rate');
export const getRevenueData = () => API.get('/analytics/revenue');
export const getUserStats = () => API.get('/analytics/user-stats');

export const getAllUsers = () => API.get('/users');
export const updateMyProfile = (data) => API.put('/users/me', data);
export const uploadMyAvatar = (formData) =>
  API.post('/users/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
export const deleteMyAccount = () => API.delete('/users/me');
export const updateUser = (id, data) => API.put(`/users/${id}`, data);
export const deleteUser = (id) => API.delete(`/users/${id}`);

export const getNotifications = () => API.get('/notifications');
export const markNotificationRead = (id) => API.put(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => API.put('/notifications/read-all');

export const getAuditLogs = () => API.get('/audit');

// Organizations
export const getOrganizations = () => API.get('/organizations');
export const getOrganization = (id) => API.get(`/organizations/${id}`);
export const createOrganization = (data) => API.post('/organizations', data);
export const updateOrganization = (id, data) => API.put(`/organizations/${id}`, data);
export const deleteOrganization = (id) => API.delete(`/organizations/${id}`);
export const searchOrganizations = (q = '') => API.get('/organizations/search', { params: { q } });
export const joinOrganizationWithKey = (data) => API.post('/organizations/join', data);
export const requestToJoinOrganization = (orgId) => API.post('/organizations/join-requests', { orgId });
export const createMyOrganization = (data) => API.post('/organizations/self-create', data);
export const getMyJoinRequests = () => API.get('/organizations/join-requests/me');
export const getPendingJoinRequests = () => API.get('/organizations/join-requests/pending');
export const reviewJoinRequest = (requestId, status) => API.patch(`/organizations/join-requests/${requestId}`, { status });
export const regenerateOrgJoinKey = (organizationId) =>
  organizationId
    ? API.post(`/organizations/${organizationId}/join-key/regenerate`)
    : API.post('/organizations/join-key/regenerate');

// Verification
export const getVerificationStatus = (orgId) => API.get(`/verification/${orgId}/status`);
export const sendEmailOtp = (orgId, email) => API.post(`/verification/${orgId}/email/send-otp`, { email });
export const verifyEmailOtp = (orgId, otp) => API.post(`/verification/${orgId}/email/verify-otp`, { otp });
export const uploadOrgDocuments = (orgId, formData) =>
  API.post(`/verification/${orgId}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
export const approveOrganization = (orgId) => API.post(`/verification/${orgId}/approve`);

export default API;
