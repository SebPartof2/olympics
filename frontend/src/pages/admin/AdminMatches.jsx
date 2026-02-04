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

function AdminMatches() {
  const { selectedOlympicsId } = useOlympics();
  const { showMessage, MessageDisplay } = useAdminMessage();
  const [countries, setCountries] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [matches, setMatches] = useState([]);
  const [form, setForm] = useState({
    event_round_id: '',
    match_name: '',
    team_a_country_id: '',
    team_b_country_id: '',
    team_a_name: '',
    team_b_name: '',
    team_a_score: '',
    team_b_score: '',
    winner_country_id: '',
    start_time_utc: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, [selectedOlympicsId]);

  async function loadData() {
    try {
      const [countriesData, roundsData, matchesData] = await Promise.all([
        api.getCountries(),
        api.getRounds(selectedOlympicsId ? { olympics: selectedOlympicsId } : {}),
        api.getMatches(selectedOlympicsId ? { olympics_id: selectedOlympicsId } : {}),
      ]);
      setCountries(countriesData);
      setRounds(roundsData);
      setMatches(matchesData);
    } catch (err) {
      showMessage('error', 'Failed to load data: ' + err.message);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const data = {
        ...form,
        start_time_utc: form.start_time_utc ? new Date(form.start_time_utc).toISOString() : null,
      };
      await api.addMatch(data);
      setForm({
        event_round_id: '',
        match_name: '',
        team_a_country_id: '',
        team_b_country_id: '',
        team_a_name: '',
        team_b_name: '',
        team_a_score: '',
        team_b_score: '',
        winner_country_id: '',
        start_time_utc: '',
        notes: '',
      });
      loadData();
      showMessage('success', 'Match added');
    } catch (err) {
      showMessage('error', err.message);
    }
  }

  async function handleUpdateScore(id, team_a_score, team_b_score, winner_country_id, status) {
    try {
      const match = matches.find((m) => m.id === id);
      await api.updateMatch(id, { ...match, team_a_score, team_b_score, winner_country_id, status });
      loadData();
      showMessage('success', 'Match updated');
    } catch (err) {
      showMessage('error', err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this match?')) return;
    try {
      await api.deleteMatch(id);
      loadData();
      showMessage('success', 'Match deleted');
    } catch (err) {
      showMessage('error', err.message);
    }
  }

  return (
    <div className={styles.section}>
      <h2>Manage Matches</h2>
      <p className={styles.hint}>Add individual matches within rounds (e.g., USA vs Canada in curling round robin).</p>
      <MessageDisplay />

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
          <div className="form-group">
            <label>Round</label>
            <select
              value={form.event_round_id}
              onChange={(e) => setForm({ ...form, event_round_id: e.target.value })}
              required
            >
              <option value="">Select Round</option>
              {rounds.map((r) => (
                <option key={r.id} value={r.id}>
                  {formatEventName(r.medal_event_name, r.gender)} - {ROUND_TYPES.find((t) => t.value === r.round_type)?.label || r.round_type}
                  {r.round_number > 1 ? ` ${r.round_number}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Match Name (optional)</label>
            <input
              type="text"
              value={form.match_name}
              onChange={(e) => setForm({ ...form, match_name: e.target.value })}
              placeholder="e.g., Match 1, Pool A"
            />
          </div>
          <div className="form-group">
            <label>Team A Country</label>
            <select
              value={form.team_a_country_id}
              onChange={(e) => setForm({ ...form, team_a_country_id: e.target.value })}
            >
              <option value="">Select Country</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Team A Name (optional)</label>
            <input
              type="text"
              value={form.team_a_name}
              onChange={(e) => setForm({ ...form, team_a_name: e.target.value })}
              placeholder="e.g., Team Smith"
            />
          </div>
          <div className="form-group">
            <label>Team B Country</label>
            <select
              value={form.team_b_country_id}
              onChange={(e) => setForm({ ...form, team_b_country_id: e.target.value })}
            >
              <option value="">Select Country</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Team B Name (optional)</label>
            <input
              type="text"
              value={form.team_b_name}
              onChange={(e) => setForm({ ...form, team_b_name: e.target.value })}
              placeholder="e.g., Team Jones"
            />
          </div>
          <div className="form-group">
            <label>Start Time (optional)</label>
            <input
              type="datetime-local"
              value={form.start_time_utc}
              onChange={(e) => setForm({ ...form, start_time_utc: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Notes (optional)</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="e.g., Sheet A"
            />
          </div>
        </div>
        <button type="submit" className="btn btn-primary">Add Match</button>
      </form>

      <div className={styles.list}>
        {matches.map((m) => (
          <div key={m.id} className={styles.matchItem}>
            <div className={styles.matchTeams}>
              <div className={styles.matchTeam}>
                {m.team_a_flag_url && (
                  <img src={m.team_a_flag_url} alt={m.team_a_country_code} className={styles.flagPreview} />
                )}
                <span>{m.team_a_country_code || m.team_a_name || 'TBD'}</span>
                <input
                  type="text"
                  value={m.team_a_score || ''}
                  onChange={(e) => handleUpdateScore(m.id, e.target.value, m.team_b_score, m.winner_country_id, m.status)}
                  className={styles.scoreInput}
                  placeholder="0"
                />
              </div>
              <span className={styles.vs}>vs</span>
              <div className={styles.matchTeam}>
                <input
                  type="text"
                  value={m.team_b_score || ''}
                  onChange={(e) => handleUpdateScore(m.id, m.team_a_score, e.target.value, m.winner_country_id, m.status)}
                  className={styles.scoreInput}
                  placeholder="0"
                />
                <span>{m.team_b_country_code || m.team_b_name || 'TBD'}</span>
                {m.team_b_flag_url && (
                  <img src={m.team_b_flag_url} alt={m.team_b_country_code} className={styles.flagPreview} />
                )}
              </div>
            </div>
            <div className={styles.matchInfo}>
              <span className={styles.matchRound}>{formatEventName(m.medal_event_name, m.gender)} - {m.round_type}</span>
              {m.match_name && <span className={styles.matchName}>{m.match_name}</span>}
            </div>
            <div className={styles.eventActions}>
              <select
                value={m.status}
                onChange={(e) => handleUpdateScore(m.id, m.team_a_score, m.team_b_score, m.winner_country_id, e.target.value)}
                className={styles.statusSelect}
              >
                <option value="scheduled">Scheduled</option>
                <option value="live">Live</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button onClick={() => handleDelete(m.id)} className="btn btn-danger">Delete</button>
            </div>
          </div>
        ))}
        {matches.length === 0 && (
          <p className={styles.empty}>No matches added yet. Create rounds first, then add matches within them.</p>
        )}
      </div>
    </div>
  );
}

export default AdminMatches;
