import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useOlympics } from '../../context/OlympicsContext';
import { useAdminMessage } from './useAdminMessage';
import styles from './Admin.module.css';

const ROUND_TYPES = {
  heat: 'Heat',
  repechage: 'Repechage',
  quarterfinal: 'Quarterfinal',
  semifinal: 'Semifinal',
  final: 'Final',
  bronze_final: 'Bronze Final',
  group_stage: 'Group Stage',
  round_robin: 'Round Robin',
  knockout: 'Knockout',
  qualification: 'Qualification',
  preliminary: 'Preliminary',
};

function formatEventName(name, gender) {
  if (!gender) return name;
  const prefixes = { men: "Men's", women: "Women's", mixed: "Mixed" };
  const prefix = prefixes[gender];
  return prefix ? `${prefix} ${name}` : name;
}

function getRoundLabel(round) {
  if (round.round_name) return round.round_name;
  const typeName = ROUND_TYPES[round.round_type] || round.round_type;
  const numberSuffix = round.round_number > 1 ? ` ${round.round_number}` : '';
  return `${typeName}${numberSuffix}`;
}

function getFullRoundLabel(round) {
  const sport = round.sport_name || '';
  const eventName = formatEventName(round.medal_event_name, round.gender);
  return `${sport}: ${eventName} — ${getRoundLabel(round)}`;
}

