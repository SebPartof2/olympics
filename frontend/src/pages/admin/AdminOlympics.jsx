import { useState } from 'react';
import api from '../../services/api';
import { useOlympics } from '../../context/OlympicsContext';
import { useAdminMessage } from './useAdminMessage';
import styles from './Admin.module.css';

const OLYMPICS_TYPES = [
  { value: 'summer', label: 'Summer Olympics' },
  { value: 'winter', label: 'Winter Olympics' },
  { value: 'youth', label: 'Youth Olympics' },
  { value: 'paralympics', label: 'Paralympics' },
];

function AdminOlympics() {
  const { refreshOlympics, olympicsList } = useOlympics();
  const { message, showMessage, MessageDisplay } = useAdminMessage();

  const [form, setForm] = useState({
    name: '',
    year: new Date().getFullYear(),
    type: 'summer',
    city: '',
    country: '',
    logo_url: '',
    start_date: '',
    end_date: '',
  });

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await api.addOlympics(form);
      setForm({
        name: '',
        year: new Date().getFullYear(),
        type: 'summer',
        city: '',
        country: '',
        logo_url: '',
        start_date: '',
        end_date: '',
      });
      refreshOlympics();
      showMessage('success', 'Olympics added');
    } catch (err) {
      showMessage('error', err.message);
    }
  }

  async function handleActivate(id) {
    try {
      await api.activateOlympics(id);
      refreshOlympics();
      showMessage('success', 'Olympics activated');
    } catch (err) {
      showMessage('error', err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this Olympics and all its events and medals?')) return;
    try {
      await api.deleteOlympics(id);
      refreshOlympics();
      showMessage('success', 'Olympics deleted');
    } catch (err) {
      showMessage('error', err.message);
    }
  }

  return (
    <div className={styles.section}>
      <h2>Manage Olympics</h2>
      <p className={styles.hint}>Create and manage different Olympic games (Summer 2024, Winter 2026, etc.)</p>

      <MessageDisplay />

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Paris 2024"
              required
            />
          </div>
          <div className="form-group">
            <label>Year</label>
            <input
              type="number"
              value={form.year}
              onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) })}
              required
            />
          </div>
          <div className="form-group">
            <label>Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {OLYMPICS_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>City</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="e.g., Paris"
              required
            />
          </div>
          <div className="form-group">
            <label>Country</label>
            <input
              type="text"
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              placeholder="e.g., France"
              required
            />
          </div>
          <div className="form-group">
            <label>Logo URL</label>
            <input
              type="url"
              value={form.logo_url}
              onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div className="form-group">
            <label>Start Date</label>
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>End Date</label>
            <input
              type="date"
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            />
          </div>
        </div>
        <button type="submit" className="btn btn-primary">Add Olympics</button>
      </form>

      <div className={styles.list}>
        {olympicsList.map((o) => (
          <div key={o.id} className={`${styles.listItem} ${o.is_active ? styles.activeItem : ''}`}>
            {o.logo_url && <img src={o.logo_url} alt={o.name} className={styles.logoPreview} />}
            <div className={styles.olympicsInfo}>
              <span className={styles.name}>{o.name}</span>
              <span className={styles.meta}>
                {o.city}, {o.country} · {OLYMPICS_TYPES.find((t) => t.value === o.type)?.label}
              </span>
              <span className={styles.meta}>{o.event_count || 0} events · {o.medal_count || 0} medals</span>
            </div>
            <div className={styles.eventActions}>
              {o.is_active ? (
                <span className="badge badge-live">Active</span>
              ) : (
                <button onClick={() => handleActivate(o.id)} className="btn btn-secondary">Activate</button>
              )}
              <button onClick={() => handleDelete(o.id)} className="btn btn-danger">Delete</button>
            </div>
          </div>
        ))}
        {olympicsList.length === 0 && <p className={styles.empty}>No Olympics created yet.</p>}
      </div>
    </div>
  );
}

export default AdminOlympics;
