import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useOlympics } from '../../context/OlympicsContext';
import { useAdminMessage } from './useAdminMessage';
import styles from './Admin.module.css';

function formatEventName(name, gender) {
  if (!gender) return name;
  const prefixes = { men: "Men's", women: "Women's", mixed: "Mixed" };
  const prefix = prefixes[gender];
  return prefix ? `${prefix} ${name}` : name;
}

function AdminMedals() {
  const { selectedOlympicsId } = useOlympics();
  const { showMessage, MessageDisplay } = useAdminMessage();
  const [countries, setCountries] = useState([]);
  const [medalEvents, setMedalEvents] = useState([]);
  const [medals, setMedals] = useState([]);
  const [form, setForm] = useState({
    medal_event_id: '',
    country_id: '',
    athlete_name: '',
    medal_type: 'gold',
    result_value: '',
    record_type: '',
  });

  useEffect(() => {
    loadData();
  }, [selectedOlympicsId]);

  async function loadData() {
    try {
      const [countriesData, eventsData, medalsData] = await Promise.all([
        api.getCountries(),
        api.getMedalEvents(selectedOlympicsId ? { olympics: selectedOlympicsId } : {}),
        api.getAllMedals(selectedOlympicsId),
      ]);
      setCountries(countriesData);
      setMedalEvents(eventsData);
      setMedals(medalsData);
    } catch (err) {
      showMessage('error', 'Failed to load data: ' + err.message);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await api.awardMedal(form);
      setForm({
        medal_event_id: '',
        country_id: '',
        athlete_name: '',
        medal_type: 'gold',
        result_value: '',
        record_type: '',
      });
      loadData();
      showMessage('success', 'Medal awarded');
    } catch (err) {
      showMessage('error', err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Remove this medal?')) return;
    try {
      await api.deleteMedal(id);
      loadData();
      showMessage('success', 'Medal removed');
    } catch (err) {
      showMessage('error', err.message);
    }
  }

  return (
    <div className={styles.section}>
      <h2>Award Medals</h2>
      <MessageDisplay />

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
          <div className="form-group">
            <label>Medal Event</label>
            <select
              value={form.medal_event_id}
              onChange={(e) => setForm({ ...form, medal_event_id: e.target.value })}
              required
            >
              <option value="">Select Medal Event</option>
              {medalEvents.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.sport_name}: {formatEventName(e.name, e.gender)}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Country</label>
            <select
              value={form.country_id}
              onChange={(e) => setForm({ ...form, country_id: e.target.value })}
              required
            >
              <option value="">Select Country</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Athlete/Team Name</label>
            <input
              type="text"
              value={form.athlete_name}
              onChange={(e) => setForm({ ...form, athlete_name: e.target.value })}
              placeholder="e.g., Michael Phelps"
              required
            />
          </div>
          <div className="form-group">
            <label>Medal</label>
            <select value={form.medal_type} onChange={(e) => setForm({ ...form, medal_type: e.target.value })}>
              <option value="gold">Gold</option>
              <option value="silver">Silver</option>
              <option value="bronze">Bronze</option>
            </select>
          </div>
          <div className="form-group">
            <label>Result (optional)</label>
            <input
              type="text"
              value={form.result_value}
              onChange={(e) => setForm({ ...form, result_value: e.target.value })}
              placeholder="e.g., 47.52s"
            />
          </div>
          <div className="form-group">
            <label>Record (optional)</label>
            <select value={form.record_type} onChange={(e) => setForm({ ...form, record_type: e.target.value })}>
              <option value="">None</option>
              <option value="WR">World Record (WR)</option>
              <option value="OR">Olympic Record (OR)</option>
              <option value="PB">Personal Best (PB)</option>
            </select>
          </div>
        </div>
        <button type="submit" className="btn btn-primary">Award Medal</button>
      </form>

      <div className={styles.list}>
        {medals.map((m) => (
          <div key={m.id} className={styles.medalItem}>
            <span className={`medal medal-${m.medal_type}`}>{m.medal_type.charAt(0).toUpperCase()}</span>
            <div className={styles.medalInfo}>
              <span className={styles.name}>{m.athlete_name}</span>
              <span className={styles.details}>
                {m.country_code} · {formatEventName(m.event_name, m.gender)} {m.record_type && <strong>({m.record_type})</strong>}
              </span>
              {m.result_value && <span className={styles.result}>{m.result_value}</span>}
            </div>
            <button onClick={() => handleDelete(m.id)} className="btn btn-danger">Remove</button>
          </div>
        ))}
        {medals.length === 0 && <p className={styles.empty}>No medals awarded yet.</p>}
      </div>
    </div>
  );
}

export default AdminMedals;