function AdminMatches() {
  const { selectedOlympicsId } = useOlympics();
  const { showMessage, MessageDisplay } = useAdminMessage();
  const [countries, setCountries] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [matches, setMatches] = useState([]);
  const [filterRoundId, setFilterRoundId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null);
  const [form, setForm] = useState({
    event_round_id: '',
    match_name: '',
    team_a_country_id: '',
    team_b_country_id: '',
    team_a_name: '',
    team_b_name: '',
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

  function resetForm() {
    setForm({
      event_round_id: '',
      match_name: '',
      team_a_country_id: '',
      team_b_country_id: '',
      team_a_name: '',
      team_b_name: '',
      start_time_utc: '',
      notes: '',
    });
    setEditingMatch(null);
  }

  function startEdit(match) {
    setEditingMatch(match);
    setForm({
      event_round_id: match.event_round_id?.toString() || '',
      match_name: match.match_name || '',
      team_a_country_id: match.team_a_country_id?.toString() || '',
      team_b_country_id: match.team_b_country_id?.toString() || '',
      team_a_name: match.team_a_name || '',
      team_b_name: match.team_b_name || '',
      start_time_utc: match.start_time_utc ? new Date(match.start_time_utc).toISOString().slice(0, 16) : '',
      notes: match.notes || '',
    });
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const data = {
        ...form,
        team_a_country_id: form.team_a_country_id || null,
        team_b_country_id: form.team_b_country_id || null,
        start_time_utc: form.start_time_utc ? new Date(form.start_time_utc).toISOString() : null,
      };

      if (editingMatch) {
        await api.updateMatch(editingMatch.id, data);
        showMessage('success', 'Match updated');
        resetForm();
        setShowForm(false);
      } else {
        await api.addMatch(data);
        showMessage('success', 'Match added');
        // Keep round selected for adding multiple matches
        setForm({
          event_round_id: form.event_round_id,
          match_name: '',
          team_a_country_id: '',
          team_b_country_id: '',
          team_a_name: '',
          team_b_name: '',
          start_time_utc: '',
          notes: '',
        });
      }
      loadData();
    } catch (err) {
      showMessage('error', err.message);
    }
  }

  async function handleUpdate(id, updates) {
    try {
      const match = matches.find((m) => m.id === id);
      await api.updateMatch(id, { ...match, ...updates });
      loadData();
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

  // Group matches by round
  const matchesByRound = matches.reduce((acc, match) => {
    const roundId = match.event_round_id;
    if (!acc[roundId]) acc[roundId] = [];
    acc[roundId].push(match);
    return acc;
  }, {});

  // Rounds with matches or matching filter
  const roundsWithMatches = rounds.filter(r =>
    matchesByRound[r.id]?.length > 0 || r.id === parseInt(filterRoundId)
  );

  // Apply filter
  const displayRounds = filterRoundId
    ? rounds.filter(r => r.id === parseInt(filterRoundId))
    : roundsWithMatches;

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <div>
          <h2>Manage Matches</h2>
          <p className={styles.hint}>Add individual matches within rounds (e.g., USA vs Canada).</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            if (showForm && editingMatch) {
              resetForm();
            }
            setShowForm(!showForm);
          }}
        >
          {showForm ? 'Hide Form' : '+ Add Match'}
        </button>
      </div>
      <MessageDisplay />

      {showForm && (
        <form onSubmit={handleSubmit} className={styles.form}>
          <h3 className={styles.formTitle}>{editingMatch ? 'Edit Match' : 'Add New Match'}</h3>

          <div className="form-group">
            <label>Round *</label>
            <select
              value={form.event_round_id}
              onChange={(e) => setForm({ ...form, event_round_id: e.target.value })}
              required
            >
              <option value="">Select Round</option>
              {rounds.map((r) => (
                <option key={r.id} value={r.id}>{getFullRoundLabel(r)}</option>
              ))}
            </select>
          </div>

          <div className={styles.formRow}>
            <div className="form-group">
              <label>Match Label</label>
              <input
                type="text"
                value={form.match_name}
                onChange={(e) => setForm({ ...form, match_name: e.target.value })}
                placeholder="e.g., Game 1, Pool A"
              />
            </div>
            <div className="form-group">
              <label>Start Time</label>
              <input
                type="datetime-local"
                value={form.start_time_utc}
                onChange={(e) => setForm({ ...form, start_time_utc: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Notes</label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="e.g., Sheet A"
              />
            </div>
          </div>

          <div className={styles.teamsFormRow}>
            <div className={styles.teamForm}>
              <label>Team A</label>
              <div className={styles.teamInputs}>
                <select
                  value={form.team_a_country_id}
                  onChange={(e) => setForm({ ...form, team_a_country_id: e.target.value })}
                >
                  <option value="">Country</option>
                  {countries.map((c) => (
                    <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={form.team_a_name}
                  onChange={(e) => setForm({ ...form, team_a_name: e.target.value })}
                  placeholder="Team name (opt)"
                />
              </div>
            </div>
            <span className={styles.vsLabel}>VS</span>
            <div className={styles.teamForm}>
              <label>Team B</label>
              <div className={styles.teamInputs}>
                <select
                  value={form.team_b_country_id}
                  onChange={(e) => setForm({ ...form, team_b_country_id: e.target.value })}
                >
                  <option value="">Country</option>
                  {countries.map((c) => (
                    <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={form.team_b_name}
                  onChange={(e) => setForm({ ...form, team_b_name: e.target.value })}
                  placeholder="Team name (opt)"
                />
              </div>
            </div>
          </div>

          <div className={styles.formActions}>
            <button type="submit" className="btn btn-primary">
              {editingMatch ? 'Save Changes' : 'Add Match'}
            </button>
            {editingMatch && (
              <button type="button" className="btn" onClick={() => { resetForm(); setShowForm(false); }}>
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {/* Filter */}
      <div className={styles.filterBar}>
        <select
          value={filterRoundId}
          onChange={(e) => setFilterRoundId(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">All Rounds with Matches</option>
          {rounds.map((r) => (
            <option key={r.id} value={r.id}>
              {getFullRoundLabel(r)} ({matchesByRound[r.id]?.length || 0})
            </option>
          ))}
        </select>
        <span className={styles.matchCount}>
          {matches.length} match{matches.length !== 1 ? 'es' : ''}
        </span>
      </div>

      {/* Matches grouped by round */}
      <div className={styles.roundGroups}>
        {displayRounds.length > 0 ? (
          displayRounds.map((round) => {
            const roundMatches = matchesByRound[round.id] || [];
            if (roundMatches.length === 0 && !filterRoundId) return null;

            return (
              <div key={round.id} className={styles.roundGroup}>
                <div className={styles.roundGroupHeader}>
                  <div>
                    <span className={styles.roundGroupSport}>{round.sport_name}</span>
                    <span className={styles.roundGroupEvent}>
                      {formatEventName(round.medal_event_name, round.gender)}
                    </span>
                    <span className={styles.roundGroupRound}>{getRoundLabel(round)}</span>
                  </div>
                  <span className={styles.roundGroupCount}>
                    {roundMatches.length} match{roundMatches.length !== 1 ? 'es' : ''}
                  </span>
                </div>

                {roundMatches.length > 0 ? (
                  <div className={styles.matchesGrid}>
                    {roundMatches.map((m) => (
                      <div key={m.id} className={`${styles.matchCard} ${styles[`match${m.status.charAt(0).toUpperCase() + m.status.slice(1)}`]}`}>
                        <div className={styles.matchCardTop}>
                          {m.match_name && <span className={styles.matchLabel}>{m.match_name}</span>}
                          {m.notes && <span className={styles.matchNotes}>{m.notes}</span>}
                          <select
                            value={m.status}
                            onChange={(e) => handleUpdate(m.id, { status: e.target.value })}
                            className={`${styles.statusBadgeSelect} ${styles[`status${m.status.charAt(0).toUpperCase() + m.status.slice(1)}`]}`}
                          >
                            <option value="scheduled">Scheduled</option>
                            <option value="live">Live</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>

                        <div className={styles.matchCardTeams}>
                          <div className={styles.matchCardTeam}>
                            {m.team_a_flag_url && (
                              <img src={m.team_a_flag_url} alt="" className={styles.flagSmall} />
                            )}
                            <span className={styles.teamCode}>
                              {m.team_a_country_code || m.team_a_name || 'TBD'}
                            </span>
                          </div>
                          <input
                            type="text"
                            value={m.team_a_score ?? ''}
                            onChange={(e) => handleUpdate(m.id, { team_a_score: e.target.value })}
                            className={styles.scoreBox}
                            placeholder="-"
                          />
                          <span className={styles.scoreDivider}>:</span>
                          <input
                            type="text"
                            value={m.team_b_score ?? ''}
                            onChange={(e) => handleUpdate(m.id, { team_b_score: e.target.value })}
                            className={styles.scoreBox}
                            placeholder="-"
                          />
                          <div className={styles.matchCardTeam}>
                            <span className={styles.teamCode}>
                              {m.team_b_country_code || m.team_b_name || 'TBD'}
                            </span>
                            {m.team_b_flag_url && (
                              <img src={m.team_b_flag_url} alt="" className={styles.flagSmall} />
                            )}
                          </div>
                        </div>

                        <div className={styles.matchCardActions}>
                          <button
                            onClick={() => startEdit(m)}
                            className={styles.matchEditBtn}
                            title="Edit match"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(m.id)}
                            className={styles.matchDeleteBtn}
                            title="Delete match"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.emptyRound}>No matches in this round yet.</p>
                )}
              </div>
            );
          })
        ) : (
          <p className={styles.empty}>
            {rounds.length === 0
              ? 'No rounds created yet. Create rounds first, then add matches.'
              : 'No matches added yet. Click "+ Add Match" to create one.'}
          </p>
        )}
      </div>
    </div>
  );
}

export default AdminMatches;
