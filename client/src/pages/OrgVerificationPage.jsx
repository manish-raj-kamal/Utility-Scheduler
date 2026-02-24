import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getVerificationStatus,
  sendEmailOtp,
  verifyEmailOtp,
  uploadOrgDocuments
} from '../services/api';

const STEPS = [
  { level: 0, label: 'Registered', icon: '🏢', desc: 'Organization created' },
  { level: 1, label: 'Email Verified', icon: '✉️', desc: 'Verify your contact email' },
  { level: 2, label: 'Documents', icon: '📄', desc: 'Upload verification documents' },
  { level: 3, label: 'Approved', icon: '✅', desc: 'Superadmin final approval' }
];

export default function OrgVerificationPage() {
  const { user } = useAuth();
  const orgId = user?.organizationId;

  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  // Email OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [email, setEmail] = useState('');
  const otpRefs = useRef([]);

  // File upload state
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      return;
    }
    fetchStatus();
  }, [orgId]);

  const fetchStatus = async () => {
    try {
      const { data } = await getVerificationStatus(orgId);
      setStatus(data);
      setEmail(data.contactEmail || '');
    } catch {
      setMsg({ text: 'Failed to load verification status', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const flash = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 4000);
  };

  // ── Email OTP ──
  const handleSendOtp = async () => {
    if (!email) return flash('Enter a contact email', 'error');
    setActionLoading(true);
    try {
      await sendEmailOtp(orgId, email);
      setOtpSent(true);
      flash('OTP sent — check your email (or server console in dev mode)');
    } catch (err) {
      flash(err.response?.data?.message || 'Failed to send OTP', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length !== 6) return flash('Enter the full 6-digit OTP', 'error');
    setActionLoading(true);
    try {
      await verifyEmailOtp(orgId, code);
      flash('Email verified!');
      setOtpSent(false);
      setOtp(['', '', '', '', '', '']);
      fetchStatus();
    } catch (err) {
      flash(err.response?.data?.message || 'Invalid OTP', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Documents ──
  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleUploadDocs = async () => {
    if (files.length === 0) return flash('Select at least one file', 'error');
    setActionLoading(true);
    const formData = new FormData();
    files.forEach((f) => formData.append('documents', f));
    try {
      await uploadOrgDocuments(orgId, formData);
      flash('Documents uploaded!');
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchStatus();
    } catch (err) {
      flash(err.response?.data?.message || 'Upload failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Render helpers ──
  const currentLevel = status?.verificationLevel ?? 0;

  if (loading) {
    return (
      <div className="verify-page">
        <div className="verify-loader">
          <div className="verify-spinner" />
          <p>Loading verification status…</p>
        </div>
      </div>
    );
  }

  if (!orgId) {
    return (
      <div className="verify-page">
        <div className="panel" style={{ textAlign: 'center', padding: 40 }}>
          <h2>No Organization</h2>
          <p className="muted">You must be assigned to an organization before verifying.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="verify-page">
      <div className="page-head">
        <h1>Organization Verification</h1>
        <p className="muted">Complete each step to unlock full platform features.</p>
      </div>

      {/* ── Stepper ── */}
      <div className="verify-stepper">
        {STEPS.map((step, i) => {
          const done = currentLevel > step.level || (step.level === 0);
          const active = step.level === currentLevel && step.level !== 0;
          return (
            <div
              key={step.level}
              className={`verify-step ${done ? 'done' : ''} ${active ? 'active' : ''}`}
              style={{ animationDelay: `${i * 0.12}s` }}
            >
              <div className="verify-step-icon">
                {done ? '✓' : step.icon}
              </div>
              <div className="verify-step-info">
                <strong>{step.label}</strong>
                <span>{step.desc}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`verify-step-line ${done ? 'done' : ''}`} />}
            </div>
          );
        })}
      </div>

      {/* ── Flash message ── */}
      {msg.text && (
        <div className={`verify-flash ${msg.type}`}>
          {msg.type === 'error' ? '⚠️' : '✅'} {msg.text}
        </div>
      )}

      {/* ── Level badge ── */}
      <div className="verify-level-badge" style={{ animationDelay: '0.3s' }}>
        <div className="verify-level-ring">
          <span>{currentLevel}</span>
        </div>
        <div>
          <strong>Verification Level {currentLevel}</strong>
          <p className="muted">
            {currentLevel === 0 && 'Verify your email to reach Level 1'}
            {currentLevel === 1 && 'Upload documents to reach Level 2'}
            {currentLevel === 2 && 'Waiting for superadmin approval for Level 3'}
            {currentLevel === 3 && 'Fully verified — all features unlocked!'}
          </p>
        </div>
      </div>

      {/* ── Step 1 — Email Verification ── */}
      {currentLevel < 1 && (
        <div className="verify-card fade-in-up" style={{ animationDelay: '0.15s' }}>
          <div className="verify-card-header">
            <span className="verify-card-icon">✉️</span>
            <div>
              <h3>Verify Contact Email</h3>
              <p className="muted">We'll send a 6-digit code to your organization email</p>
            </div>
          </div>

          {!otpSent ? (
            <div className="verify-card-body">
              <label className="auth-label">
                Organization email
                <input
                  type="email"
                  placeholder="admin@yourorg.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <button
                className="btn primary"
                onClick={handleSendOtp}
                disabled={actionLoading}
              >
                {actionLoading ? 'Sending…' : 'Send OTP'}
              </button>
            </div>
          ) : (
            <div className="verify-card-body">
              <p style={{ marginBottom: 12 }}>Enter the 6-digit code sent to <strong>{email}</strong></p>
              <div className="otp-group">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (otpRefs.current[i] = el)}
                    className="otp-input"
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    autoFocus={i === 0}
                  />
                ))}
              </div>
              <div className="actions-inline" style={{ marginTop: 12 }}>
                <button
                  className="btn primary"
                  onClick={handleVerifyOtp}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Verifying…' : 'Verify'}
                </button>
                <button
                  className="btn ghost"
                  onClick={() => { setOtpSent(false); setOtp(['', '', '', '', '', '']); }}
                >
                  Resend
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Step 2 — Document Upload ── */}
      {currentLevel >= 1 && currentLevel < 2 && (
        <div className="verify-card fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="verify-card-header">
            <span className="verify-card-icon">📄</span>
            <div>
              <h3>Upload Verification Documents</h3>
              <p className="muted">
                Upload registration certificate, society docs, or any proof (PDF/PNG/JPG, max 5 MB each)
              </p>
            </div>
          </div>

          <div className="verify-card-body">
            <div
              className="verify-dropzone"
              onClick={() => fileInputRef.current?.click()}
            >
              <span className="verify-dropzone-icon">📁</span>
              <p>{files.length > 0 ? `${files.length} file(s) selected` : 'Click to select files'}</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </div>

            {files.length > 0 && (
              <ul className="verify-file-list">
                {files.map((f, i) => (
                  <li key={i}>📎 {f.name} <span className="muted">({(f.size / 1024).toFixed(0)} KB)</span></li>
                ))}
              </ul>
            )}

            <button
              className="btn primary"
              onClick={handleUploadDocs}
              disabled={actionLoading || files.length === 0}
            >
              {actionLoading ? 'Uploading…' : 'Upload Documents'}
            </button>
          </div>

          {/* Show previously uploaded docs */}
          {status?.documents?.length > 0 && (
            <div className="verify-card-body" style={{ borderTop: '1px solid #e8ecf8' }}>
              <strong>Previously uploaded:</strong>
              <ul className="verify-file-list">
                {status.documents.map((d, i) => (
                  <li key={i}>📎 {d.name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── Step 3 — Awaiting Approval ── */}
      {currentLevel === 2 && (
        <div className="verify-card fade-in-up" style={{ animationDelay: '0.25s' }}>
          <div className="verify-card-header">
            <span className="verify-card-icon pulse-icon">⏳</span>
            <div>
              <h3>Awaiting Superadmin Approval</h3>
              <p className="muted">
                Your documents are under review. You'll be notified once approved.
              </p>
            </div>
          </div>
          <div className="verify-card-body" style={{ textAlign: 'center' }}>
            <div className="verify-waiting-anim">
              <div className="verify-dot" style={{ animationDelay: '0s' }} />
              <div className="verify-dot" style={{ animationDelay: '0.2s' }} />
              <div className="verify-dot" style={{ animationDelay: '0.4s' }} />
            </div>
            <p className="muted">Sit tight — this usually takes less than 24 hours</p>
          </div>
        </div>
      )}

      {/* ── Level 3 — All done ── */}
      {currentLevel === 3 && (
        <div className="verify-card verify-card-success fade-in-up" style={{ animationDelay: '0.15s' }}>
          <div className="verify-card-header">
            <span className="verify-card-icon">🎉</span>
            <div>
              <h3>Fully Verified!</h3>
              <p>Your organization has full access to all platform features.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Feature limits info ── */}
      <div className="verify-info-banner fade-in-up" style={{ animationDelay: '0.35s' }}>
        <strong>What each level unlocks:</strong>
        <div className="verify-info-grid">
          <div className="verify-info-item">
            <span className="verify-info-level">0</span>
            <p>Up to 3 bookings per week</p>
          </div>
          <div className="verify-info-item">
            <span className="verify-info-level lv1">1</span>
            <p>Unlimited bookings</p>
          </div>
          <div className="verify-info-item">
            <span className="verify-info-level lv2">2</span>
            <p>Priority waitlist + analytics</p>
          </div>
          <div className="verify-info-item">
            <span className="verify-info-level lv3">3</span>
            <p>All features + custom branding</p>
          </div>
        </div>
      </div>
    </div>
  );
}
