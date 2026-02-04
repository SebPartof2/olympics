import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useOlympics } from '../../context/OlympicsContext';
import { useAdminMessage } from './useAdminMessage';
import styles from './Admin.module.css';

function AdminEvents() {
  const { selectedOlympicsId } = useOlympics();
  const { showMessage, MessageDisplay } = useAdminMessage();
  const [sports, setSports] = useState([]);
  const [medalEvents, setMedalEvents] = useState([]);
  const [form, setForm] = useState({
    sport_id: '',
    name: '',
    gender: 'mixed',
    event_type: 'individual',
    venue: '',
    scheduled_date: '',
  });

  useEffect(() => {
    loadData();
  }, [selectedOlympicsId]);

  async function loadData() {
    try {
      const [sportsData, eventsData] = await Promise.all([
        api.getSports(),
        api.getMedalEvents(selectedOlympicsId ? { olympics: selectedOlympicsId } : {}),
      ]);
      setSports(sportsData);
      setMedalEvents(eventsData);
    } catch (err) {
      showMessage('error', 'Failed to load data: ' + err.message);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const data = { ...form, olympics_id: selectedOlympicsId };
      await api.addMedalEvent(data);
      setForm({
        sport_id: '',
        name: '',
        gender: 'mixed',
        event_type: 'individual',
        venue: '',
        scheduled_date: '',
      });
      loadData();
      showMessage('success', 'Medal event added');
    } catch (err) {
      showMessage('error', err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this medal event and all its rounds?')) return;
    try {
      await api.deleteMedalEvent(id);
      loadData();
      showMessage('success', 'Medal event deleted');
    } catch (err) {
      showMessage('error', err.message);
    }
  }

  return (
    <div className={styles.section}>
      <h2>Manage Medal Events</h2>
      <p className={styles.hint}>
        Medal events for the currently selected Olympics. Use the dropdown in the header to switch Olympics.
        {!selectedOlympicsId && <strong> Please create an Olympics first.</strong>}
      </p>
      <MessageDisplay />

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
          <div className="form-group">
            <label>Sport</label>
            <select
              value={form.sport_id}
              onChange={(e) => setForm({ ...form, sport_id: e.target.value })}
              required
            >
              <option value="">Select Sport</option>
              {sports.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Event Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., 100m Freestyle"
              required
            />
          </div>
          <div className="form-group">
            <label>Gender</label>
            <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option value="men">Men</option>
              <option value="women">Women</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
          <div className="form-group">
            <label>Type</label>
            <select value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })}>
              <option value="individual">Individual</option>
              <option value="team">Team</option>
            </select>
          </div>
          <div className="form-group">
            <label>Venue</label>
            <input
              type="text"
              value={form.venue}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
              placeholder="e.g., Aquatics Centre"
            />
          </div>
          <div className="form-group">
            <label>Final Date</label>
            <input
              type="date"
              value={form.scheduled_date}
              onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
            />
          </div>
        </div>
        <button type="submit" className="btn btn-primary">Add Medal Event</button>
      </form>

      <div className={styles.list}>
        {medalEvents.map((e) => (
          <div key={e.id} className={styles.eventItem}>
            <div className={styles.eventInfo}>
              <span className={styles.name}>
                {e.gender === 'men' ? "Men's" : e.gender === 'women' ? "Women's" : ''} {e.name}
              </span>
              <span className={styles.sport}>{e.sport_name}</span>
              <span className={styles.meta}>{e.round_count} rounds · {e.medal_count} medals</span>
            </div>
            <button onClick={() => handleDelete(e.id)} className="btn btn-danger">Delete</button>
          </div>
        ))}
        {medalEvents.length === 0 && <p className={styles.empty}>No medal events added yet.</p>}
      </div>
    </div>
  );
}

export default AdminEvents;
