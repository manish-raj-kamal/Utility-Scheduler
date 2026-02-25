import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const features = [
  {
    icon: '📅',
    title: 'Smart Scheduling',
    desc: 'Book parking, halls, generators, EV chargers and water tankers with an intuitive calendar.'
  },
  {
    icon: '⚖️',
    title: 'Fair Access',
    desc: 'Built-in fairness engine prevents slot hoarding so every resident gets equal access.'
  },
  {
    icon: '📋',
    title: 'Auto Waitlist',
    desc: 'Join waitlists and get promoted automatically when slots free up — no manual follow-ups.'
  },
  {
    icon: '🔒',
    title: 'Admin Controls',
    desc: 'Role-based dashboards, real-time analytics, and complete audit logs for full transparency.'
  }
];

const stats = [
  { value: '5+', label: 'Utility Types' },
  { value: '24/7', label: 'Availability' },
  { value: '100%', label: 'Transparent' }
];

export default function LandingPage() {
  const { user } = useAuth();
  const dashboardPath = !user
    ? '/login'
    : user.role === 'superadmin'
      ? '/admin/organizations'
      : user.role === 'org_admin'
        ? '/admin'
        : user.organizationId
          ? '/dashboard'
          : '/verification';

  return (
    <div className="landing-page">
      {/* Navbar */}
      <nav className="landing-nav">
        <span className="landing-brand">⚡ UtilityScheduler</span>
        <div className="landing-nav-links">
          {user ? (
            <Link to={dashboardPath} className="btn primary">Dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="landing-login-link">Log in</Link>
              <Link to="/register" className="btn primary">Get Started</Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero-content">
          <span className="landing-badge">Community Utility Management</span>
          <h1 className="landing-title">
            Schedule shared utilities<br />
            <span className="text-gradient">without the hassle.</span>
          </h1>
          <p className="landing-subtitle">
            A modern platform for residential communities to book, manage and
            track shared amenities — fair, transparent and effortless.
          </p>
          <div className="landing-actions">
            {user ? (
              <Link to={dashboardPath} className="btn primary lg">Open Dashboard →</Link>
            ) : (
              <>
                <Link to="/register" className="btn primary lg">Create Free Account</Link>
                <Link to="/login" className="btn ghost lg">Sign In →</Link>
              </>
            )}
          </div>
        </div>

        <div className="landing-hero-visual">
          <div className="hero-mockup">
            <div className="mockup-bar">
              <span className="dot red" /><span className="dot yellow" /><span className="dot green" />
            </div>
            <div className="mockup-body">
              <div className="mockup-row"><span className="mockup-label" /><span className="mockup-pill ok">Approved</span></div>
              <div className="mockup-row"><span className="mockup-label" /><span className="mockup-pill wait">Waitlist</span></div>
              <div className="mockup-row"><span className="mockup-label" /><span className="mockup-pill ok">Approved</span></div>
              <div className="mockup-row"><span className="mockup-label wide" /><span className="mockup-pill pend">Pending</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="landing-stats">
        {stats.map((s) => (
          <div key={s.label} className="landing-stat-item">
            <strong>{s.value}</strong>
            <span>{s.label}</span>
          </div>
        ))}
      </section>

      {/* Features */}
      <section className="landing-features">
        <h2 className="section-title">Everything you need to manage shared resources</h2>
        <div className="features-grid">
          {features.map((f) => (
            <article key={f.title} className="feature-card">
              <span className="feature-icon">{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="landing-cta">
        <h2>Ready to simplify utility management?</h2>
        <p>Join your community on UtilityScheduler today — it's free.</p>
        <div className="landing-actions">
          {user ? (
            <Link to={dashboardPath} className="btn primary lg">Go to Dashboard</Link>
          ) : (
            <Link to="/register" className="btn primary lg">Get Started — Free</Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <span>© {new Date().getFullYear()} UtilityScheduler</span>
        <span className="muted">Built for modern communities</span>
      </footer>
    </div>
  );
}
