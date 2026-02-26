import { useEffect, useState } from 'react';
import { createUtility, deleteUtility, getUtilities, updateUtility } from '../services/api';
import W8Icon from '../components/W8Icon';
import { useWindowWidth } from '../hooks/useWindowWidth';

const typeColors = {
  parking:       { bg: '#dbeafe', color: '#2563eb',  label: 'Parking' },
  community_hall:{ bg: '#f3e8ff', color: '#7c3aed',  label: 'Community Hall' },
  generator:     { bg: '#fef3c7', color: '#d97706',  label: 'Generator' },
  ev_charger:    { bg: '#d1fae5', color: '#059669',  label: 'EV Charger' },
  water_tanker:  { bg: '#cffafe', color: '#0891b2',  label: 'Water Tanker' },
  // sports
  badminton:     { bg: '#fff7ed', color: '#ea580c',  label: 'Badminton' },
  tennis:        { bg: '#f0fdf4', color: '#15803d',  label: 'Tennis' },
  swimming:      { bg: '#eff6ff', color: '#1d4ed8',  label: 'Swimming Pool' },
  gym:           { bg: '#fff1f2', color: '#be123c',  label: 'Gym' },
  cricket:       { bg: '#fafaf9', color: '#78716c',  label: 'Cricket' },
  table_tennis:  { bg: '#fdf4ff', color: '#a21caf',  label: 'Table Tennis' },
  squash:        { bg: '#fffbeb', color: '#b45309',  label: 'Squash' },
  basketball:    { bg: '#fff7ed', color: '#c2410c',  label: 'Basketball' },
  other:         { bg: '#f1f5f9', color: '#475569',  label: 'Other' },
};

const TypeBadge = ({ type }) => {
  const t = typeColors[type] || typeColors.other;
  return (
    <span style={{ background: t.bg, color: t.color, fontSize: '0.72rem', fontWeight: 600, padding: '2px 8px', borderRadius: 20, whiteSpace: 'nowrap' }}>
      {t.label}
    </span>
  );
};

const initialForm = {
  name: '',
  type: 'parking',
  description: '',
  pricePerHour: 0,
  maxHoursPerDay: 4,
  maxHoursPerWeek: 12,
  cooldownHours: 2
};

const templates = [
  { name: 'Visitor Parking', type: 'parking', description: 'Designated parking spot for guests', pricePerHour: 20, maxHoursPerDay: 4, maxHoursPerWeek: 20, cooldownHours: 0 },
  { name: 'EV Charging Stn', type: 'ev_charger', description: 'Electric vehicle charging point', pricePerHour: 50, maxHoursPerDay: 3, maxHoursPerWeek: 10, cooldownHours: 1 },
  { name: 'Community Hall', type: 'community_hall', description: 'Large hall for events and parties', pricePerHour: 500, maxHoursPerDay: 12, maxHoursPerWeek: 24, cooldownHours: 4 },
  { name: 'Diesel Generator', type: 'generator', description: 'Backup power generator rental', pricePerHour: 200, maxHoursPerDay: 6, maxHoursPerWeek: 20, cooldownHours: 2 },
  { name: 'Badminton Court', type: 'badminton',    description: 'Indoor badminton court',              pricePerHour: 100,  maxHoursPerDay: 2,  maxHoursPerWeek: 8,  cooldownHours: 0 },
  { name: 'Tennis Court',    type: 'tennis',       description: 'Outdoor synthetic tennis court',       pricePerHour: 150,  maxHoursPerDay: 2,  maxHoursPerWeek: 6,  cooldownHours: 0 },
  { name: 'Swimming Pool',   type: 'swimming',     description: 'One hour pool access slot',            pricePerHour: 50,   maxHoursPerDay: 1,  maxHoursPerWeek: 5,  cooldownHours: 0 },
  { name: 'Table Tennis',    type: 'table_tennis', description: 'Indoor TT table',                      pricePerHour: 0,    maxHoursPerDay: 2,  maxHoursPerWeek: 8,  cooldownHours: 0 },
  { name: 'Cricket Net',     type: 'cricket',      description: 'Practice net for cricket',             pricePerHour: 50,   maxHoursPerDay: 2,  maxHoursPerWeek: 6,  cooldownHours: 0 },
  { name: 'Gym Slot',        type: 'gym',          description: 'Scheduled gym access',                 pricePerHour: 0,    maxHoursPerDay: 2,  maxHoursPerWeek: 10, cooldownHours: 0 },
  { name: 'Squash Court',    type: 'squash',       description: 'Indoor squash court booking',          pricePerHour: 120,  maxHoursPerDay: 2,  maxHoursPerWeek: 6,  cooldownHours: 0 },
  { name: 'Basketball Court',type: 'basketball',   description: 'Full-size basketball court',           pricePerHour: 200,  maxHoursPerDay: 3,  maxHoursPerWeek: 9,  cooldownHours: 0 },
  { name: 'Conference Room', type: 'other',        description: 'Meeting room with projector',          pricePerHour: 300,  maxHoursPerDay: 4,  maxHoursPerWeek: 12, cooldownHours: 1 },
  { name: 'Guest Room 101',  type: 'other',        description: 'Furnished guest accommodation',        pricePerHour: 1000, maxHoursPerDay: 24, maxHoursPerWeek: 72, cooldownHours: 4 },
  { name: 'BBQ Area',        type: 'other',        description: 'Outdoor grilling station',             pricePerHour: 100,  maxHoursPerDay: 3,  maxHoursPerWeek: 6,  cooldownHours: 1 },
  { name: 'Service Lift',    type: 'other',        description: 'Exclusive service elevator booking',   pricePerHour: 0,    maxHoursPerDay: 2,  maxHoursPerWeek: 4,  cooldownHours: 0 },
  { name: 'Water Tanker',    type: 'water_tanker', description: 'Emergency water supply',               pricePerHour: 800,  maxHoursPerDay: 1,  maxHoursPerWeek: 2,  cooldownHours: 24 },
  { name: 'Club House',      type: 'community_hall',description: 'Recreational area access',            pricePerHour: 250,  maxHoursPerDay: 5,  maxHoursPerWeek: 15, cooldownHours: 1 },
];

