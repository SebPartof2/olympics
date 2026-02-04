import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAdminMessage } from './useAdminMessage';
import styles from './Admin.module.css';

function AdminSports() {
  const { showMessage, MessageDisplay } = useAdminMessage();
  const [sports, setSports] = useState([]);
  const [form, setForm] = useState({ name: '', icon_url: '' });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const data = await api.getSports();
      setSports(data);
    } catch (err) {
      showMessage('error', 'Failed to load sports: ' + err.message);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await api.addSport(form);
      setForm({ name: '', icon_url: '' });
      loadData();
      showMessage('success', 'Sport added');
    } catch (err) {
      showMessage('error', err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this sport?')) return;
    try {
      await api.deleteSport(id);
      loadData();
      showMessage('success', 'Sport deleted');
    } catch (err) {
      showMessage('error', err.message);
    }
  }

  return (
    <div className={styles.section}>
      <h2>Manage Sports</h2>
      <MessageDisplay />

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
          <div className="form-group">
            <label>Sport Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Swimming"
              required
            />
          </div>
          <div className="form-group">
            <label>Icon URL</label>
            <input
              type="url"
              value={form.icon_url}
              onChange={(e) => setForm({ ...form, icon_url: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </div>
        <button type="submit" className="btn btn-primary">Add Sport</button>
      </form>

      <div className={styles.list}>
        {sports.map((s) => (
          <div key={s.id} className={styles.listItem}>
            {s.icon_url && <img src={s.icon_url} alt={s.name} className={styles.iconPreview} />}
            <span className={styles.name}>{s.name}</span>
            <button onClick={() => handleDelete(s.id)} className="btn btn-danger">Delete</button>
          </div>
        ))}
        {sports.length === 0 && <p className={styles.empty}>No sports added yet.</p>}
      </div>
    </div>
  );
}

export default AdminSports;
