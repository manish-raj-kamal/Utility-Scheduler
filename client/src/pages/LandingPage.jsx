import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

const featureCards = [
  {
    title: 'Smart Slot Intelligence',
    desc: 'A guided calendar flow that helps residents request the right utility slot in seconds.'
  },
  {
    title: 'Fairness Engine',
    desc: 'Dynamic scoring reduces slot hoarding and keeps allocation transparent across the community.'
  },
  {
    title: 'Auto Waitlist Promotion',
    desc: 'Waitlisted users are promoted automatically when matching slots become available.'
  },
  {
    title: 'Payment Ready Bookings',
    desc: 'Collect payments only when needed with clean booking-to-payment continuity.'
  },
  {
    title: 'Role Based Operations',
    desc: 'Separate experiences for members, org admins, and superadmins with secure boundaries.'
  },
  {
    title: 'Audit and Traceability',
    desc: 'Every sensitive action can be traced with actor, time, request path, and security metadata.'
  }
];

const platformStats = [
  { value: '24x7', label: 'Booking Visibility' },
  { value: '8+', label: 'Utility Categories' },
  { value: '< 30s', label: 'Average Booking Flow' },
  { value: '100%', label: 'Traceable Admin Actions' }
];

const workflow = [
  {
    step: '01',
    title: 'Explore Utility Board',
    desc: 'Search utility inventory and compare pricing, limits, and availability quickly.'
  },
  {
    step: '02',
    title: 'Request a Time Slot',
    desc: 'Select date and time range, then submit the booking request with context-aware checks.'
  },
  {
    step: '03',
    title: 'Get Decision Instantly',
    desc: 'Receive an immediate status: approved or waitlist based on fairness and existing conflicts.'
  },
  {
    step: '04',
    title: 'Track and Manage',
    desc: 'Monitor bookings, payments, and notifications from a single dashboard.'
  }
];

const personas = [
  {
    title: 'Residents',
    points: ['Book shared resources quickly', 'Get instant status and reminders', 'Track spend and usage']
  },
  {
    title: 'Organization Admins',
    points: ['Manage utilities and users', 'Override conflicts responsibly', 'See live operational signals']
  },
  {
    title: 'Superadmins',
    points: ['Control organization verification', 'View cross-org analytics', 'Inspect deep audit trails']
  }
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
    <div className="prime-landing">
      <div className="prime-landing-bg" aria-hidden="true">
        <span className="pl-orb orb-a" />
        <span className="pl-orb orb-b" />
        <span className="pl-orb orb-c" />
        <span className="pl-ring ring-a" />
        <span className="pl-ring ring-b" />
        <span className="pl-grid" />
      </div>

      <nav className="pl-nav">
        <div className="pl-brand">
          <Logo size={30} />
          <div className="pl-brand-copy">
            <strong>FairSlot</strong>
            <span>Utility intelligence platform</span>
          </div>
        </div>

        <div className="pl-nav-center">
          <a href="#features" className="pl-nav-link">Features</a>
          <a href="#workflow" className="pl-nav-link">Workflow</a>
          <a href="#trust" className="pl-nav-link">Trust</a>
        </div>

        <div className="pl-nav-actions">
          {user ? (
            <Link to={dashboardPath} className="btn primary">Dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="pl-login-link">Log in</Link>
              <Link to="/register" className="btn primary">Start Free</Link>
            </>
          )}
        </div>
      </nav>

      <header className="pl-hero">
        <div className="pl-hero-left">
          <span className="pl-kicker">Built for modern communities and managed organizations</span>
          <h1>
            Shared utility booking
            <br />
            <span>designed like a control system.</span>
          </h1>
          <p>
            FairSlot brings scheduling, fairness, payments, and audit visibility together in one
            streamlined platform so residents and admins always operate with clarity.
          </p>

          <div className="pl-hero-actions">
            {user ? (
              <Link to={dashboardPath} className="btn primary lg">Open Workspace</Link>
            ) : (
              <>
                <Link to="/register" className="btn primary lg">Create Account</Link>
                <Link to="/login" className="btn ghost lg">Sign In</Link>
              </>
            )}
          </div>
        </div>

        <div className="pl-hero-right">
          <article className="pl-live-card">
            <div className="pl-live-head">
              <strong>Live Operations Snapshot</strong>
              <span>Realtime</span>
            </div>

            <div className="pl-live-list">
              <div className="pl-live-row">
                <span>Parking Zone A</span>
                <em className="ok">Approved</em>
              </div>
              <div className="pl-live-row">
                <span>Community Hall</span>
                <em className="wait">Waitlist</em>
              </div>
              <div className="pl-live-row">
                <span>EV Charger 02</span>
                <em className="ok">Approved</em>
              </div>
              <div className="pl-live-row">
                <span>Audit Stream</span>
                <em className="info">Tracked</em>
              </div>
            </div>

            <div className="pl-live-metrics">
              <div>
                <span>Conflict Reduction</span>
                <strong>92%</strong>
              </div>
              <div>
                <span>Waitlist Automation</span>
                <strong>100%</strong>
              </div>
            </div>
          </article>
        </div>
      </header>

      <section className="pl-stats-strip">
        {platformStats.map((item) => (
          <article key={item.label}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </article>
        ))}
      </section>

      <section id="features" className="pl-section">
        <div className="pl-section-head">
          <p>Core Capabilities</p>
          <h2>Everything needed to run shared utilities at scale</h2>
        </div>
        <div className="pl-feature-grid">
          {featureCards.map((card) => (
            <article className="pl-feature-card" key={card.title}>
              <h3>{card.title}</h3>
              <p>{card.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="workflow" className="pl-section workflow">
        <div className="pl-section-head">
          <p>How It Works</p>
          <h2>From discovery to booking in four clear steps</h2>
        </div>
        <div className="pl-workflow-grid">
          {workflow.map((item) => (
            <article className="pl-workflow-card" key={item.step}>
              <span>{item.step}</span>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="pl-section personas">
        <div className="pl-section-head">
          <p>Purpose Built</p>
          <h2>Useful for every role in the ecosystem</h2>
        </div>
        <div className="pl-persona-grid">
          {personas.map((persona) => (
            <article className="pl-persona-card" key={persona.title}>
              <h3>{persona.title}</h3>
              <ul>
                {persona.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section id="trust" className="pl-trust-band">
        <div>
          <h2>Security and accountability by default</h2>
          <p>Audit events include actor context, request metadata, and event details for complete operational visibility.</p>
        </div>
        <div className="pl-trust-chip-list">
          <span>Role-aware access</span>
          <span>Action-level auditing</span>
          <span>Request traceability</span>
          <span>Verification workflows</span>
        </div>
      </section>

      <section className="pl-final-cta">
        <h2>Ready to modernize utility operations?</h2>
        <p>Launch FairSlot for your community and move from manual coordination to intelligent scheduling.</p>
        {user ? (
          <Link to={dashboardPath} className="btn primary lg">Go to Dashboard</Link>
        ) : (
          <Link to="/register" className="btn primary lg">Get Started for Free</Link>
        )}
      </section>

      <footer className="pl-footer">
        <span>© {new Date().getFullYear()} FairSlot</span>
        <span>Smart booking for shared spaces</span>
      </footer>
    </div>
  );
}
