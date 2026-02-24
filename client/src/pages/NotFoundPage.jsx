import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="landing-wrap">
      <div className="landing-card">
        <h1>404</h1>
        <p>Page not found.</p>
        <Link className="btn primary" to="/">Go Home</Link>
      </div>
    </div>
  );
}
