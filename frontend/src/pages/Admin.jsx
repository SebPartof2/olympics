import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import styles from './Admin.module.css';

function Admin() {
  const { isAuthenticated, isLoading, login, logout } = useAuth();
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('countries');

  // Data states
  const [countries, setCountries] = useState([]);
  const [sports, setSports] = useState([]);
  const [events, setEvents] = useState([]);
  const [medals, setMedals] = useState([]);

  // Form states
  const [countryForm, setCountryForm] = useState({ name: '', code: '' });
  const [sportForm, setSportForm] = useState({ name: '' });
  const [eventForm, setEventForm] = useState({
    sport_id: '',
    name: '',
    event_date: '',
    venue: '',
    status: 'scheduled',
  });
  const [medalForm, setMedalForm] = useState({
    event_id: '',
    country_id: '',
    athlete_name: '',
    medal_type: 'gold',
  });
  const [resultForm, setResultForm] = useState({
    event_id: '',
    country_id: '',
    athlete_name: '',
    score: '',
    position: '',
  });

  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    }
  }, [isAuthenticated]);

  async function loadAllData() {
    try {
      const [countriesData, sportsData, eventsData, medalsData] = await Promise.all([
        api.getCountries(),
        api.getSports(),
        api.getEvents(),
        api.getAllMedals(),
      ]);
      setCountries(countriesData);
      setSports(sportsData);
      setEvents(eventsData);
      setMedals(medalsData);
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
    if (!success) {
      setLoginError('Invalid password');
    }
    setPassword('');
  }

  async function handleAddCountry(e) {
    e.preventDefault();
    try {
      await api.addCountry(countryForm);
      setCountryForm({ name: '', code: '' });
      loadAllData();
      showMessage('success', 'Country added successfully');
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

  async function handleAddSport(e) {
    e.preventDefault();
    try {
      await api.addSport(sportForm);
      setSportForm({ name: '' });
      loadAllData();
      showMessage('success', 'Sport added successfully');
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

  async function handleAddEvent(e) {
    e.preventDefault();
    try {
      await api.addEvent(eventForm);
      setEventForm({
        sport_id: '',
        name: '',
        event_date: '',
        venue: '',
        status: 'scheduled',
      });
      loadAllData();
      showMessage('success', 'Event added successfully');
    } catch (err) {
      showMessage('error', err.message);
    }
  }

  async function handleUpdateEventStatus(id, status) {
    try {
      const event = events.find((e) => e.id === id);
      await api.updateEvent(id, { ...event, status });
      loadAllData();
      showMessage('success', 'Event status updated');
    } catch (err) {
      showMessage('error', err.message);
    }
  }

  async function handleDeleteEvent(id) {
    if (!confirm('Delete this event?')) return;
    try {
      await api.deleteEvent(id);
      loadAllData();
      showMessage('success', 'Event deleted');
    } catch (err) {
      showMessage('error', err.message);
    }
  }

  async function handleAwardMedal(e) {
    e.preventDefault();
    try {
      await api.awardMedal(medalForm);
      setMedalForm({
        event_id: '',
        country_id: '',
        athlete_name: '',
        medal_type: 'gold',
      });
      loadAllData();
      showMessage('success', 'Medal awarded successfully');
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

  async function handleAddResult(e) {
    e.preventDefault();
    try {
      await api.addResult(resultForm);
      setResultForm({
        event_id: '',
        country_id: '',
        athlete_name: '',
        score: '',
        position: '',
      });
      showMessage('success', 'Result added successfully');
    } catch (err) {
      showMessage('error', err.message);
    }
  }

  if (isLoading) {
    return <div className="loading"></div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="container">
        <div className={styles.loginContainer}>
          <h1>Admin Login</h1>
          <p>Enter the admin password to manage Olympics data.</p>
          <form onSubmit={handleLogin} className={styles.loginForm}>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                required
              />
            </div>
            {loginError && <p className={styles.loginError}>{loginError}</p>}
            <button type="submit" className="btn btn-primary">
              Login
            </button>
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
        <button onClick={logout} className="btn btn-secondary">
          Logout
        </button>
      </header>

      {message.text && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <div className={styles.tabs}>
        {['countries', 'sports', 'events', 'medals', 'results'].map((tab) => (
          <button
            key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {activeTab === 'countries' && (
          <div className={styles.section}>
            <h2>Manage Countries</h2>
            <form onSubmit={handleAddCountry} className={styles.form}>
              <div className={styles.formRow}>
                <div className="form-group">
                  <label>Country Name</label>
                  <input
                    type="text"
                    value={countryForm.name}
                    onChange={(e) =>
                      setCountryForm({ ...countryForm, name: e.target.value })
                    }
                    placeholder="e.g., United States"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Country Code (3 letters)</label>
                  <input
                    type="text"
                    value={countryForm.code}
                    onChange={(e) =>
                      setCountryForm({ ...countryForm, code: e.target.value.toUpperCase() })
                    }
                    placeholder="e.g., USA"
                    maxLength={3}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary">
                  Add Country
                </button>
              </div>
            </form>

            <div className={styles.list}>
              {countries.map((country) => (
                <div key={country.id} className={styles.listItem}>
                  <span className={styles.code}>{country.code}</span>
                  <span className={styles.name}>{country.name}</span>
                  <button
                    onClick={() => handleDeleteCountry(country.id)}
                    className="btn btn-danger"
                  >
                    Delete
                  </button>
                </div>
              ))}
              {countries.length === 0 && (
                <p className={styles.empty}>No countries added yet.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'sports' && (
          <div className={styles.section}>
            <h2>Manage Sports</h2>
            <form onSubmit={handleAddSport} className={styles.form}>
              <div className={styles.formRow}>
                <div className="form-group">
                  <label>Sport Name</label>
                  <input
                    type="text"
                    value={sportForm.name}
                    onChange={(e) => setSportForm({ name: e.target.value })}
                    placeholder="e.g., Swimming"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary">
                  Add Sport
                </button>
              </div>
            </form>

            <div className={styles.list}>
              {sports.map((sport) => (
                <div key={sport.id} className={styles.listItem}>
                  <span className={styles.name}>{sport.name}</span>
                  <button
                    onClick={() => handleDeleteSport(sport.id)}
                    className="btn btn-danger"
                  >
                    Delete
                  </button>
                </div>
              ))}
              {sports.length === 0 && (
                <p className={styles.empty}>No sports added yet.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div className={styles.section}>
            <h2>Manage Events</h2>
            <form onSubmit={handleAddEvent} className={styles.form}>
              <div className={styles.formGrid}>
                <div className="form-group">
                  <label>Sport</label>
                  <select
                    value={eventForm.sport_id}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, sport_id: e.target.value })
                    }
                  >
                    <option value="">Select Sport</option>
                    {sports.map((sport) => (
                      <option key={sport.id} value={sport.id}>
                        {sport.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Event Name</label>
                  <input
                    type="text"
                    value={eventForm.name}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, name: e.target.value })
                    }
                    placeholder="e.g., Men's 100m Freestyle"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Date & Time</label>
                  <input
                    type="datetime-local"
                    value={eventForm.event_date}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, event_date: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Venue</label>
                  <input
                    type="text"
                    value={eventForm.venue}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, venue: e.target.value })
                    }
                    placeholder="e.g., Olympic Aquatics Centre"
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary">
                Add Event
              </button>
            </form>

            <div className={styles.list}>
              {events.map((event) => (
                <div key={event.id} className={styles.eventItem}>
                  <div className={styles.eventInfo}>
                    <span className={styles.name}>{event.name}</span>
                    {event.sport_name && (
                      <span className={styles.sport}>{event.sport_name}</span>
                    )}
                    {event.venue && (
                      <span className={styles.venue}>{event.venue}</span>
                    )}
                  </div>
                  <div className={styles.eventActions}>
                    <select
                      value={event.status}
                      onChange={(e) =>
                        handleUpdateEventStatus(event.id, e.target.value)
                      }
                      className={styles.statusSelect}
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="live">Live</option>
                      <option value="completed">Completed</option>
                    </select>
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="btn btn-danger"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {events.length === 0 && (
                <p className={styles.empty}>No events added yet.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'medals' && (
          <div className={styles.section}>
            <h2>Award Medals</h2>
            <form onSubmit={handleAwardMedal} className={styles.form}>
              <div className={styles.formGrid}>
                <div className="form-group">
                  <label>Event</label>
                  <select
                    value={medalForm.event_id}
                    onChange={(e) =>
                      setMedalForm({ ...medalForm, event_id: e.target.value })
                    }
                    required
                  >
                    <option value="">Select Event</option>
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Country</label>
                  <select
                    value={medalForm.country_id}
                    onChange={(e) =>
                      setMedalForm({ ...medalForm, country_id: e.target.value })
                    }
                    required
                  >
                    <option value="">Select Country</option>
                    {countries.map((country) => (
                      <option key={country.id} value={country.id}>
                        {country.code} - {country.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Athlete Name</label>
                  <input
                    type="text"
                    value={medalForm.athlete_name}
                    onChange={(e) =>
                      setMedalForm({ ...medalForm, athlete_name: e.target.value })
                    }
                    placeholder="e.g., Michael Phelps"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Medal Type</label>
                  <select
                    value={medalForm.medal_type}
                    onChange={(e) =>
                      setMedalForm({ ...medalForm, medal_type: e.target.value })
                    }
                  >
                    <option value="gold">Gold</option>
                    <option value="silver">Silver</option>
                    <option value="bronze">Bronze</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="btn btn-primary">
                Award Medal
              </button>
            </form>

            <div className={styles.list}>
              {medals.map((medal) => (
                <div key={medal.id} className={styles.medalItem}>
                  <span className={`medal medal-${medal.medal_type}`}>
                    {medal.medal_type.charAt(0).toUpperCase()}
                  </span>
                  <div className={styles.medalInfo}>
                    <span className={styles.name}>{medal.athlete_name}</span>
                    <span className={styles.details}>
                      {medal.country_code} - {medal.event_name}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteMedal(medal.id)}
                    className="btn btn-danger"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {medals.length === 0 && (
                <p className={styles.empty}>No medals awarded yet.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'results' && (
          <div className={styles.section}>
            <h2>Add Live Results</h2>
            <form onSubmit={handleAddResult} className={styles.form}>
              <div className={styles.formGrid}>
                <div className="form-group">
                  <label>Event</label>
                  <select
                    value={resultForm.event_id}
                    onChange={(e) =>
                      setResultForm({ ...resultForm, event_id: e.target.value })
                    }
                    required
                  >
                    <option value="">Select Event</option>
                    {events
                      .filter((e) => e.status === 'live')
                      .map((event) => (
                        <option key={event.id} value={event.id}>
                          {event.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Country</label>
                  <select
                    value={resultForm.country_id}
                    onChange={(e) =>
                      setResultForm({ ...resultForm, country_id: e.target.value })
                    }
                  >
                    <option value="">Select Country</option>
                    {countries.map((country) => (
                      <option key={country.id} value={country.id}>
                        {country.code} - {country.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Athlete Name</label>
                  <input
                    type="text"
                    value={resultForm.athlete_name}
                    onChange={(e) =>
                      setResultForm({ ...resultForm, athlete_name: e.target.value })
                    }
                    placeholder="Athlete or Team name"
                  />
                </div>
                <div className="form-group">
                  <label>Score/Time</label>
                  <input
                    type="text"
                    value={resultForm.score}
                    onChange={(e) =>
                      setResultForm({ ...resultForm, score: e.target.value })
                    }
                    placeholder="e.g., 47.52 or 3-2"
                  />
                </div>
                <div className="form-group">
                  <label>Position</label>
                  <input
                    type="number"
                    value={resultForm.position}
                    onChange={(e) =>
                      setResultForm({ ...resultForm, position: e.target.value })
                    }
                    placeholder="1, 2, 3..."
                    min="1"
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary">
                Add Result
              </button>
            </form>

            {events.filter((e) => e.status === 'live').length === 0 && (
              <p className={styles.hint}>
                Set an event status to "Live" in the Events tab to add results.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Admin;
