import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useOlympics } from '../../context/OlympicsContext';
import { useAdminMessage } from './useAdminMessage';
import styles from './Admin.module.css';

const ROUND_TYPES = [
  { value: 'heat', label: 'Heat' },
  { value: 'repechage', label: 'Repechage' },
  { value: 'quarterfinal', label: 'Quarterfinal' },
  { value: 'semifinal', label: 'Semifinal' },
  { value: 'final', label: 'Final' },
  { value: 'bronze_final', label: 'Bronze Final' },
  { value: 'group_stage', label: 'Group Stage' },
  { value: 'round_robin', label: 'Round Robin' },
  { value: 'knockout', label: 'Knockout' },
  { value: 'qualification', label: 'Qualification' },
  { value: 'preliminary', label: 'Preliminary' },
];

function formatEventName(name, gender) {
  if (!gender) return name;
  const prefixes = { men: "Men's", women: "Women's", mixed: "Mixed" };
  const prefix = prefixes[gender];
  return prefix ? `${prefix} ${name}` : name;
}

function AdminRounds() {
  const { selectedOlympicsId } = useOlympics();
  const { showMessage, MessageDisplay } = useAdminMessage();
  const [medalEvents, setMedalEvents] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [form, setForm] = useState({
    medal_event_id: '',
    round_type: 'heat',
    round_number: 1,
    round_name: '',
    start_time_utc: '',
    venue: '',
  });

  useEffect(() => {
    loadData();
  }, [selectedOlympicsId]);

  async function loadData() {
    try {
      const [eventsData, roundsData] = await Promise.all([
        api.getMedalEvents(selectedOlympicsId ? { olympics: selectedOlympicsId } : {}),
        api.getRounds(selectedOlympicsId ? { olympics: selectedOlympicsId } : {}),
      ]);
      setMedalEvents(eventsData);
      setRounds(roundsData);
    } catch (err) {
      showMessage('error', 'Failed to load data: ' + err.message);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const data = { ...form, start_time_utc: new Date(form.start_time_utc).toISOString() };
      await api.addRound(data);
      setForm({
        medal_event_id: '',
        round_type: 'heat',
        round_number: 1,
        round_name: '',
        start_time_utc: '',
        venue: '',
      });
      loadData();
      showMessage('success', 'Round added');
    } catch (err) {
      showMessage('error', err.message);
    }
  }

  async function handleUpdateStatus(id, status) {
    try {
      const round = rounds.find((r) => r.id === id);
      await api.updateRound(id, { ...round, status });
      loadData();
      showMessage('success', 'Round status updated');
    } catch (err) {
      showMessage('error', err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this round?')) return;
    try {
      await api.deleteRound(id);
      loadData();
      showMessage('success', 'Round deleted');
    } catch (err) {
      showMessage('error', err.message);
    }
  }

  return (
    <div className={styles.section}>
      <h2>Manage Event Rounds</h2>
      <p className={styles.hint}>Rounds are the sub-events (heats, semifinals, finals) scheduled at specific times.</p>
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
            <label>Round Type</label>
            <select value={form.round_type} onChange={(e) => setForm({ ...form, round_type: e.target.value })}>
              {ROUND_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Round Number</label>
            <input
              type="number"
              min="1"
              value={form.round_number}
              onChange={(e) => setForm({ ...form, round_number: parseInt(e.target.value) || 1 })}
            />
          </div>
          <div className="form-group">
            <label>Custom Name (optional)</label>
            <input
              type="text"
              value={form.round_name}
              onChange={(e) => setForm({ ...form, round_name: e.target.value })}
              placeholder="e.g., Heat 3A"
            />
          </div>
          <div className="form-group">
            <label>Start Time (your local time)</label>
            <input
              type="datetime-local"
              value={form.start_time_utc}
              onChange={(e) => setForm({ ...form, start_time_utc: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Venue (optional)</label>
            <input
              type="text"
              value={form.venue}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
              placeholder="Override event venue"
            />
          </div>
        </div>
        <button type="submit" className="btn btn-primary">Add Round</button>
      </form>

      <div className={styles.list}>
        {rounds.map((r) => (
          <div key={r.id} className={styles.eventItem}>
            <div className={styles.eventInfo}>
              <span className={styles.name}>
                {r.round_name ||
                  `${ROUND_TYPES.find((t) => t.value === r.round_type)?.label || r.round_type}${
                    r.round_number > 1 ? ` ${r.round_number}` : ''
                  }`}
              </span>
              <span className={styles.sport}>{formatEventName(r.medal_event_name, r.gender)}</span>
              <span className={styles.meta}>{new Date(r.start_time_utc).toLocaleString()}</span>
            </div>
            <div className={styles.eventActions}>
              <select
                value={r.status}
                onChange={(e) => handleUpdateStatus(r.id, e.target.value)}
                className={styles.statusSelect}
              >
                <option value="scheduled">Scheduled</option>
                <option value="delayed">Delayed</option>
                <option value="live">Live</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button onClick={() => handleDelete(r.id)} className="btn btn-danger">Delete</button>
            </div>
          </div>
        ))}
        {rounds.length === 0 && <p className={styles.empty}>No rounds added yet. Create medal events first.</p>}
      </div>
    </div>
  );
}

export default AdminRounds;
