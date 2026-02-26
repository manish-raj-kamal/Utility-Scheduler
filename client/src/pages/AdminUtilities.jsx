import { useEffect, useMemo, useState } from 'react';
import { createUtility, deleteUtility, getUtilities, updateUtility } from '../services/api';
import W8Icon from '../components/W8Icon';

const typeOptions = [
  ['parking', 'Parking'],
  ['community_hall', 'Community Hall'],
  ['generator', 'Generator'],
  ['ev_charger', 'EV Charger'],
  ['water_tanker', 'Water Tanker'],
  ['badminton', 'Badminton'],
  ['tennis', 'Tennis'],
  ['swimming', 'Swimming'],
  ['gym', 'Gym'],
  ['cricket', 'Cricket'],
  ['table_tennis', 'Table Tennis'],
  ['squash', 'Squash'],
  ['basketball', 'Basketball'],
  ['other', 'Other']
];

const typeIcon = {
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

const templates = [
  { name: 'Visitor Parking', type: 'parking', description: 'Designated parking for visitors', pricePerHour: 20, maxHoursPerDay: 4, maxHoursPerWeek: 18, cooldownHours: 1 },
  { name: 'Community Hall', type: 'community_hall', description: 'Large hall for events', pricePerHour: 500, maxHoursPerDay: 8, maxHoursPerWeek: 24, cooldownHours: 3 },
  { name: 'EV Charger', type: 'ev_charger', description: 'Fast charging point', pricePerHour: 50, maxHoursPerDay: 3, maxHoursPerWeek: 12, cooldownHours: 1 },
  { name: 'Swimming Pool Slot', type: 'swimming', description: 'One-hour pool access', pricePerHour: 80, maxHoursPerDay: 2, maxHoursPerWeek: 6, cooldownHours: 0 }
];

const initialForm = {
  name: '',
  type: 'parking',
  description: '',
  pricePerHour: 0,
  maxHoursPerDay: 4,
  maxHoursPerWeek: 12,
  cooldownHours: 2
};

const formatType = (value = '') =>
  String(value).replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

export default function AdminUtilities() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [form, setForm] = useState(initialForm);
  const [showTemplates, setShowTemplates] = useState(false);
  const [search, setSearch] = useState('');

  const fetchItems = () => {
    setLoading(true);
    getUtilities()
      .then((r) => setItems(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const resetForm = () => {
    setEditingId('');
    setShowTemplates(false);
    setForm(initialForm);
  };

  const onChange = (event) => {
    const { name, value, type } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
  };

  const applyTemplate = (template) => {
    setForm({
      ...initialForm,
      ...template
    });
    setShowTemplates(false);
  };

  const onEdit = (utility) => {
    setEditingId(utility._id);
    setForm({
      name: utility.name,
      type: utility.type,
      description: utility.description || '',
      pricePerHour: utility.pricePerHour,
      maxHoursPerDay: utility.maxHoursPerDay,
      maxHoursPerWeek: utility.maxHoursPerWeek,
      cooldownHours: utility.cooldownHours
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onDelete = async (id) => {
    if (!window.confirm('Delete this utility?')) return;
    await deleteUtility(id);
    fetchItems();
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await updateUtility(editingId, form);
      } else {
        await createUtility(form);
      }
      resetForm();
      fetchItems();
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => !query || `${item.name} ${item.type}`.toLowerCase().includes(query));
  }, [items, search]);

  const stats = useMemo(
    () => ({
      total: items.length,
      paid: items.filter((item) => Number(item.pricePerHour) > 0).length,
      free: items.filter((item) => Number(item.pricePerHour) <= 0).length,
      avgDailyLimit: items.length
        ? Math.round(items.reduce((sum, item) => sum + Number(item.maxHoursPerDay || 0), 0) / items.length)
        : 0
    }),
    [items]
  );

  return (
    <div className="luxe-page admin-ops-page utilities-admin-page">
      <div className="luxe-ambient" aria-hidden="true">
        <span className="luxe-orb orb-one" />
        <span className="luxe-orb orb-two" />
        <span className="luxe-orb orb-three" />
        <span className="luxe-grid" />
      </div>

      <section className="luxe-hero glass-panel">
        <div className="luxe-hero-copy">
          <p className="luxe-eyebrow">Resource Control</p>
          <h1>Manage Utilities</h1>
          <p className="muted">Create and tune resource limits for your organization.</p>
        </div>
        <div className="luxe-hero-actions admin-ops-filters">
          <input
            className="search-input luxe-search"
            placeholder="Search utilities"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {!editingId && (
            <button className={`btn ${showTemplates ? 'primary' : 'ghost'}`} type="button" onClick={() => setShowTemplates((prev) => !prev)}>
              {showTemplates ? 'Hide templates' : 'Use template'}
            </button>
          )}
        </div>
      </section>

      <section className="luxe-stat-row admin-ops-stat-row">
        <article className="luxe-stat-tile">
          <span>Total Utilities</span>
          <strong>{stats.total}</strong>
        </article>
        <article className="luxe-stat-tile">
          <span>Paid Utilities</span>
          <strong>{stats.paid}</strong>
        </article>
        <article className="luxe-stat-tile">
          <span>Free Utilities</span>
          <strong>{stats.free}</strong>
        </article>
        <article className="luxe-stat-tile">
          <span>Avg Daily Limit</span>
          <strong>{stats.avgDailyLimit}h</strong>
        </article>
      </section>

      {showTemplates && !editingId && (
        <section className="admin-template-grid glass-panel">
          {templates.map((template) => (
            <button key={template.name} type="button" className="admin-template-card" onClick={() => applyTemplate(template)}>
              <strong>{template.name}</strong>
              <span>{formatType(template.type)}</span>
            </button>
          ))}
        </section>
      )}

      <section className="admin-ops-board glass-panel">
        <div className="admin-ops-board-head">
          <h3>{editingId ? 'Edit Utility' : 'Create Utility'}</h3>
        </div>

        <form className="admin-utility-form" onSubmit={onSubmit}>
          <label>Name
            <input name="name" value={form.name} onChange={onChange} placeholder="Utility name" required />
          </label>

          <label>Type
            <select name="type" value={form.type} onChange={onChange}>
              {typeOptions.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>

          <label className="full">Description
            <input name="description" value={form.description} onChange={onChange} placeholder="Short description" />
          </label>

          <label>Price / Hour
            <input type="number" name="pricePerHour" value={form.pricePerHour} onChange={onChange} min={0} />
          </label>
          <label>Max Hours / Day
            <input type="number" name="maxHoursPerDay" value={form.maxHoursPerDay} onChange={onChange} min={1} />
          </label>
          <label>Max Hours / Week
            <input type="number" name="maxHoursPerWeek" value={form.maxHoursPerWeek} onChange={onChange} min={1} />
          </label>
          <label>Cooldown Hours
            <input type="number" name="cooldownHours" value={form.cooldownHours} onChange={onChange} min={0} />
          </label>

          <div className="admin-entity-actions full">
            {editingId && <button className="btn ghost" type="button" onClick={resetForm}>Cancel</button>}
            <button className="btn primary" type="submit" disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Update Utility' : 'Create Utility'}
            </button>
          </div>
        </form>
      </section>

      <section className="admin-ops-board glass-panel">
        <div className="admin-ops-board-head">
          <h3>All Utilities ({filtered.length})</h3>
        </div>

        {loading ? (
          <p className="muted center">Loading utilities...</p>
        ) : filtered.length === 0 ? (
          <p className="muted center">No utilities found.</p>
        ) : (
          <div className="admin-entity-grid">
            {filtered.map((utility) => (
              <article className="admin-entity-card" key={utility._id}>
                <div className="admin-entity-head">
                  <strong>{utility.name}</strong>
                  <span className="pill">{formatType(utility.type)}</span>
                </div>

                <div className="admin-entity-meta compact">
                  <span><W8Icon name={typeIcon[utility.type] || 'utilities'} size={18} alt={utility.type} /> ₹{utility.pricePerHour}/hr</span>
                  <span>Day {utility.maxHoursPerDay}h · Week {utility.maxHoursPerWeek}h</span>
                  <span>Cooldown {utility.cooldownHours}h</span>
                </div>

                <p className="admin-entity-sub">{utility.description || 'No description available.'}</p>

                <div className="admin-entity-actions">
                  <button className="btn ghost" onClick={() => onEdit(utility)}>Edit</button>
                  <button className="btn danger" onClick={() => onDelete(utility._id)}>Delete</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
