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

function AdminParticipants() {
  const { selectedOlympicsId } = useOlympics();
  const { showMessage, MessageDisplay } = useAdminMessage();
  const [countries, setCountries] = useState([]);
  const [medalEvents, setMedalEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [participants, setParticipants] = useState([]);
  const [selectedCountries, setSelectedCountries] = useState(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, [selectedOlympicsId]);

  useEffect(() => {
    if (selectedEventId) {
      loadParticipants();
    } else {
      setParticipants([]);
      setSelectedCountries(new Set());
    }
  }, [selectedEventId]);

  async function loadInitialData() {
    try {
      const [countriesData, eventsData] = await Promise.all([
        api.getCountries(),
        api.getMedalEvents(selectedOlympicsId ? { olympics: selectedOlympicsId } : {}),
      ]);
      setCountries(countriesData);
      setMedalEvents(eventsData);
    } catch (err) {
      showMessage('error', 'Failed to load data: ' + err.message);
    }
  }

  async function loadParticipants() {
    if (!selectedEventId) return;
    try {
      setLoading(true);
      const data = await api.getMedalEventParticipants(selectedEventId);
      setParticipants(data);
      setSelectedCountries(new Set(data.map(p => p.country_id)));
    } catch (err) {
      showMessage('error', 'Failed to load participants: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  function toggleCountry(countryId) {
    setSelectedCountries(prev => {
      const next = new Set(prev);
      if (next.has(countryId)) {
        next.delete(countryId);
      } else {
        next.add(countryId);
      }
      return next;
    });
  }

  function selectAll() {
    setSelectedCountries(new Set(countries.map(c => c.id)));
  }

  function clearAll() {
    setSelectedCountries(new Set());
  }

  async function handleSave() {
    if (!selectedEventId) {
      showMessage('error', 'Please select a medal event first');
      return;
    }
    try {
      setLoading(true);
      await api.setMedalEventParticipants(selectedEventId, Array.from(selectedCountries));
      showMessage('success', `Saved ${selectedCountries.size} participants`);
      loadParticipants();
    } catch (err) {
      showMessage('error', err.message);
    } finally {
      setLoading(false);
    }
  }

  const selectedEvent = medalEvents.find(e => e.id === parseInt(selectedEventId));
  const hasChanges = selectedEventId && (
    selectedCountries.size !== participants.length ||
    !participants.every(p => selectedCountries.has(p.country_id))
  );

  return (
    <div className={styles.section}>
      <h2>Manage Event Participants</h2>
      <p className={styles.hint}>
        Specify which countries are competing in each medal event. This is shown when no matches are defined for a round.
      </p>
      <MessageDisplay />

      {/* Event Selector */}
      <div className={styles.filterBar}>
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">Select Medal Event</option>
          {medalEvents.map((e) => (
            <option key={e.id} value={e.id}>
              {e.sport_name}: {formatEventName(e.name, e.gender)}
            </option>
          ))}
        </select>
        {selectedEvent && (
          <span className={styles.matchCount}>
            {selectedCountries.size} countries selected
          </span>
        )}
      </div>

      {selectedEventId ? (
        <>
          {/* Quick Actions */}
          <div className={styles.participantActions}>
            <button type="button" className="btn" onClick={selectAll}>
              Select All
            </button>
            <button type="button" className="btn" onClick={clearAll}>
              Clear All
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={loading || !hasChanges}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {/* Countries Grid */}
          <div className={styles.countriesGrid}>
            {countries.map((country) => {
              const isSelected = selectedCountries.has(country.id);
              return (
                <label
                  key={country.id}
                  className={`${styles.countryCheckbox} ${isSelected ? styles.selected : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleCountry(country.id)}
                  />
                  {country.flag_url && (
                    <img src={country.flag_url} alt="" className={styles.flagSmall} />
                  )}
                  <span className={styles.countryCode}>{country.code}</span>
                  <span className={styles.countryName}>{country.name}</span>
                </label>
              );
            })}
          </div>

          {countries.length === 0 && (
            <p className={styles.empty}>No countries added yet. Add countries first.</p>
          )}
        </>
      ) : (
        <p className={styles.empty}>Select a medal event above to manage its participants.</p>
      )}
    </div>
  );
}

export default AdminParticipants;
