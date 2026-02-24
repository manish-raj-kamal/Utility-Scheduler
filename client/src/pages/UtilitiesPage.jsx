import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUtilities } from '../services/api';

export default function UtilitiesPage() {
  const [search, setSearch] = useState('');
  const [utilities, setUtilities] = useState([]);

  useEffect(() => {
    getUtilities().then((r) => setUtilities(r.data)).catch(() => {});
  }, []);

  const filtered = utilities.filter((u) =>
    `${u.name} ${u.type}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-head split">
        <div>
          <h1>Utilities</h1>
          <p className="muted">Find and book available resources.</p>
        </div>
        <input
          className="search-input"
          placeholder="Search utility"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card-grid">
        {filtered.map((u) => (
          <article className="utility-card" key={u._id}>
            <h3>{u.name}</h3>
            <p className="muted capitalize">{u.type.replace('_', ' ')}</p>
            <p className="utility-desc">{u.description || 'No description'}</p>
            <div className="utility-meta">
              <span>₹{u.pricePerHour}/hr</span>
              <span>Day {u.maxHoursPerDay}h</span>
              <span>Week {u.maxHoursPerWeek}h</span>
            </div>
            <Link className="btn primary" to={`/calendar?utility=${u._id}`}>Book Slot</Link>
          </article>
        ))}
      </div>
    </div>
  );
}
