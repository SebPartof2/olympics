import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useOlympics } from '../context/OlympicsContext';
import api, { toLocalInputValue } from '../services/api';
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

const OLYMPICS_TYPES = [
  { value: 'summer', label: 'Summer Olympics' },
  { value: 'winter', label: 'Winter Olympics' },
  { value: 'youth', label: 'Youth Olympics' },
  { value: 'paralympics', label: 'Paralympics' },
];

function Admin() {
  const { isAuthenticated, isLoading, login, logout } = useAuth();
  const { selectedOlympicsId, refreshOlympics, olympicsList } = useOlympics();
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('olympics');

  // Data states
  const [settings, setSettings] = useState({});
  const [countries, setCountries] = useState([]);
  const [sports, setSports] = useState([]);
  const [medalEvents, setMedalEvents] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [matches, setMatches] = useState([]);
  const [medals, setMedals] = useState([]);

  // Form states
  const [settingsForm, setSettingsForm] = useState({
    default_timezone: '',
  });
  const [olympicsForm, setOlympicsForm] = useState({
    name: '', year: new Date().getFullYear(), type: 'summer', city: '', country: '', logo_url: '', start_date: '', end_date: '',
  });
  const [countryForm, setCountryForm] = useState({ name: '', code: '', flag_url: '' });
  const [sportForm, setSportForm] = useState({ name: '', icon_url: '' });
  const [medalEventForm, setMedalEventForm] = useState({
    olympics_id: '', sport_id: '', name: '', gender: 'mixed', event_type: 'individual', venue: '', scheduled_date: '',
  });
  const [roundForm, setRoundForm] = useState({
    medal_event_id: '', round_type: 'heat', round_number: 1, round_name: '', start_time_utc: '', venue: '',
  });
  const [medalForm, setMedalForm] = useState({
    medal_event_id: '', country_id: '', athlete_name: '', medal_type: 'gold', result_value: '', record_type: '',
  });
  const [matchForm, setMatchForm] = useState({
    event_round_id: '', match_name: '', team_a_country_id: '', team_b_country_id: '', team_a_name: '', team_b_name: '',
    team_a_score: '', team_b_score: '', winner_country_id: '', start_time_utc: '', notes: '',
  });

  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    }
  }, [isAuthenticated, selectedOlympicsId]);

  async function loadAllData() {
    try {
      const [settingsData, countriesData, sportsData, medalEventsData, roundsData, matchesData, medalsData] = await Promise.all([
        api.getSettings(),
        api.getCountries(),
        api.getSports(),
        api.getMedalEvents(selectedOlympicsId ? { olympics: selectedOlympicsId } : {}),
        api.getRounds(selectedOlympicsId ? { olympics: selectedOlympicsId } : {}),
        api.getMatches(selectedOlympicsId ? { olympics: selectedOlympicsId } : {}),
        api.getAllMedals(selectedOlympicsId),
      ]);
      setSettings(settingsData);
      setSettingsForm({
        default_timezone: settingsData.default_timezone || 'America/New_York',
      });
      setCountries(countriesData);
      setSports(sportsData);
      setMedalEvents(medalEventsData);
      setRounds(roundsData);
      setMatches(matchesData);
      setMedals(medalsData);
      // Set default olympics_id for medal event form
      if (selectedOlympicsId) {
        setMedalEventForm(prev => ({ ...prev, olympics_id: selectedOlympicsId }));
      }
    } catch (err) {
      showMessage('error', 'Failed to load data: ' + err.message);
    }
  }

  function showMessage(type, text) {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError('');
    const success = await login(password);
    if (!success) setLoginError('Invalid password');
    setPassword('');
  }

  // Settings handlers
  async function handleSaveSettings(e) {
    e.preventDefault();
    try {
      await api.updateSettings(settingsForm);
      loadAllData();
      showMessage('success', 'Settings saved');
    } catch (err) {
      showMessage('error', err.message);
    }
  }

  // Olympics handlers
  async function handleAddOlympics(e) {
    e.preventDefault();
    try {
      await api.addOlympics(olympicsForm);
      setOlympicsForm({ name: '', year: new Date().getFullYear(), type: 'summer', city: '', country: '', logo_url: '', start_date: '', end_date: '' });
      refreshOlympics();
      showMessage('success', 'Olympics added');
    } catch (err) {
      showMessage('error', err.message);
    }
  }

  async function handleActivateOlympics(id) {
    try {
      await api.activateOlympics(id);
      refreshOlympics();
      showMessage('success', 'Olympics activated');
    } catch (err) {
      showMessage('error', err.message);
    }
  }

  async function handleDeleteOlympics(id) {
    if (!confirm('Delete this Olympics and all its events and medals?')) return;
    try {
      await api.deleteOlympics(id);
      refreshOlympics();
      showMessage('success', 'Olympics deleted');
    } catch (err) {
      showMessage('error', err.message);
    }
  }

  // Country handlers
  async function handleAddCountry(e) {
    e.preventDefault();
    try {
      await api.addCountry(countryForm);
      setCountryForm({ name: '', code: '', flag_url: '' });
      loadAllData();
      showMessage('success', 'Country added');
    } catch (err) {
      showMessage('error', err.message);
    }
  }

  async function handleDeleteCountry(id) {
    if (!confirm('Delete this country?')) return;
    try {
      await api.deleteCountry(id);
      loadAllData();
      showMessage('success', 'Country deleted');
    } catch (err) {
      showMessage('error', err.message);
    }
  }

  // Sport handlers
  async function handleAddSport(e) {
    e.preventDefault();
    try {
      await api.addSport(sportForm);
      setSportForm({ name: '', icon_url: '' });
      loadAllData();
      showMessage('success', 'Sport added');
    } catch (err) {
      showMessage('error', err.message);
    }
  }

  async function handleDeleteSport(id) {
    if (!confirm('Delete this sport?')) return;
    try {
      await api.deleteSport(id);
      loadAllData();
      showMessage('success', 'Sport deleted');
    } catch (err) {
      showMessage('error', err.message);
    }
  }

  // Medal Event handlers
  async function handleAddMedalEvent(e) {
    e.preventDefault();
    try {
      const data = { ...medalEventForm, olympics_id: selectedOlympicsId };
      await api.addMedalEvent(data);
      setMedalEventForm({ olympics_id: selectedOlympicsId, sport_id: '', name: '', gender: 'mixed', event_type: 'individual', venue: '', scheduled_date: '' });
      loadAllData();
      showMessage('success', 'Medal event added');
    } catch (err) {
      showMessage('error', err.message);
    }
  }

  async function handleDeleteMedalEvent(id) {
    if (!confirm('Delete this medal event and all its rounds?')) return;
    try {
      await api.deleteMedalEvent(id);
      loadAllData();
      showMessage('success', 'Medal event deleted');
    } catch (err) {
      showMessage('error', err.message);
    }
  }

  // Round handlers
  async function handleAddRound(e) {
    e.preventDefault();
    try {
      const data = { ...roundForm, start_time_utc: new Date(roundForm.start_time_utc).toISOString() };
      await api.addRound(data);
      setRoundForm({ medal_event_id: '', round_type: 'heat', round_number: 1, round_name: '', start_time_utc: '', venue: '' });
      loadAllData();
      showMessage('success', 'Round added');
    } catch (err) {
      showMessage('error', err.message);
    }
  }

  async function handleUpdateRoundStatus(id, status) {
    try {
      const round = rounds.find(r => r.id === id);
      await api.updateRound(id, { ...round, status });
      loadAllData();
      showMessage('success', 'Round status updated');
    } catch (err) {
      showMessage('error', err.message);
    }
  }

  async function handleDeleteRound(id) {
    if (!confirm('Delete this round?')) return;
    try {
      await api.deleteRound(id);
      loadAllData();
      showMessage('success', 'Round deleted');
    } catch (err) {
      showMessage('error', err.message);
    }
  }

  // Medal handlers
  async function handleAwardMedal(e) {
    e.preventDefault();
    try {
      await api.awardMedal(medalForm);
      setMedalForm({ medal_event_id: '', country_id: '', athlete_name: '', medal_type: 'gold', result_value: '', record_type: '' });
      loadAllData();
      showMessage('success', 'Medal awarded');
    } catch (err) {
      showMessage('error', err.message);
    }
  }

  async function handleDeleteMedal(id) {
    if (!confirm('Remove this medal?')) return;
    try {
      await api.deleteMedal(id);
      loadAllData();
      showMessage('success', 'Medal removed');
    } catch (err) {
      showMessage('error', err.message);
    }
  }

  // Match handlers
  async function handleAddMatch(e) {
    e.preventDefault();
    try {
      const data = {
        ...matchForm,
        start_time_utc: matchForm.start_time_utc ? new Date(matchForm.start_time_utc).toISOString() : null,
      };
      await api.addMatch(data);
      setMatchForm({
        event_round_id: '', match_name: '', team_a_country_id: '', team_b_country_id: '', team_a_name: '', team_b_name: '',
        team_a_score: '', team_b_score: '', winner_country_id: '', start_time_utc: '', notes: '',
      });
      loadAllData();
      showMessage('success', 'Match added');
    } catch (err) {
      showMessage('error', err.message);
    }
  }

  async function handleUpdateMatchScore(id, team_a_score, team_b_score, winner_country_id, status) {
    try {
      const match = matches.find(m => m.id === id);
      await api.updateMatch(id, { ...match, team_a_score, team_b_score, winner_country_id, status });
      loadAllData();
      showMessage('success', 'Match updated');
    } catch (err) {
      showMessage('error', err.message);
    }
  }

  async function handleDeleteMatch(id) {
    if (!confirm('Delete this match?')) return;
    try {
      await api.deleteMatch(id);
      loadAllData();
      showMessage('success', 'Match deleted');
    } catch (err) {
      showMessage('error', err.message);
    }
  }

  if (isLoading) return <div className="loading"></div>;

  if (!isAuthenticated) {
    return (
      <div className="container">
        <div className={styles.loginContainer}>
          <h1>Admin Login</h1>
          <p>Enter the admin password to manage Olympics data.</p>
          <form onSubmit={handleLogin} className={styles.loginForm}>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter admin password" required />
            </div>
            {loginError && <p className={styles.loginError}>{loginError}</p>}
            <button type="submit" className="btn btn-primary">Login</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <header className={styles.header}>
        <div>
          <h1>Admin Panel</h1>
          <p>Manage Olympics data</p>
        </div>
        <button onClick={logout} className="btn btn-secondary">Logout</button>
      </header>

      {message.text && <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>}

      <div className={styles.tabs}>
        {['olympics', 'settings', 'countries', 'sports', 'events', 'rounds', 'matches', 'medals'].map((tab) => (
          <button key={tab} className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ''}`} onClick={() => setActiveTab(tab)}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {/* OLYMPICS TAB */}
        {activeTab === 'olympics' && (
          <div className={styles.section}>
            <h2>Manage Olympics</h2>
            <p className={styles.hint}>Create and manage different Olympic games (Summer 2024, Winter 2026, etc.)</p>
            <form onSubmit={handleAddOlympics} className={styles.form}>
              <div className={styles.formGrid}>
                <div className="form-group">
                  <label>Name</label>
                  <input type="text" value={olympicsForm.name} onChange={(e) => setOlympicsForm({ ...olympicsForm, name: e.target.value })} placeholder="e.g., Paris 2024" required />
                </div>
                <div className="form-group">
                  <label>Year</label>
                  <input type="number" value={olympicsForm.year} onChange={(e) => setOlympicsForm({ ...olympicsForm, year: parseInt(e.target.value) })} required />
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select value={olympicsForm.type} onChange={(e) => setOlympicsForm({ ...olympicsForm, type: e.target.value })}>
                    {OLYMPICS_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>City</label>
                  <input type="text" value={olympicsForm.city} onChange={(e) => setOlympicsForm({ ...olympicsForm, city: e.target.value })} placeholder="e.g., Paris" required />
                </div>
                <div className="form-group">
                  <label>Country</label>
                  <input type="text" value={olympicsForm.country} onChange={(e) => setOlympicsForm({ ...olympicsForm, country: e.target.value })} placeholder="e.g., France" required />
                </div>
                <div className="form-group">
                  <label>Logo URL</label>
                  <input type="url" value={olympicsForm.logo_url} onChange={(e) => setOlympicsForm({ ...olympicsForm, logo_url: e.target.value })} placeholder="https://..." />
                </div>
                <div className="form-group">
                  <label>Start Date</label>
                  <input type="date" value={olympicsForm.start_date} onChange={(e) => setOlympicsForm({ ...olympicsForm, start_date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input type="date" value={olympicsForm.end_date} onChange={(e) => setOlympicsForm({ ...olympicsForm, end_date: e.target.value })} />
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
                    <span className={styles.meta}>{o.city}, {o.country} · {OLYMPICS_TYPES.find(t => t.value === o.type)?.label}</span>
                    <span className={styles.meta}>{o.event_count || 0} events · {o.medal_count || 0} medals</span>
                  </div>
                  <div className={styles.eventActions}>
                    {o.is_active ? (
                      <span className="badge badge-live">Active</span>
                    ) : (
                      <button onClick={() => handleActivateOlympics(o.id)} className="btn btn-secondary">Activate</button>
                    )}
                    <button onClick={() => handleDeleteOlympics(o.id)} className="btn btn-danger">Delete</button>
                  </div>
                </div>
              ))}
              {olympicsList.length === 0 && <p className={styles.empty}>No Olympics created yet.</p>}
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className={styles.section}>
            <h2>Global Settings</h2>
            <form onSubmit={handleSaveSettings} className={styles.form}>
              <div className={styles.formGrid}>
                <div className="form-group">
                  <label>Default Timezone (for data entry)</label>
                  <input
                    type="text"
                    list="timezone-list"
                    value={settingsForm.default_timezone}
                    onChange={(e) => setSettingsForm({ ...settingsForm, default_timezone: e.target.value })}
                    placeholder="e.g., America/New_York"
                  />
                  <datalist id="timezone-list">
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York (ET)</option>
                    <option value="America/Chicago">America/Chicago (CT)</option>
                    <option value="America/Denver">America/Denver (MT)</option>
                    <option value="America/Los_Angeles">America/Los_Angeles (PT)</option>
                    <option value="America/Anchorage">America/Anchorage (AKT)</option>
                    <option value="America/Phoenix">America/Phoenix (MST)</option>
                    <option value="America/Toronto">America/Toronto (ET)</option>
                    <option value="America/Vancouver">America/Vancouver (PT)</option>
                    <option value="America/Mexico_City">America/Mexico_City (CST)</option>
                    <option value="America/Sao_Paulo">America/Sao_Paulo (BRT)</option>
                    <option value="America/Buenos_Aires">America/Buenos_Aires (ART)</option>
                    <option value="Europe/London">Europe/London (GMT/BST)</option>
                    <option value="Europe/Paris">Europe/Paris (CET/CEST)</option>
                    <option value="Europe/Berlin">Europe/Berlin (CET/CEST)</option>
                    <option value="Europe/Rome">Europe/Rome (CET/CEST)</option>
                    <option value="Europe/Madrid">Europe/Madrid (CET/CEST)</option>
                    <option value="Europe/Amsterdam">Europe/Amsterdam (CET/CEST)</option>
                    <option value="Europe/Moscow">Europe/Moscow (MSK)</option>
                    <option value="Europe/Istanbul">Europe/Istanbul (TRT)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="Asia/Bangkok">Asia/Bangkok (ICT)</option>
                    <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                    <option value="Asia/Hong_Kong">Asia/Hong_Kong (HKT)</option>
                    <option value="Asia/Shanghai">Asia/Shanghai (CST)</option>
                    <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                    <option value="Asia/Seoul">Asia/Seoul (KST)</option>
                    <option value="Australia/Perth">Australia/Perth (AWST)</option>
                    <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
                    <option value="Australia/Melbourne">Australia/Melbourne (AEST)</option>
                    <option value="Pacific/Auckland">Pacific/Auckland (NZST)</option>
                    <option value="Pacific/Honolulu">Pacific/Honolulu (HST)</option>
                  </datalist>
                  <small className={styles.hint}>Enter any valid IANA timezone (e.g., Europe/Paris, Asia/Tokyo)</small>
                </div>
              </div>
              <button type="submit" className="btn btn-primary">Save Settings</button>
            </form>
          </div>
        )}

        {/* COUNTRIES TAB */}
        {activeTab === 'countries' && (
          <div className={styles.section}>
            <h2>Manage Countries</h2>
            <form onSubmit={handleAddCountry} className={styles.form}>
              <div className={styles.formGrid}>
                <div className="form-group">
                  <label>Country Name</label>
                  <input type="text" value={countryForm.name} onChange={(e) => setCountryForm({ ...countryForm, name: e.target.value })} placeholder="e.g., United States" required />
                </div>
                <div className="form-group">
                  <label>Code (3 letters)</label>
                  <input type="text" value={countryForm.code} onChange={(e) => setCountryForm({ ...countryForm, code: e.target.value.toUpperCase() })} placeholder="e.g., USA" maxLength={3} required />
                </div>
                <div className="form-group">
                  <label>Flag URL</label>
                  <input type="url" value={countryForm.flag_url} onChange={(e) => setCountryForm({ ...countryForm, flag_url: e.target.value })} placeholder="https://..." />
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
                  <button onClick={() => handleDeleteCountry(c.id)} className="btn btn-danger">Delete</button>
                </div>
              ))}
              {countries.length === 0 && <p className={styles.empty}>No countries added yet.</p>}
            </div>
          </div>
        )}

        {/* SPORTS TAB */}
        {activeTab === 'sports' && (
          <div className={styles.section}>
            <h2>Manage Sports</h2>
            <form onSubmit={handleAddSport} className={styles.form}>
              <div className={styles.formGrid}>
                <div className="form-group">
                  <label>Sport Name</label>
                  <input type="text" value={sportForm.name} onChange={(e) => setSportForm({ ...sportForm, name: e.target.value })} placeholder="e.g., Swimming" required />
                </div>
                <div className="form-group">
                  <label>Icon URL</label>
                  <input type="url" value={sportForm.icon_url} onChange={(e) => setSportForm({ ...sportForm, icon_url: e.target.value })} placeholder="https://..." />
                </div>
              </div>
              <button type="submit" className="btn btn-primary">Add Sport</button>
            </form>
            <div className={styles.list}>
              {sports.map((s) => (
                <div key={s.id} className={styles.listItem}>
                  {s.icon_url && <img src={s.icon_url} alt={s.name} className={styles.iconPreview} />}
                  <span className={styles.name}>{s.name}</span>
                  <button onClick={() => handleDeleteSport(s.id)} className="btn btn-danger">Delete</button>
                </div>
              ))}
              {sports.length === 0 && <p className={styles.empty}>No sports added yet.</p>}
            </div>
          </div>
        )}

        {/* MEDAL EVENTS TAB */}
        {activeTab === 'events' && (
          <div className={styles.section}>
            <h2>Manage Medal Events</h2>
            <p className={styles.hint}>
              Medal events for the currently selected Olympics. Use the dropdown in the header to switch Olympics.
              {!selectedOlympicsId && <strong> Please create an Olympics first.</strong>}
            </p>
            <form onSubmit={handleAddMedalEvent} className={styles.form}>
              <div className={styles.formGrid}>
                <div className="form-group">
                  <label>Sport</label>
                  <select value={medalEventForm.sport_id} onChange={(e) => setMedalEventForm({ ...medalEventForm, sport_id: e.target.value })} required>
                    <option value="">Select Sport</option>
                    {sports.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Event Name</label>
                  <input type="text" value={medalEventForm.name} onChange={(e) => setMedalEventForm({ ...medalEventForm, name: e.target.value })} placeholder="e.g., 100m Freestyle" required />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select value={medalEventForm.gender} onChange={(e) => setMedalEventForm({ ...medalEventForm, gender: e.target.value })}>
                    <option value="men">Men</option>
                    <option value="women">Women</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select value={medalEventForm.event_type} onChange={(e) => setMedalEventForm({ ...medalEventForm, event_type: e.target.value })}>
                    <option value="individual">Individual</option>
                    <option value="team">Team</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Venue</label>
                  <input type="text" value={medalEventForm.venue} onChange={(e) => setMedalEventForm({ ...medalEventForm, venue: e.target.value })} placeholder="e.g., Aquatics Centre" />
                </div>
                <div className="form-group">
                  <label>Final Date</label>
                  <input type="date" value={medalEventForm.scheduled_date} onChange={(e) => setMedalEventForm({ ...medalEventForm, scheduled_date: e.target.value })} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary">Add Medal Event</button>
            </form>
            <div className={styles.list}>
              {medalEvents.map((e) => (
                <div key={e.id} className={styles.eventItem}>
                  <div className={styles.eventInfo}>
                    <span className={styles.name}>{e.gender === 'men' ? "Men's" : e.gender === 'women' ? "Women's" : ''} {e.name}</span>
                    <span className={styles.sport}>{e.sport_name}</span>
                    <span className={styles.meta}>{e.round_count} rounds · {e.medal_count} medals</span>
                  </div>
                  <button onClick={() => handleDeleteMedalEvent(e.id)} className="btn btn-danger">Delete</button>
                </div>
              ))}
              {medalEvents.length === 0 && <p className={styles.empty}>No medal events added yet.</p>}
            </div>
          </div>
        )}

        {/* ROUNDS TAB */}
        {activeTab === 'rounds' && (
          <div className={styles.section}>
            <h2>Manage Event Rounds</h2>
            <p className={styles.hint}>Rounds are the sub-events (heats, semifinals, finals) scheduled at specific times.</p>
            <form onSubmit={handleAddRound} className={styles.form}>
              <div className={styles.formGrid}>
                <div className="form-group">
                  <label>Medal Event</label>
                  <select value={roundForm.medal_event_id} onChange={(e) => setRoundForm({ ...roundForm, medal_event_id: e.target.value })} required>
                    <option value="">Select Medal Event</option>
                    {medalEvents.map((e) => <option key={e.id} value={e.id}>{e.sport_name}: {e.gender === 'men' ? "M" : e.gender === 'women' ? "W" : ""} {e.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Round Type</label>
                  <select value={roundForm.round_type} onChange={(e) => setRoundForm({ ...roundForm, round_type: e.target.value })}>
                    {ROUND_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Round Number</label>
                  <input type="number" min="1" value={roundForm.round_number} onChange={(e) => setRoundForm({ ...roundForm, round_number: parseInt(e.target.value) || 1 })} />
                </div>
                <div className="form-group">
                  <label>Custom Name (optional)</label>
                  <input type="text" value={roundForm.round_name} onChange={(e) => setRoundForm({ ...roundForm, round_name: e.target.value })} placeholder="e.g., Heat 3A" />
                </div>
                <div className="form-group">
                  <label>Start Time (your local time)</label>
                  <input type="datetime-local" value={roundForm.start_time_utc} onChange={(e) => setRoundForm({ ...roundForm, start_time_utc: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Venue (optional)</label>
                  <input type="text" value={roundForm.venue} onChange={(e) => setRoundForm({ ...roundForm, venue: e.target.value })} placeholder="Override event venue" />
                </div>
              </div>
              <button type="submit" className="btn btn-primary">Add Round</button>
            </form>
            <div className={styles.list}>
              {rounds.map((r) => (
                <div key={r.id} className={styles.eventItem}>
                  <div className={styles.eventInfo}>
                    <span className={styles.name}>
                      {r.round_name || `${ROUND_TYPES.find(t => t.value === r.round_type)?.label || r.round_type}${r.round_number > 1 ? ` ${r.round_number}` : ''}`}
                    </span>
                    <span className={styles.sport}>{r.medal_event_name}</span>
                    <span className={styles.meta}>{new Date(r.start_time_utc).toLocaleString()}</span>
                  </div>
                  <div className={styles.eventActions}>
                    <select value={r.status} onChange={(e) => handleUpdateRoundStatus(r.id, e.target.value)} className={styles.statusSelect}>
                      <option value="scheduled">Scheduled</option>
                      <option value="delayed">Delayed</option>
                      <option value="live">Live</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <button onClick={() => handleDeleteRound(r.id)} className="btn btn-danger">Delete</button>
                  </div>
                </div>
              ))}
              {rounds.length === 0 && <p className={styles.empty}>No rounds added yet. Create medal events first.</p>}
            </div>
          </div>
        )}

        {/* MATCHES TAB */}
        {activeTab === 'matches' && (
          <div className={styles.section}>
            <h2>Manage Matches</h2>
            <p className={styles.hint}>Add individual matches within rounds (e.g., USA vs Canada in curling round robin).</p>
            <form onSubmit={handleAddMatch} className={styles.form}>
              <div className={styles.formGrid}>
                <div className="form-group">
                  <label>Round</label>
                  <select value={matchForm.event_round_id} onChange={(e) => setMatchForm({ ...matchForm, event_round_id: e.target.value })} required>
                    <option value="">Select Round</option>
                    {rounds.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.medal_event_name} - {ROUND_TYPES.find(t => t.value === r.round_type)?.label || r.round_type}
                        {r.round_number > 1 ? ` ${r.round_number}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Match Name (optional)</label>
                  <input type="text" value={matchForm.match_name} onChange={(e) => setMatchForm({ ...matchForm, match_name: e.target.value })} placeholder="e.g., Match 1, Pool A" />
                </div>
                <div className="form-group">
                  <label>Team A Country</label>
                  <select value={matchForm.team_a_country_id} onChange={(e) => setMatchForm({ ...matchForm, team_a_country_id: e.target.value })}>
                    <option value="">Select Country</option>
                    {countries.map((c) => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Team A Name (optional)</label>
                  <input type="text" value={matchForm.team_a_name} onChange={(e) => setMatchForm({ ...matchForm, team_a_name: e.target.value })} placeholder="e.g., Team Smith" />
                </div>
                <div className="form-group">
                  <label>Team B Country</label>
                  <select value={matchForm.team_b_country_id} onChange={(e) => setMatchForm({ ...matchForm, team_b_country_id: e.target.value })}>
                    <option value="">Select Country</option>
                    {countries.map((c) => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Team B Name (optional)</label>
                  <input type="text" value={matchForm.team_b_name} onChange={(e) => setMatchForm({ ...matchForm, team_b_name: e.target.value })} placeholder="e.g., Team Jones" />
                </div>
                <div className="form-group">
                  <label>Start Time (optional)</label>
                  <input type="datetime-local" value={matchForm.start_time_utc} onChange={(e) => setMatchForm({ ...matchForm, start_time_utc: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Notes (optional)</label>
                  <input type="text" value={matchForm.notes} onChange={(e) => setMatchForm({ ...matchForm, notes: e.target.value })} placeholder="e.g., Sheet A" />
                </div>
              </div>
              <button type="submit" className="btn btn-primary">Add Match</button>
            </form>
            <div className={styles.list}>
              {matches.map((m) => (
                <div key={m.id} className={styles.matchItem}>
                  <div className={styles.matchTeams}>
                    <div className={styles.matchTeam}>
                      {m.team_a_flag_url && <img src={m.team_a_flag_url} alt={m.team_a_country_code} className={styles.flagPreview} />}
                      <span>{m.team_a_country_code || m.team_a_name || 'TBD'}</span>
                      <input
                        type="text"
                        value={m.team_a_score || ''}
                        onChange={(e) => handleUpdateMatchScore(m.id, e.target.value, m.team_b_score, m.winner_country_id, m.status)}
                        className={styles.scoreInput}
                        placeholder="0"
                      />
                    </div>
                    <span className={styles.vs}>vs</span>
                    <div className={styles.matchTeam}>
                      <input
                        type="text"
                        value={m.team_b_score || ''}
                        onChange={(e) => handleUpdateMatchScore(m.id, m.team_a_score, e.target.value, m.winner_country_id, m.status)}
                        className={styles.scoreInput}
                        placeholder="0"
                      />
                      <span>{m.team_b_country_code || m.team_b_name || 'TBD'}</span>
                      {m.team_b_flag_url && <img src={m.team_b_flag_url} alt={m.team_b_country_code} className={styles.flagPreview} />}
                    </div>
                  </div>
                  <div className={styles.matchInfo}>
                    <span className={styles.matchRound}>{m.medal_event_name} - {m.round_type}</span>
                    {m.match_name && <span className={styles.matchName}>{m.match_name}</span>}
                  </div>
                  <div className={styles.eventActions}>
                    <select
                      value={m.status}
                      onChange={(e) => handleUpdateMatchScore(m.id, m.team_a_score, m.team_b_score, m.winner_country_id, e.target.value)}
                      className={styles.statusSelect}
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="live">Live</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <button onClick={() => handleDeleteMatch(m.id)} className="btn btn-danger">Delete</button>
                  </div>
                </div>
              ))}
              {matches.length === 0 && <p className={styles.empty}>No matches added yet. Create rounds first, then add matches within them.</p>}
            </div>
          </div>
        )}

        {/* MEDALS TAB */}
        {activeTab === 'medals' && (
          <div className={styles.section}>
            <h2>Award Medals</h2>
            <form onSubmit={handleAwardMedal} className={styles.form}>
              <div className={styles.formGrid}>
                <div className="form-group">
                  <label>Medal Event</label>
                  <select value={medalForm.medal_event_id} onChange={(e) => setMedalForm({ ...medalForm, medal_event_id: e.target.value })} required>
                    <option value="">Select Medal Event</option>
                    {medalEvents.map((e) => <option key={e.id} value={e.id}>{e.sport_name}: {e.gender === 'men' ? "M" : e.gender === 'women' ? "W" : ""} {e.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Country</label>
                  <select value={medalForm.country_id} onChange={(e) => setMedalForm({ ...medalForm, country_id: e.target.value })} required>
                    <option value="">Select Country</option>
                    {countries.map((c) => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Athlete/Team Name</label>
                  <input type="text" value={medalForm.athlete_name} onChange={(e) => setMedalForm({ ...medalForm, athlete_name: e.target.value })} placeholder="e.g., Michael Phelps" required />
                </div>
                <div className="form-group">
                  <label>Medal</label>
                  <select value={medalForm.medal_type} onChange={(e) => setMedalForm({ ...medalForm, medal_type: e.target.value })}>
                    <option value="gold">Gold</option>
                    <option value="silver">Silver</option>
                    <option value="bronze">Bronze</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Result (optional)</label>
                  <input type="text" value={medalForm.result_value} onChange={(e) => setMedalForm({ ...medalForm, result_value: e.target.value })} placeholder="e.g., 47.52s" />
                </div>
                <div className="form-group">
                  <label>Record (optional)</label>
                  <select value={medalForm.record_type} onChange={(e) => setMedalForm({ ...medalForm, record_type: e.target.value })}>
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
                    <span className={styles.details}>{m.country_code} · {m.event_name} {m.record_type && <strong>({m.record_type})</strong>}</span>
                    {m.result_value && <span className={styles.result}>{m.result_value}</span>}
                  </div>
                  <button onClick={() => handleDeleteMedal(m.id)} className="btn btn-danger">Remove</button>
                </div>
              ))}
              {medals.length === 0 && <p className={styles.empty}>No medals awarded yet.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Admin;
