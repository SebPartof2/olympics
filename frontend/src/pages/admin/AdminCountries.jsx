import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAdminMessage } from './useAdminMessage';
import styles from './Admin.module.css';

function AdminCountries() {
  const { showMessage, MessageDisplay } = useAdminMessage();
  const [countries, setCountries] = useState([]);
  const [form, setForm] = useState({ name: '', code: '', flag_url: '' });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const data = await api.getCountries();
      setCountries(data);
    } catch (err) {
      showMessage('error', 'Failed to load countries: ' + err.message);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await api.addCountry(form);
      setForm({ name: '', code: '', flag_url: '' });
      loadData();
      showMessage('success', 'Country added');
    } catch (err) {
      showMessage('error', err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this country?')) return;
    try {
      await api.deleteCountry(id);
      loadData();
      showMessage('success', 'Country deleted');
    } catch (err) {
      showMessage('error', err.message);
    }
  }

  return (
    <div className={styles.section}>
      <h2>Manage Countries</h2>
      <MessageDisplay />

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
          <div className="form-group">
            <label>Country Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., United States"
              required
            />
          </div>
          <div className="form-group">
            <label>Code (3 letters)</label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="e.g., USA"
              maxLength={3}
              required
            />
          </div>
          <div className="form-group">
            <label>Flag URL</label>
            <input
              type="url"
              value={form.flag_url}
              onChange={(e) => setForm({ ...form, flag_url: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </div>
        <button type="submit" className="btn btn-primary">Add Country</button>
      </form>

      <div className={styles.list}>
        {countries.map((c) => (
          <div key={c.id} className={styles.listItem}>
            {c.flag_url && <img src={c.flag_url} alt={c.code} className={styles.flagPreview} />}
            <span className={styles.code}>{c.code}</span>
            <span className={styles.name}>{c.name}</span>
            <button onClick={() => handleDelete(c.id)} className="btn btn-danger">Delete</button>
          </div>
        ))}
        {countries.length === 0 && <p className={styles.empty}>No countries added yet.</p>}
      </div>
    </div>
  );
}

export default AdminCountries;
