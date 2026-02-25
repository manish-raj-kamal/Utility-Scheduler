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
const EIGHT_DIGITS = /^\d{8}$/;
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
    joinKey: '',
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

    if (!EIGHT_DIGITS.test(orgId)) return flash('Org ID must be exactly 8 digits', 'error');
    if (!SIX_DIGITS.test(joinKey)) return flash('Join Key must be exactly 6 digits', 'error');

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
    if (!EIGHT_DIGITS.test(orgId)) return flash('Org ID must be exactly 8 digits', 'error');

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
    const joinKey = createForm.joinKey.trim();

    if (!name || !HAS_ALPHABET.test(name)) {
      return flash('Organization name must contain at least one alphabet', 'error');
    }
    if (organizationId && !EIGHT_DIGITS.test(organizationId)) {
      return flash('Organization ID must be exactly 8 digits', 'error');
    }
    if (joinKey && !SIX_DIGITS.test(joinKey)) {
      return flash('Organization Join Key must be exactly 6 digits', 'error');
    }

    setActionLoading(true);
    try {
      await createMyOrganization({
        name,
        organizationId: organizationId || undefined,
        joinKey: joinKey || undefined,
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

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 4px' }}>

      {/* Page header */}
      <div className="page-head" style={{ marginBottom: 28 }}>
        <h1>Organization</h1>
        <p className="muted">Find and join your organization, or create a new one.</p>
      </div>

      {/* Flash message */}
      {message.text && (
        <div
          className={`verify-flash ${message.type === 'error' ? 'error' : 'success'}`}
          style={{ marginBottom: 20, borderRadius: 10, padding: '12px 16px', fontSize: '0.9rem' }}
        >
          {message.type === 'error' ? '⚠️' : '✅'} {message.text}
        </div>
      )}

      {/* Already linked notice */}
      {hasOrganization && (
        <div style={{
          background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
          border: '1px solid #bbf7d0', borderRadius: 12, padding: '14px 18px',
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24
        }}>
          <span style={{ fontSize: 22 }}>✅</span>
          <div>
            <strong style={{ color: '#15803d', fontSize: '0.95rem' }}>You're already in an organization</strong>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#166534' }}>
              {user?.organizationName} &nbsp;•&nbsp; ID: {user?.organizationCode}
            </p>
          </div>
        </div>
      )}

      {/* ── Section 1: Search ── */}
      <div className="panel" style={{ padding: 24, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0
          }}>🔎</div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem' }}>Search Organizations</h3>
            <p className="muted" style={{ margin: 0, fontSize: '0.82rem' }}>Look up by name or numeric Org ID</p>
          </div>
        </div>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10 }}>
          <input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="e.g. Sunrise Apartments or 12345678"
            style={{ flex: 1, opacity: searchText ? 1 : undefined }}
            className="search-input-placeholder-muted"
          />
          <button className="btn primary" disabled={searchLoading} type="submit" style={{ whiteSpace: 'nowrap' }}>
            {searchLoading ? '…' : 'Search'}
          </button>
        </form>

        {searchResults.length > 0 && (
          <ul style={{ margin: '14px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {searchResults.map((org) => (
              <li key={org._id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0'
              }}>
                <div>
                  <strong style={{ fontSize: '0.9rem', color: '#1e293b' }}>{org.name}</strong>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8', marginLeft: 8 }}>ID: {org.organizationCode || 'N/A'}</span>
                </div>
                <span style={{
                  fontSize: '0.72rem', padding: '2px 8px', borderRadius: 20,
                  background: '#e0e7ff', color: '#4338ca', fontWeight: 600, textTransform: 'capitalize'
                }}>{org.type || 'org'}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Section 2: Join ── */}
      <div className="panel" style={{ padding: 24, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'linear-gradient(135deg, #fef9c3, #fde68a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0
          }}>🔑</div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem' }}>Join Organization</h3>
            <p className="muted" style={{ margin: 0, fontSize: '0.82rem' }}>Enter Org ID + Join Key to join instantly, or send a request</p>
          </div>
        </div>

        <form onSubmit={handleJoin}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <label className="auth-label">
              Org ID <span style={{ color: '#94a3b8', fontWeight: 400 }}>(8 digits)</span>
              <input
                value={joinForm.orgId}
                onChange={(e) => setJoinForm((p) => ({ ...p, orgId: e.target.value.replace(/\D/g, '').slice(0, 8) }))}
                placeholder="12345678"
                inputMode="numeric"
                style={{ opacity: joinForm.orgId ? 1 : undefined }}
                className="search-input-placeholder-muted"
              />
            </label>
            <label className="auth-label">
              Join Key <span style={{ color: '#94a3b8', fontWeight: 400 }}>(6 digits)</span>
              <input
                value={joinForm.joinKey}
                onChange={(e) => setJoinForm((p) => ({ ...p, joinKey: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                placeholder="654321"
                inputMode="numeric"
                style={{ opacity: joinForm.joinKey ? 1 : undefined }}
                className="search-input-placeholder-muted"
              />
            </label>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="btn primary" disabled={actionLoading || pinBlocked || hasOrganization} type="submit">
              Join Now
            </button>
            <button className="btn ghost" disabled={actionLoading || hasOrganization} type="button" onClick={handleRequestJoin}>
              Request to Join
            </button>
            {pinBlocked && (
              <span style={{ fontSize: '0.8rem', color: '#ef4444' }}>PIN blocked — use Request to Join.</span>
            )}
          </div>
          {hasOrganization && (
            <p style={{ margin: '10px 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
              You already belong to an organization. Join/request is disabled.
            </p>
          )}
        </form>
      </div>

      {/* ── Section 3: Create ── */}
      <div className="panel" style={{ padding: 24, marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0
          }}>🏢</div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem' }}>Create New Organization</h3>
            <p className="muted" style={{ margin: 0, fontSize: '0.82rem' }}>Creates an organization and makes you its admin</p>
          </div>
        </div>

        <form onSubmit={handleCreateOrg}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <label className="auth-label" style={{ gridColumn: '1 / -1' }}>
              Organization Name <span style={{ color: '#ef4444' }}>*</span>
              <input
                value={createForm.name}
                onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Sunrise Apartments"
                className="search-input-placeholder-muted"
                required
              />
            </label>
            <label className="auth-label">
              Org ID <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional, 8 digits)</span>
              <input
                value={createForm.organizationId}
                onChange={(e) => setCreateForm((p) => ({ ...p, organizationId: e.target.value.replace(/\D/g, '').slice(0, 8) }))}
                placeholder="Leave blank to auto-generate"
                inputMode="numeric"
                className="search-input-placeholder-muted"
              />
            </label>
            <label className="auth-label">
              Join Key <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional, 6 digits)</span>
              <input
                value={createForm.joinKey}
                onChange={(e) => setCreateForm((p) => ({ ...p, joinKey: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                placeholder="Leave blank to auto-generate"
                inputMode="numeric"
                className="search-input-placeholder-muted"
              />
            </label>
            <label className="auth-label">
              Type
              <select value={createForm.type} onChange={(e) => setCreateForm((p) => ({ ...p, type: e.target.value }))}>
                <option value="society">Society</option>
                <option value="college">College</option>
                <option value="company">Company</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="auth-label">
              Contact Email <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span>
              <input
                type="email"
                value={createForm.contactEmail}
                onChange={(e) => setCreateForm((p) => ({ ...p, contactEmail: e.target.value }))}
                placeholder="admin@org.com"
                className="search-input-placeholder-muted"
              />
            </label>
            <label className="auth-label" style={{ gridColumn: '1 / -1' }}>
              Address <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span>
              <input
                value={createForm.address}
                onChange={(e) => setCreateForm((p) => ({ ...p, address: e.target.value }))}
                placeholder="42 MG Road, Bengaluru"
                className="search-input-placeholder-muted"
              />
            </label>
          </div>

          <button className="btn primary" disabled={actionLoading || hasOrganization} type="submit">
            {actionLoading ? 'Creating…' : 'Create Organization'}
          </button>
          {hasOrganization && (
            <p style={{ margin: '10px 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
              You are already linked to an organization. Creating a new one is disabled.
            </p>
          )}
        </form>
      </div>

      {/* Inline placeholder CSS for muted placeholders */}
      <style>{`
        .search-input-placeholder-muted::placeholder { opacity: 0.4; }
      `}</style>
    </div>
  );
}
