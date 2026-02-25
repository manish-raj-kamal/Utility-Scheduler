import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FloatingIcons from '../components/FloatingIcons';
import GoogleLoginButton from '../components/GoogleLoginButton';
import W8Icon from '../components/W8Icon';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, googleLogin } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(form);
      const isAdmin = data.user.role === 'org_admin' || data.user.role === 'superadmin';
      navigate(isAdmin ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async (email, password) => {
    setError('');
    setLoading(true);
    try {
      const data = await login({ email, password });
      const isAdmin = data.user.role === 'org_admin' || data.user.role === 'superadmin';
      navigate(isAdmin ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (credential) => {
    setError('');
    setLoading(true);
    try {
      const data = await googleLogin(credential);
      const isAdmin = data.user.role === 'org_admin' || data.user.role === 'superadmin';
      navigate(isAdmin ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <FloatingIcons />

      {/* Left branding panel */}
      <div className="auth-side">
        <div className="auth-side-content">
          <Link to="/" className="auth-brand"><W8Icon name="utilities" size={22} alt="" style={{marginRight:6}} />UtilityScheduler</Link>
          <h1>Welcome back</h1>
          <p>Sign in to manage your bookings, view schedules, and access your community's shared utilities.</p>
          <div className="auth-side-features">
            <div className="auth-feature"><W8Icon name="calendar" size={22} alt="" /> Smart calendar scheduling</div>
            <div className="auth-feature"><W8Icon name="verification" size={22} alt="" /> Fair access for everyone</div>
            <div className="auth-feature"><W8Icon name="analytics" size={22} alt="" /> Usage analytics</div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-form-side">
        <form className="auth-form-card" onSubmit={onSubmit}>
          <div className="auth-form-header">
            <h2>Sign in</h2>
            <p className="muted">Enter your credentials to continue</p>
          </div>

          {error && <p className="error-banner">{error}</p>}

          <GoogleLoginButton onSuccess={handleGoogle} text="signin_with" />

          <div className="auth-divider">
            <span>or continue with email</span>
          </div>

          <label className="auth-label">
            Email address
            <input name="email" type="email" placeholder="you@example.com" value={form.email} onChange={onChange} required />
          </label>

          <label className="auth-label">
            Password
            <input name="password" type="password" placeholder="••••••••" value={form.password} onChange={onChange} required />
          </label>

          <button className="btn primary full" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <p className="auth-footer-text">
            Don't have an account? <Link to="/register" className="link-accent">Create one</Link>
          </p>

          <div className="test-accounts">
            <p className="test-accounts-label">Quick test login</p>
            <div className="test-btns">
              <button type="button" className="test-btn member" onClick={() => testLogin('member@test.com', 'member123')}>👤 Member</button>
              <button type="button" className="test-btn admin" onClick={() => testLogin('admin@test.com', 'admin123')}>🛡️ Org Admin</button>
              <button type="button" className="test-btn superadmin" onClick={() => testLogin('superadmin@utility.com', 'super123')}>⭐ Superadmin</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
