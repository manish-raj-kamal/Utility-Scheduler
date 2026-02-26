import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUtilities } from '../services/api';
import W8Icon from '../components/W8Icon';

const iconByType = {
  parking: 'flat',
  community_hall: 'organizations',
  generator: 'utilities',
  ev_charger: 'utilities',
  water_tanker: 'utilities',
  badminton: 'bookings',
  tennis: 'bookings',
  swimming: 'utilities',
  gym: 'users',
  cricket: 'bookings',
  table_tennis: 'bookings',
  squash: 'bookings',
  basketball: 'bookings',
  other: 'utilities'
};

const colorByType = {
  parking: '#4b7cf4',
  community_hall: '#5f62f1',
  generator: '#f0893f',
  ev_charger: '#16a07c',
  water_tanker: '#00a3c4',
  badminton: '#e86f6f',
  tennis: '#0da68f',
  swimming: '#1a88e1',
  gym: '#cf6ddb',
  cricket: '#f06565',
  table_tennis: '#5f7cff',
  squash: '#ff8d37',
  basketball: '#f59b23',
  other: '#4f73d8'
};

const formatType = (value = '') =>
  value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

export default function UtilitiesPage() {
  const [search, setSearch] = useState('');
  const [utilities, setUtilities] = useState([]);

  useEffect(() => {
    getUtilities().then((r) => setUtilities(r.data)).catch(() => {});
  }, []);

  const filtered = useMemo(
    () =>
      utilities.filter((u) =>
        `${u.name} ${u.type}`.toLowerCase().includes(search.toLowerCase())
      ),
    [utilities, search]
  );

  const avgPrice = useMemo(() => {
    if (!utilities.length) return 0;
    const total = utilities.reduce((sum, item) => sum + (Number(item.pricePerHour) || 0), 0);
    return Math.round(total / utilities.length);
  }, [utilities]);

  const uniqueTypes = useMemo(
    () => new Set(utilities.map((item) => item.type)).size,
    [utilities]
  );

  return (
    <div className="luxe-page utilities-luxe">
      <div className="luxe-ambient" aria-hidden="true">
        <span className="luxe-orb orb-one" />
        <span className="luxe-orb orb-two" />
        <span className="luxe-orb orb-three" />
        <span className="luxe-grid" />
      </div>

      <section className="luxe-hero glass-panel">
        <div className="luxe-hero-copy">
          <p className="luxe-eyebrow">Discover Resources</p>
          <h1>Utilities</h1>
          <p className="muted">Choose from available facilities and book in seconds.</p>
        </div>
        <div className="luxe-hero-actions">
          <input
            className="search-input luxe-search"
            placeholder="Search utility"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </section>

      <section className="luxe-stat-row">
        <article className="luxe-stat-tile">
          <span>Available Utilities</span>
          <strong>{utilities.length}</strong>
        </article>
        <article className="luxe-stat-tile">
          <span>Utility Types</span>
          <strong>{uniqueTypes}</strong>
        </article>
        <article className="luxe-stat-tile">
          <span>Avg. Price</span>
          <strong>₹{avgPrice.toLocaleString('en-IN')}/hr</strong>
        </article>
        <article className="luxe-stat-tile">
          <span>Matched Results</span>
          <strong>{filtered.length}</strong>
        </article>
      </section>

      <section className="utility-showcase-grid">
        {filtered.length === 0 && (
          <div className="utility-empty glass-panel">
            <h3>No utilities match your search.</h3>
            <p>Try a different keyword or clear the search filter.</p>
          </div>
        )}

        {filtered.map((u) => {
          const accent = colorByType[u.type] || colorByType.other;
          return (
            <article className="utility-showcase-card glass-panel" key={u._id} style={{ '--util-accent': accent }}>
              <div className="utility-card-top">
                <div className="utility-icon-shell">
                  <W8Icon name={iconByType[u.type] || 'utilities'} size={30} alt={u.type} />
                </div>
                <span className="utility-type-pill">{formatType(u.type)}</span>
              </div>

              <div className="utility-card-copy">
                <h3>{u.name}</h3>
                <p>{u.description || 'No description available for this utility yet.'}</p>
              </div>

              <div className="utility-card-meta">
                <span>₹{u.pricePerHour}/hr</span>
                <span>Day limit {u.maxHoursPerDay}h</span>
                <span>Week limit {u.maxHoursPerWeek}h</span>
              </div>

              <Link className="btn primary utility-card-action" to={`/calendar?utility=${u._id}`}>
                Book Slot
              </Link>
            </article>
          );
        })}
      </section>
    </div>
  );
}
