import { useEffect, useState } from 'react';
import { createUtility, deleteUtility, getUtilities, updateUtility } from '../services/api';
import W8Icon from '../components/W8Icon';

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
  { name: 'Badminton Court', type: 'other', description: 'Indoor badminton court', pricePerHour: 100, maxHoursPerDay: 2, maxHoursPerWeek: 8, cooldownHours: 0 },
  { name: 'Tennis Court', type: 'other', description: 'Outdoor synthetic tennis court', pricePerHour: 150, maxHoursPerDay: 2, maxHoursPerWeek: 6, cooldownHours: 0 },
  { name: 'Swimming Pool', type: 'other', description: 'One hour pool access slot', pricePerHour: 50, maxHoursPerDay: 1, maxHoursPerWeek: 5, cooldownHours: 0 },
  { name: 'Conference Room', type: 'other', description: 'Meeting room with projector', pricePerHour: 300, maxHoursPerDay: 4, maxHoursPerWeek: 12, cooldownHours: 1 },
  { name: 'Guest Room 101', type: 'other', description: 'Furnished guest accommodation', pricePerHour: 1000, maxHoursPerDay: 24, maxHoursPerWeek: 72, cooldownHours: 4 },
  { name: 'Gym Slot', type: 'other', description: 'Scheduled gym access', pricePerHour: 0, maxHoursPerDay: 2, maxHoursPerWeek: 10, cooldownHours: 0 },
  { name: 'BBQ Area', type: 'other', description: 'Outdoor grilling station', pricePerHour: 100, maxHoursPerDay: 3, maxHoursPerWeek: 6, cooldownHours: 1 },
  { name: 'Service Lift', type: 'other', description: 'Exclusive service elevator booking', pricePerHour: 0, maxHoursPerDay: 2, maxHoursPerWeek: 4, cooldownHours: 0 },
  { name: 'Water Tanker', type: 'water_tanker', description: 'Emergency water supply', pricePerHour: 800, maxHoursPerDay: 1, maxHoursPerWeek: 2, cooldownHours: 24 },
  { name: 'Club House', type: 'community_hall', description: 'Recreational area access', pricePerHour: 250, maxHoursPerDay: 5, maxHoursPerWeek: 15, cooldownHours: 1 },
  { name: 'Table Tennis', type: 'other', description: 'Indoor TT table', pricePerHour: 0, maxHoursPerDay: 2, maxHoursPerWeek: 8, cooldownHours: 0 },
  { name: 'Cricket Net', type: 'other', description: 'Practice net for cricket', pricePerHour: 50, maxHoursPerDay: 2, maxHoursPerWeek: 6, cooldownHours: 0 },
];

export default function AdminUtilities() {
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState('');
  const [form, setForm] = useState(initialForm);
  const [showTemplates, setShowTemplates] = useState(false);

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
      <div className="page-head" style={{ marginBottom: 20 }}>
        <h1>Manage Utilities</h1>
        <p className="muted">Configure the resources available for booking in your organization.</p>
      </div>

      <div className="panel" style={{ padding: 24, marginBottom: 24, position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0 }}>{editingId ? 'Edit Utility' : 'Create New Utility'}</h3>
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
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>₹{t.pricePerHour}/hr • {t.type}</span>
              </button>
            ))}
          </div>
        )}

        <form onSubmit={onSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <label className="auth-label">
              Name
              <input name="name" value={form.name} onChange={onChange} required placeholder="e.g. Visitor Parking A" />
            </label>
            <label className="auth-label">
              Type
              <select name="type" value={form.type} onChange={onChange}>
                <option value="parking">Parking Spot</option>
                <option value="community_hall">Community Hall</option>
                <option value="generator">Generator</option>
                <option value="ev_charger">EV Charger</option>
                <option value="water_tanker">Water Tanker</option>
                <option value="other">Other</option>
              </select>
            </label>
          </div>
          
          <label className="auth-label" style={{ marginBottom: 20, display: 'block' }}>
            Description
            <input name="description" value={form.description} onChange={onChange} placeholder="Brief description of the utility..." />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
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

      <div className="panel table-scroll" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <tr>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.85rem' }}>NAME / TYPE</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.85rem' }}>PRICING</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.85rem' }}>LIMITS (DAY/WEEK)</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.85rem' }}>COOLDOWN</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', color: '#64748b', fontWeight: 600, fontSize: '0.85rem' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>No utilities found. Create one above.</td></tr>
            ) : items.map((u) => (
              <tr key={u._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontWeight: 500, color: '#1e293b' }}>{u.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'capitalize' }}>{u.type.replace('_', ' ')}</div>
                </td>
                <td style={{ padding: '12px 16px', color: '#1e293b' }}>
                  {u.pricePerHour > 0 ? `₹${u.pricePerHour}/hr` : <span style={{ color: '#22c55e', fontWeight: 500 }}>Free</span>}
                </td>
                <td style={{ padding: '12px 16px', color: '#475569' }}>
                  {u.maxHoursPerDay}h / {u.maxHoursPerWeek}h
                </td>
                <td style={{ padding: '12px 16px', color: '#475569' }}>
                  {u.cooldownHours > 0 ? `${u.cooldownHours}h` : 'None'}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <button className="btn ghost" style={{ padding: '4px 8px', fontSize: '0.8rem' }} onClick={() => onEdit(u)}>Edit</button>
                    <button className="btn danger-ghost" style={{ padding: '4px 8px', fontSize: '0.8rem', color: '#ef4444' }} onClick={async () => { if(confirm('Delete this utility?')) { await deleteUtility(u._id); fetchItems(); }}}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
