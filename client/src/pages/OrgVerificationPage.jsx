import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  createMyOrganization,
  joinOrganizationWithKey,
  requestToJoinOrganization,
  searchOrganizations
} from '../services/api';

const DIGITS_ONLY = /^\d+$/;
const SIX_DIGITS = /^\d{6}$/;
const HAS_ALPHABET = /[A-Za-z]/;

export default function OrgVerificationPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [joinForm, setJoinForm] = useState({ orgId: '', joinKey: '' });
  const [createForm, setCreateForm] = useState({
    name: '',
    organizationId: '',
    type: 'society',
    address: '',
    contactEmail: ''
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [pinBlocked, setPinBlocked] = useState(false);

  const hasOrganization = useMemo(() => Boolean(user?.organizationId), [user?.organizationId]);

  useEffect(() => {
    if (user?.role === 'superadmin') {
      window.location.href = '/admin/organizations';
    }
  }, [user?.role]);

  useEffect(() => {
    const initialQ = (searchParams.get('q') || '').trim();
    if (initialQ) setSearchText(initialQ);
  }, [searchParams]);

  useEffect(() => {
    const value = searchText.trim();
    if (!value) return;
    if (!DIGITS_ONLY.test(value) && value.length < 2) return;

    let active = true;
    setSearchLoading(true);
    searchOrganizations(value)
      .then(({ data }) => {
        if (!active) return;
        setSearchResults(data || []);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setSearchLoading(false);
      });

    return () => {
      active = false;
    };
  }, [searchText]);

  const flash = (text, type = 'success') => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3500);
  };

  const reloadTo = (path) => {
    window.location.href = path;
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    const value = searchText.trim();
    if (!value) {
      setSearchResults([]);
      return;
    }
    if (!DIGITS_ONLY.test(value) && value.length < 2) {
      flash('Organization name search requires at least 2 characters', 'error');
      return;
    }

    setSearchLoading(true);
    try {
      const { data } = await searchOrganizations(value);
      setSearchResults(data || []);
      if (!data?.length) flash('No organizations found', 'error');
    } catch (err) {
      flash(err.response?.data?.message || 'Search failed', 'error');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    const orgId = joinForm.orgId.trim();
    const joinKey = joinForm.joinKey.trim();

    if (!DIGITS_ONLY.test(orgId)) return flash('orgId must contain numbers only', 'error');
    if (!SIX_DIGITS.test(joinKey)) return flash('joinKey must be exactly 6 digits', 'error');

    setActionLoading(true);
    try {
      await joinOrganizationWithKey({ orgId, joinKey });
      flash('Joined organization successfully');
      reloadTo('/dashboard');
    } catch (err) {
      const responseData = err.response?.data || {};
      if (err.response?.status === 429 || responseData.method === 'approval_only') {
        setPinBlocked(true);
        flash(responseData.message || 'PIN attempts exceeded. Use approval request method.', 'error');
      } else {
        if (typeof responseData.attemptsLeft === 'number' && responseData.attemptsLeft <= 0) {
          setPinBlocked(true);
        }
        const attemptsMessage = typeof responseData.attemptsLeft === 'number'
          ? ` (${responseData.attemptsLeft} attempts left)`
          : '';
        flash((responseData.message || 'Join failed') + attemptsMessage, 'error');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestJoin = async () => {
    const orgId = joinForm.orgId.trim();
    if (!DIGITS_ONLY.test(orgId)) return flash('orgId must contain numbers only', 'error');

    setActionLoading(true);
    try {
      await requestToJoinOrganization(orgId);
      flash('Join request submitted. Wait for org_admin approval.');
    } catch (err) {
      flash(err.response?.data?.message || 'Join request failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateOrg = async (e) => {
    e.preventDefault();

    const name = createForm.name.trim();
    const organizationId = createForm.organizationId.trim();

    if (!name || !HAS_ALPHABET.test(name)) {
      return flash('Organization name must contain at least one alphabet', 'error');
    }
    if (organizationId && !DIGITS_ONLY.test(organizationId)) {
      return flash('organizationId must contain numbers only', 'error');
    }

    setActionLoading(true);
    try {
      await createMyOrganization({
        name,
        organizationId: organizationId || undefined,
        type: createForm.type,
        address: createForm.address,
        contactEmail: createForm.contactEmail
      });
      flash('Organization created. You are now org_admin.');
      reloadTo('/admin');
    } catch (err) {
      flash(err.response?.data?.message || 'Organization creation failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (user?.role === 'superadmin') return null;

  if (hasOrganization) {
    return (
      <div className="verify-page">
        <div className="panel" style={{ textAlign: 'center', padding: 40 }}>
          <h2>Organization Linked</h2>
          <p className="muted">You already belong to an organization.</p>
          <button
            className="btn primary"
            onClick={() => reloadTo(user?.role === 'org_admin' ? '/admin' : '/dashboard')}
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="verify-page">
      <div className="page-head">
        <h1>Join or Create Organization</h1>
        <p className="muted">Required before using booking and admin features.</p>
      </div>

      {message.text && (
        <div className={`verify-flash ${message.type === 'error' ? 'error' : 'success'}`}>
          {message.type === 'error' ? '⚠️' : '✅'} {message.text}
        </div>
      )}

      <div className="verify-card">
        <div className="verify-card-header">
          <span className="verify-card-icon">🔎</span>
          <div>
            <h3>Search Organizations</h3>
            <p className="muted">Search by organization name or numeric orgId</p>
          </div>
        </div>
        <form className="verify-card-body" onSubmit={handleSearch}>
          <label className="auth-label">
            Org name or orgId
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Sunrise or 123456"
            />
          </label>
          <button className="btn primary" disabled={searchLoading} type="submit">
            {searchLoading ? 'Searching…' : 'Search'}
          </button>
        </form>

        {searchResults.length > 0 && (
          <div className="verify-card-body" style={{ borderTop: '1px solid #e8ecf8' }}>
            <ul className="verify-file-list">
              {searchResults.map((org) => (
                <li key={org._id}>
                  <strong>{org.name}</strong>
                  <span className="muted"> — orgId: {org.organizationCode || 'N/A'}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="verify-card" style={{ marginTop: 16 }}>
        <div className="verify-card-header">
          <span className="verify-card-icon">🔐</span>
          <div>
            <h3>Join Organization</h3>
            <p className="muted">Join instantly with orgId and 6-digit key, or send request</p>
          </div>
        </div>
        <form className="verify-card-body" onSubmit={handleJoin}>
          <div className="auth-row">
            <label className="auth-label">
              orgId (numbers only)
              <input
                value={joinForm.orgId}
                onChange={(e) => setJoinForm((p) => ({ ...p, orgId: e.target.value.replace(/\D/g, '') }))}
                placeholder="123456"
                inputMode="numeric"
              />
            </label>
            <label className="auth-label">
              joinKey (6 digits)
              <input
                value={joinForm.joinKey}
                onChange={(e) => setJoinForm((p) => ({ ...p, joinKey: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                placeholder="654321"
                inputMode="numeric"
              />
            </label>
          </div>
          <div className="actions-inline">
            <button className="btn primary" disabled={actionLoading || pinBlocked} type="submit">
              Join Now
            </button>
            <button className="btn ghost" disabled={actionLoading} type="button" onClick={handleRequestJoin}>
              Request to Join
            </button>
          </div>
          {pinBlocked && (
            <p className="muted" style={{ marginTop: 8 }}>
              PIN join is blocked for 24 hours after 5 failed attempts. Use Request to Join.
            </p>
          )}
        </form>
      </div>

      <div className="verify-card" style={{ marginTop: 16 }}>
        <div className="verify-card-header">
          <span className="verify-card-icon">🏢</span>
          <div>
            <h3>Create New Organization</h3>
            <p className="muted">Creates organization and upgrades your role to org_admin</p>
          </div>
        </div>
        <form className="verify-card-body" onSubmit={handleCreateOrg}>
          <div className="auth-row">
            <label className="auth-label">
              Organization name
              <input
                value={createForm.name}
                onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Sunrise Apartments"
                required
              />
            </label>
            <label className="auth-label">
              organizationId (optional, numbers only)
              <input
                value={createForm.organizationId}
                onChange={(e) => setCreateForm((p) => ({ ...p, organizationId: e.target.value.replace(/\D/g, '') }))}
                placeholder="123456"
                inputMode="numeric"
              />
            </label>
          </div>

          <div className="auth-row">
            <label className="auth-label">
              Type
              <select
                value={createForm.type}
                onChange={(e) => setCreateForm((p) => ({ ...p, type: e.target.value }))}
              >
                <option value="society">Society</option>
                <option value="college">College</option>
                <option value="company">Company</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="auth-label">
              Contact email (optional)
              <input
                type="email"
                value={createForm.contactEmail}
                onChange={(e) => setCreateForm((p) => ({ ...p, contactEmail: e.target.value }))}
                placeholder="admin@org.com"
              />
            </label>
          </div>

          <label className="auth-label">
            Address (optional)
            <input
              value={createForm.address}
              onChange={(e) => setCreateForm((p) => ({ ...p, address: e.target.value }))}
              placeholder="42 MG Road"
            />
          </label>

          <button className="btn primary" disabled={actionLoading} type="submit">
            Create Organization
          </button>
        </form>
      </div>
    </div>
  );
}