export default function AdminUtilities() {
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState('');
  const [form, setForm] = useState(initialForm);
  const [showTemplates, setShowTemplates] = useState(false);
  const isMobile = useWindowWidth() < 640;

  const fetchItems = () => getUtilities().then((r) => setItems(r.data)).catch(() => {});
  useEffect(() => { fetchItems(); }, []);

  const onChange = (e) => {
    const value = e.target.type === 'number' ? Number.parseFloat(e.target.value) : e.target.value;
    setForm((prev) => ({ ...prev, [e.target.name]: value }));
  };

  const applyTemplate = (t) => {
    setForm({ ...initialForm, ...t });
    setShowTemplates(false);
  };

  const reset = () => {
    setEditingId('');
    setForm(initialForm);
    setShowTemplates(false);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (editingId) await updateUtility(editingId, form);
    else await createUtility(form);
    reset();
    fetchItems();
  };

  const onEdit = (u) => {
    setEditingId(u._id);
    setForm({
      name: u.name,
      type: u.type,
      description: u.description || '',
      pricePerHour: u.pricePerHour,
      maxHoursPerDay: u.maxHoursPerDay,
      maxHoursPerWeek: u.maxHoursPerWeek,
      cooldownHours: u.cooldownHours
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div className="page-head" style={{ marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Manage Utilities</h1>
          <p className="muted" style={{ marginTop: 4 }}>Configure the resources available for booking in your organization.</p>
        </div>
      </div>

      <div className="panel" style={{ padding: 0, marginBottom: 24, overflow: 'hidden' }}>
        <div style={{ background: editingId ? 'linear-gradient(135deg,#fef3c7,#fffbeb)' : 'linear-gradient(135deg,#eef2ff,#f0f9ff)', padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>{editingId ? '✏️' : '➕'}</span>
            <h3 style={{ margin: 0, fontWeight: 700, color: '#1e293b', fontSize: '1.05rem' }}>{editingId ? 'Edit Utility' : 'Create New Utility'}</h3>
          </div>
          {!editingId && (
            <button 
              className={`btn ${showTemplates ? 'primary' : 'ghost'}`} 
              type="button" 
              onClick={() => setShowTemplates(!showTemplates)}
              style={{ fontSize: '0.85rem' }}
            >
              <span style={{ fontSize: 18, lineHeight: 0, marginRight: 6 }}>+</span>
              {showTemplates ? 'Hide Templates' : 'Use Template'}
            </button>
          )}
        </div>
        <div style={{ padding: 24 }}>

        {showTemplates && !editingId && (
          <div className="template-grid" style={{ 
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, marginBottom: 24,
            background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' 
          }}>
            {templates.map((t) => (
              <button 
                key={t.name} 
                type="button" 
                onClick={() => applyTemplate(t)}
                className="template-card"
                style={{ 
                  textAlign: 'left', padding: '10px 12px', background: '#fff', border: '1px solid #e2e8f0', 
                  borderRadius: 6, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: 4
                }}
              >
                <strong style={{ fontSize: '0.9rem', color: '#1e293b' }}>{t.name}</strong>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {t.pricePerHour > 0 ? `₹${t.pricePerHour}/hr` : 'Free'} · {(typeColors[t.type] || typeColors.other).label}
                </span>
              </button>
            ))}
          </div>
        )}

        <form onSubmit={onSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20, marginBottom: 20, marginTop: 4 }}>
            <label className="auth-label">
              Name
              <input name="name" value={form.name} onChange={onChange} required placeholder="e.g. Visitor Parking A" />
            </label>
            <label className="auth-label">
              Type
              <select name="type" value={form.type} onChange={onChange}>
                <optgroup label="⚙️ Infrastructure">
                  <option value="parking">Parking Spot</option>
                  <option value="community_hall">Community Hall</option>
                  <option value="generator">Generator</option>
                  <option value="ev_charger">EV Charger</option>
                  <option value="water_tanker">Water Tanker</option>
                </optgroup>
                <optgroup label="🏅 Sports &amp; Fitness">
                  <option value="badminton">Badminton Court</option>
                  <option value="tennis">Tennis Court</option>
                  <option value="swimming">Swimming Pool</option>
                  <option value="gym">Gym</option>
                  <option value="cricket">Cricket Net</option>
                  <option value="table_tennis">Table Tennis</option>
                  <option value="squash">Squash Court</option>
                  <option value="basketball">Basketball Court</option>
                </optgroup>
                <optgroup label="📦 Other">
                  <option value="other">Other</option>
                </optgroup>
              </select>
            </label>
          </div>
          
          <label className="auth-label" style={{ marginBottom: 20, display: 'block' }}>
            Description
            <input name="description" value={form.description} onChange={onChange} placeholder="Brief description of the utility..." />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            <label className="auth-label">
              Price / Hour (₹)
              <input type="number" name="pricePerHour" value={form.pricePerHour} onChange={onChange} min={0} />
            </label>
            <label className="auth-label">
              Max Hours / Day
              <input type="number" name="maxHoursPerDay" value={form.maxHoursPerDay} onChange={onChange} min={1} />
            </label>
            <label className="auth-label">
              Max Hours / Week
              <input type="number" name="maxHoursPerWeek" value={form.maxHoursPerWeek} onChange={onChange} min={1} />
            </label>
            <label className="auth-label">
              Cooldown (Hours)
              <input type="number" name="cooldownHours" value={form.cooldownHours} onChange={onChange} min={0} />
            </label>
          </div>

          <div className="actions-inline" style={{ justifyContent: 'flex-end', gap: 12 }}>
            {editingId && <button className="btn ghost" type="button" onClick={reset}>Cancel Edit</button>}
            <button className="btn primary" type="submit" style={{ minWidth: 120 }}>
              {editingId ? 'Update Utility' : 'Create Utility'}
            </button>
          </div>
        </form>
        </div>
      </div>

      {isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.length === 0 ? (
            <p className="muted center">No utilities yet. Create one above.</p>
          ) : items.map((u, idx) => {
            const tc = typeColors[u.type] || typeColors.other;
            return (
            <div key={u._id} className="panel" style={{ padding: 0, overflow: 'hidden', borderLeft: `3px solid ${tc.color}` }}>
              <div style={{ padding: '12px 16px', background: idx % 2 === 0 ? '#fff' : '#f8faff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <strong style={{ color: '#1e293b', fontSize: '0.95rem' }}>{u.name}</strong>
                  {u.pricePerHour > 0
                    ? <span style={{ background: '#dbeafe', color: '#2563eb', fontWeight: 700, fontSize: '0.82rem', padding: '2px 9px', borderRadius: 20 }}>₹{u.pricePerHour}/hr</span>
                    : <span style={{ background: '#d1fae5', color: '#059669', fontWeight: 700, fontSize: '0.82rem', padding: '2px 9px', borderRadius: 20 }}>Free</span>
                  }
                </div>
                <div style={{ marginBottom: 8 }}><TypeBadge type={u.type} /></div>
                <div style={{ display: 'flex', gap: 12, fontSize: '0.82rem', color: '#64748b', marginBottom: 12 }}>
                  <span>Limits: <strong style={{ color: '#334155' }}>{u.maxHoursPerDay}h/day · {u.maxHoursPerWeek}h/wk</strong></span>
                  {u.cooldownHours > 0 && <span>Cooldown: <strong style={{ color: '#d97706' }}>{u.cooldownHours}h</strong></span>}
                </div>
                <div style={{ display: 'flex', gap: 8, paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
                  <button style={{ padding: '5px 14px', fontSize: '0.82rem', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }} onClick={() => onEdit(u)}>Edit</button>
                  <button style={{ padding: '5px 14px', fontSize: '0.82rem', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }} onClick={async () => { if(confirm('Delete this utility?')) { await deleteUtility(u._id); fetchItems(); }}}>Delete</button>
                </div>
              </div>
            </div>
          );})}
        </div>
      ) : (
      <div className="panel table-scroll" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', background: 'linear-gradient(135deg,#f8fafc,#f0f9ff)', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>🗂️</span>
          <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>All Utilities</span>
          <span style={{ marginLeft: 'auto', background: '#e2e8f0', color: '#64748b', fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: 20 }}>{items.length} total</span>
        </div>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
            <tr>
              <th style={{ padding: '10px 16px', textAlign: 'left', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.06em' }}>NAME / TYPE</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.06em' }}>PRICING</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.06em' }}>LIMITS</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.06em' }}>COOLDOWN</th>
              <th style={{ padding: '10px 16px', textAlign: 'right', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.06em' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>No utilities found. Create one above ↑</td></tr>
            ) : items.map((u, idx) => {
              const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8faff';
              const tc = typeColors[u.type] || typeColors.other;
              return (
              <tr key={u._id} style={{ background: rowBg, borderBottom: '1px solid #f1f5f9', borderLeft: `3px solid ${tc.color}` }}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.92rem' }}>{u.name}</div>
                  <div style={{ marginTop: 4 }}><TypeBadge type={u.type} /></div>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {u.pricePerHour > 0
                    ? <span style={{ background: '#dbeafe', color: '#2563eb', fontWeight: 700, fontSize: '0.85rem', padding: '3px 10px', borderRadius: 20 }}>₹{u.pricePerHour}/hr</span>
                    : <span style={{ background: '#d1fae5', color: '#059669', fontWeight: 700, fontSize: '0.85rem', padding: '3px 10px', borderRadius: 20 }}>Free</span>
                  }
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.88rem', color: '#334155', background: '#f1f5f9', padding: '2px 8px', borderRadius: 6 }}>{u.maxHoursPerDay}h</span>
                  <span style={{ color: '#94a3b8', margin: '0 4px', fontSize: '0.8rem' }}>/day</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.88rem', color: '#334155', background: '#f1f5f9', padding: '2px 8px', borderRadius: 6 }}>{u.maxHoursPerWeek}h</span>
                  <span style={{ color: '#94a3b8', marginLeft: 4, fontSize: '0.8rem' }}>/wk</span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {u.cooldownHours > 0
                    ? <span style={{ background: '#fef3c7', color: '#d97706', fontWeight: 600, fontSize: '0.82rem', padding: '2px 8px', borderRadius: 20 }}>{u.cooldownHours}h</span>
                    : <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>—</span>
                  }
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <button style={{ padding: '5px 12px', fontSize: '0.8rem', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }} onClick={() => onEdit(u)}>Edit</button>
                    <button style={{ padding: '5px 12px', fontSize: '0.8rem', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }} onClick={async () => { if(confirm('Delete this utility?')) { await deleteUtility(u._id); fetchItems(); }}}>Delete</button>
                  </div>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
}
