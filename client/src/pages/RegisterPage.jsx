import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sendRegistrationOtp } from '../services/api';
import GoogleLoginButton from '../components/GoogleLoginButton';
import W8Icon from '../components/W8Icon';

/* ── tiny particle canvas drawn behind the right panel ── */
function ParticleCanvas() {
  const ref = useRef(null);

  useEffect(() => {
    const cvs = ref.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    let raf;
    const DPR = window.devicePixelRatio || 1;

    const resize = () => {
      cvs.width = cvs.offsetWidth * DPR;
      cvs.height = cvs.offsetHeight * DPR;
      ctx.scale(DPR, DPR);
    };
    resize();
    window.addEventListener('resize', resize);

    const dots = Array.from({ length: 45 }, () => ({
      x: Math.random() * cvs.offsetWidth,
      y: Math.random() * cvs.offsetHeight,
      r: Math.random() * 2.5 + 1,
      dx: (Math.random() - 0.5) * 0.35,
      dy: (Math.random() - 0.5) * 0.35,
      o: Math.random() * 0.25 + 0.08,
    }));

    const draw = () => {
      const W = cvs.offsetWidth, H = cvs.offsetHeight;
      ctx.clearRect(0, 0, W, H);
      dots.forEach((d) => {
        d.x += d.dx; d.y += d.dy;
        if (d.x < 0) d.x = W; if (d.x > W) d.x = 0;
        if (d.y < 0) d.y = H; if (d.y > H) d.y = 0;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(124,58,237,${d.o})`;
        ctx.fill();
      });
      // lines between nearby dots
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x, dy = dots[i].y - dots[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(dots[i].x, dots[i].y);
            ctx.lineTo(dots[j].x, dots[j].y);
            ctx.strokeStyle = `rgba(124,58,237,${0.06 * (1 - dist / 110)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={ref} className="reg-particle-canvas" />;
}

/* ── floating bubbles overlay on left panel ── */
function FloatingBubbles() {
  const bubbles = [
    { emoji: '🏋️', size: 52, top: '8%', left: '12%', delay: 0, dur: 7 },
    { emoji: '🛝', size: 46, top: '22%', right: '10%', delay: 1.2, dur: 6 },
    { emoji: '🔌', size: 50, top: '50%', left: '8%', delay: 0.6, dur: 8 },
    { emoji: '🏛️', size: 48, bottom: '18%', right: '14%', delay: 2, dur: 6.5 },
    { emoji: '🅿️', size: 42, top: '14%', left: '55%', delay: 3, dur: 5.5 },
    { emoji: '💧', size: 44, bottom: '30%', left: '20%', delay: 1.8, dur: 7.2 },
    { emoji: '⚡', size: 40, bottom: '8%', left: '55%', delay: 0.3, dur: 6.8 },
    { emoji: '🏸', size: 44, top: '38%', right: '6%', delay: 2.5, dur: 5.8 },
  ];

  return (
    <div className="reg-floating-wrap" aria-hidden="true">
      {bubbles.map((b, i) => {
        const pos = {};
        if (b.top) pos.top = b.top;
        if (b.bottom) pos.bottom = b.bottom;
        if (b.left) pos.left = b.left;
        if (b.right) pos.right = b.right;
        return (
          <div
            key={i}
            className="reg-bubble"
            style={{
              ...pos,
              width: b.size,
              height: b.size,
              animationDelay: `${b.delay}s`,
              animationDuration: `${b.dur}s`,
            }}
          >
            <span>{b.emoji}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ── animated mail icon for OTP step ── */
function MailAnimation() {
  return (
    <div className="mail-anim">
      <div className="mail-envelope">
        <div className="mail-flap" />
        <div className="mail-body">📨</div>
      </div>
      <div className="mail-rings">
        <span /><span /><span />
      </div>
    </div>
  );
}

/* ── success checkmark (after OTP submitted) ── */
function SuccessCheck() {
  return (
    <div className="reg-success-check">
      <svg viewBox="0 0 52 52" className="reg-check-svg">
        <circle cx="26" cy="26" r="25" className="reg-check-circle" />
        <path d="M14.1 27.2l7.1 7.2 16.7-16.8" className="reg-check-path" />
      </svg>
    </div>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, registerOrg, googleLogin } = useAuth();

  const [mode, setMode] = useState('member');
  const [step, setStep] = useState(1);           // 1=form  2=otp  3=success
  const [form, setForm] = useState({
    name: '', email: '', flatNumber: '', password: '',
    phone: '', orgName: '', orgType: 'society', orgAddress: '', contactEmail: ''
  });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [shake, setShake] = useState(false);

  const isOrg = mode === 'org_admin';

  // cooldown tick
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // auto-focus first OTP box when step 2
  useEffect(() => {
    if (step === 2) otpRefs.current[0]?.focus();
  }, [step]);

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const triggerShake = useCallback(() => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }, []);

  /* step 1 → send OTP */
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await sendRegistrationOtp(form.email);
      setCooldown(45);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
      triggerShake();
    } finally { setLoading(false); }
  };

  /* resend */
  const handleResend = async () => {
    if (cooldown > 0) return;
    setError(''); setLoading(true);
    try {
      await sendRegistrationOtp(form.email);
      setCooldown(45);
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    } finally { setLoading(false); }
  };

  /* otp input helpers */
  const onOtpChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp]; next[idx] = val; setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };
  const onOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
  };
  const onOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = [...otp];
    pasted.split('').forEach((ch, i) => { next[i] = ch; });
    setOtp(next);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  /* step 2 → verify & register */
  const handleVerify = async (e) => {
    e.preventDefault();
    const emailOtp = otp.join('');
    if (emailOtp.length < 6) { setError('Enter the full 6-digit code'); triggerShake(); return; }

    setError(''); setLoading(true);
    try {
      if (isOrg) {
        await registerOrg({ ...form, emailOtp });
      } else {
        await register({ name: form.name, email: form.email, password: form.password, flatNumber: form.flatNumber, emailOtp });
      }
      setStep(3); // success
      setTimeout(() => navigate(isOrg ? '/admin' : '/dashboard'), 1800);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      triggerShake();
    } finally { setLoading(false); }
  };

  const handleGoogle = async (credential) => {
    setError(''); setLoading(true);
    try {
      const data = await googleLogin(credential);
      const admin = data.user.role === 'org_admin' || data.user.role === 'superadmin';
      navigate(admin ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Google sign-up failed');
    } finally { setLoading(false); }
  };

  /* ── left-panel dynamic content ── */
  const sideContent = {
    1: {
      title: isOrg ? 'Register your organization' : 'Join your community',
      sub: isOrg
        ? 'Set up your society, college, or company and start managing shared utilities in minutes.'
        : 'Create an account to start booking shared utilities — parking, halls, EV charging and more.',
      feats: isOrg
        ? [['🏢', 'Manage multiple utilities'], ['📊', 'Analytics & audit logs'], ['👥', 'Invite members instantly']]
        : [['🔔', 'Instant notifications'], ['🏛️', 'Community hall booking'], ['🔌', 'EV charger scheduling']],
    },
    2: {
      title: 'Verify your email',
      sub: `We sent a 6-digit code to ${form.email}. Enter it below to finish creating your account.`,
      feats: [['📧', 'Check your inbox & spam'], ['⏱️', 'Code expires in 10 min'], ['🔒', 'Secure one-time code']],
    },
    3: {
      title: 'You\'re all set!',
      sub: 'Your account has been created successfully. Redirecting you now…',
      feats: [['🎉', 'Welcome aboard!'], ['🚀', 'Dashboard loading…']],
    },
  }[step];

  return (
    <div className="auth-page reg-page">
      {/* Floating bubbles on left panel */}
      <FloatingBubbles />

      {/* Left branding panel */}
      <div className="auth-side">
        <div className="auth-side-content reg-side-content" key={step}>
          <Link to="/" className="auth-brand"><W8Icon name="utilities" size={22} alt="" style={{marginRight:6}} />UtilityScheduler</Link>
          <h1 className="reg-side-title">{sideContent.title}</h1>
          <p className="reg-side-sub">{sideContent.sub}</p>
          <div className="auth-side-features reg-side-feats">
            {sideContent.feats.map(([icon, text], i) => (
              <div className="auth-feature" key={i} style={{ animationDelay: `${i * 0.12}s` }}>
                <span>{icon}</span> {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-form-side reg-form-side">
        <ParticleCanvas />

        <div className={`auth-form-card reg-card ${shake ? 'reg-shake' : ''}`}>
          {/* Step indicator */}
          <div className="reg-steps-bar">
            <div className={`reg-step-dot ${step >= 1 ? 'active' : ''}`}>
              {step > 1 ? <span className="reg-dot-check">✓</span> : '1'}
            </div>
            <div className={`reg-step-line ${step >= 2 ? 'filled' : ''}`} />
            <div className={`reg-step-dot ${step >= 2 ? 'active' : ''}`}>
              {step > 2 ? <span className="reg-dot-check">✓</span> : '2'}
            </div>
          </div>

          {/* ——— STEP 1: FORM ——— */}
          <div className={`reg-step-panel ${step === 1 ? 'visible' : step > 1 ? 'hidden-left' : 'hidden-right'}`}>
            <form onSubmit={handleSendOtp} className="reg-form-inner">
              <div className="auth-form-header">
                <h2>Create account</h2>
                <p className="muted">Choose how you'd like to get started</p>
              </div>

              {/* Role toggle */}
              <div className="role-toggle">
                <button type="button" className={`role-toggle-btn ${!isOrg ? 'active' : ''}`} onClick={() => setMode('member')}>
                  <span className="role-toggle-icon">👤</span> Member
                </button>
                <button type="button" className={`role-toggle-btn ${isOrg ? 'active' : ''}`} onClick={() => setMode('org_admin')}>
                  <span className="role-toggle-icon">🏢</span> Organization
                </button>
                <div className={`role-toggle-slider ${isOrg ? 'right' : 'left'}`} />
              </div>

              {error && step === 1 && <p className="error-banner reg-error">{error}</p>}

              {!isOrg && <GoogleLoginButton onSuccess={handleGoogle} text="signup_with" />}
              {!isOrg && <div className="auth-divider"><span>or register with email</span></div>}

              <div className="auth-row">
                <label className="auth-label">
                  Full name
                  <input name="name" placeholder="Rahul Sharma" value={form.name} onChange={onChange} required />
                </label>
                {!isOrg ? (
                  <label className="auth-label">
                    Flat / Unit
                    <input name="flatNumber" placeholder="A-401" value={form.flatNumber} onChange={onChange} required />
                  </label>
                ) : (
                  <label className="auth-label">
                    Email address
                    <input name="email" type="email" placeholder="you@example.com" value={form.email} onChange={onChange} required />
                  </label>
                )}
              </div>

              {!isOrg && (
                <label className="auth-label">
                  Email address
                  <input name="email" type="email" placeholder="you@example.com" value={form.email} onChange={onChange} required />
                </label>
              )}

              <label className="auth-label">
                Password
                <input name="password" type="password" placeholder="Min 6 characters" value={form.password} onChange={onChange} minLength={6} required />
              </label>

              {/* Org fields */}
              <div className={`org-fields-wrap ${isOrg ? 'open' : ''}`}>
                <div className="org-fields-inner">
                  <div className="org-fields-divider"><span>Organization details</span></div>

                  <div className="auth-row">
                    <label className="auth-label">
                      Organization name
                      <input name="orgName" placeholder="Sunshine Society" value={form.orgName} onChange={onChange} required={isOrg} />
                    </label>
                    <label className="auth-label">
                      Type
                      <select name="orgType" value={form.orgType} onChange={onChange}>
                        <option value="society">Society</option>
                        <option value="college">College</option>
                        <option value="company">Company</option>
                        <option value="other">Other</option>
                      </select>
                    </label>
                  </div>

                  <div className="auth-row">
                    <label className="auth-label">
                      Phone (optional)
                      <input name="phone" placeholder="+91 98765 43210" value={form.phone} onChange={onChange} />
                    </label>
                    <label className="auth-label">
                      Address (optional)
                      <input name="orgAddress" placeholder="123 Main St" value={form.orgAddress} onChange={onChange} />
                    </label>
                  </div>
                </div>
              </div>

              <button className="btn primary full reg-cta" type="submit" disabled={loading}>
                {loading ? (
                  <span className="reg-spinner" />
                ) : (
                  <>Continue — Verify Email <span className="reg-arrow">→</span></>
                )}
              </button>

              <p className="auth-footer-text">
                Already have an account? <Link to="/login" className="link-accent">Sign in</Link>
              </p>
            </form>
          </div>

          {/* ——— STEP 2: OTP ——— */}
          <div className={`reg-step-panel ${step === 2 ? 'visible' : step > 2 ? 'hidden-left' : 'hidden-right'}`}>
            <form onSubmit={handleVerify} className="reg-form-inner reg-otp-form">
              <MailAnimation />

              <div className="auth-form-header" style={{ textAlign: 'center' }}>
                <h2>Enter verification code</h2>
                <p className="muted">Sent to <strong>{form.email}</strong></p>
              </div>

              {error && step === 2 && <p className="error-banner reg-error">{error}</p>}

              <div className="otp-input-row">
                {otp.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => (otpRefs.current[i] = el)}
                    className={`otp-box ${d ? 'filled' : ''}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => onOtpChange(i, e.target.value)}
                    onKeyDown={(e) => onOtpKeyDown(i, e)}
                    onPaste={i === 0 ? onOtpPaste : undefined}
                  />
                ))}
              </div>

              <button className="btn primary full reg-cta" type="submit" disabled={loading || otp.join('').length < 6}>
                {loading ? <span className="reg-spinner" /> : 'Verify & Create Account'}
              </button>

              <div className="otp-actions">
                <button type="button" className="link-accent" onClick={() => { setStep(1); setError(''); }}>
                  ← Back
                </button>
                <button type="button" className={`link-accent ${cooldown > 0 ? 'disabled' : ''}`} onClick={handleResend} disabled={cooldown > 0}>
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
                </button>
              </div>
            </form>
          </div>

          {/* ——— STEP 3: SUCCESS ——— */}
          <div className={`reg-step-panel ${step === 3 ? 'visible' : 'hidden-right'}`}>
            <div className="reg-form-inner reg-success-panel">
              <SuccessCheck />
              <h2>Account created!</h2>
              <p className="muted">Redirecting you to your dashboard…</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
