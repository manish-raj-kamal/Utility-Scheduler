import { useEffect, useState } from 'react';
import { createUtility, deleteUtility, getUtilities, updateUtility } from '../services/api';

const initialForm = {
  name: '',
  type: 'parking',
  description: '',
  pricePerHour: 0,
  maxHoursPerDay: 4,
  maxHoursPerWeek: 12,
  cooldownHours: 2
};

export default function AdminUtilities() {
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState('');
  const [form, setForm] = useState(initialForm);

  const fetchItems = () => getUtilities().then((r) => setItems(r.data)).catch(() => {});
  useEffect(() => { fetchItems(); }, []);

  const onChange = (e) => {
    const value = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
    setForm((prev) => ({ ...prev, [e.target.name]: value }));
  };

  const reset = () => {
    setEditingId('');
    setForm(initialForm);
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
  };

  return (
    <div>
      <div className="page-head"><h1>Manage Utilities</h1><p className="muted">Create, edit and deactivate utilities.</p></div>

      <form className="panel form-grid" onSubmit={onSubmit}>
        <label>Name<input name="name" value={form.name} onChange={onChange} required /></label>
        <label>Type
          <select name="type" value={form.type} onChange={onChange}>
            <option value="parking">parking</option>
            <option value="community_hall">community_hall</option>
            <option value="generator">generator</option>
            <option value="ev_charger">ev_charger</option>
            <option value="water_tanker">water_tanker</option>
            <option value="other">other</option>
          </select>
        </label>
        <label>Description<input name="description" value={form.description} onChange={onChange} /></label>
        <label>Price/Hour<input type="number" name="pricePerHour" value={form.pricePerHour} onChange={onChange} min={0} /></label>
        <label>Max/Day<input type="number" name="maxHoursPerDay" value={form.maxHoursPerDay} onChange={onChange} min={1} /></label>
        <label>Max/Week<input type="number" name="maxHoursPerWeek" value={form.maxHoursPerWeek} onChange={onChange} min={1} /></label>
        <label>Cooldown<input type="number" name="cooldownHours" value={form.cooldownHours} onChange={onChange} min={0} /></label>
        <div className="actions-inline">
          <button className="btn primary" type="submit">{editingId ? 'Update' : 'Create'}</button>
          {editingId && <button className="btn ghost" type="button" onClick={reset}>Cancel</button>}
        </div>
      </form>

      <div className="panel table-scroll">
        <table className="table">
          <thead><tr><th>Name</th><th>Type</th><th>Price</th><th>Daily</th><th>Weekly</th><th>Cooldown</th><th>Actions</th></tr></thead>
          <tbody>
            {items.map((u) => (
              <tr key={u._id}>
                <td>{u.name}</td>
                <td>{u.type}</td>
                <td>₹{u.pricePerHour}</td>
                <td>{u.maxHoursPerDay}</td>
                <td>{u.maxHoursPerWeek}</td>
                <td>{u.cooldownHours}</td>
                <td className="actions-inline">
                  <button className="btn ghost" onClick={() => onEdit(u)}>Edit</button>
                  <button className="btn danger" onClick={async () => { await deleteUtility(u._id); fetchItems(); }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
