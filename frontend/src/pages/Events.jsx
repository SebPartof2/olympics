import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useOlympics } from '../context/OlympicsContext';
import styles from './Events.module.css';

function Events() {
  const { selectedOlympics, selectedOlympicsId, isLoading: olympicsLoading } = useOlympics();
  const [medalEvents, setMedalEvents] = useState([]);
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sportFilter, setSportFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!olympicsLoading && selectedOlympicsId) {
      loadData();
    }
  }, [selectedOlympicsId, olympicsLoading]);

  async function loadData() {
    try {
      setLoading(true);
      const [eventsData, sportsData] = await Promise.all([
        api.getMedalEvents({ olympics: selectedOlympicsId }),
        api.getSports(),
      ]);
      setMedalEvents(eventsData);
      setSports(sportsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function getGenderLabel(gender) {
    const labels = {
      men: "Men's",
      women: "Women's",
      mixed: 'Mixed',
    };
    return labels[gender] || gender;
  }

  function getMedalStatus(event) {
    if (event.medal_count >= 3) return 'completed';
    if (event.medal_count > 0) return 'in-progress';
    return 'upcoming';
  }

  // Filter events
  const filteredEvents = medalEvents.filter((event) => {
    if (sportFilter && event.sport_id !== parseInt(sportFilter)) return false;
    if (genderFilter && event.gender !== genderFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = event.name.toLowerCase().includes(query);
      const matchesSport = event.sport_name?.toLowerCase().includes(query);
      if (!matchesName && !matchesSport) return false;
    }
    return true;
  });

  // Group by sport
  const groupedEvents = filteredEvents.reduce((groups, event) => {
    const sportName = event.sport_name || 'Other';
    if (!groups[sportName]) {
      groups[sportName] = [];
    }
    groups[sportName].push(event);
    return groups;
  }, {});

  // Sort sports alphabetically
  const sortedSports = Object.keys(groupedEvents).sort();

  if (loading || olympicsLoading) {
    return <div className="loading"></div>;
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">Error loading events: {error}</div>
      </div>
    );
  }

  const totalMedals = medalEvents.reduce((sum, e) => sum + (e.medal_count || 0), 0);
  const completedEvents = medalEvents.filter(e => e.medal_count >= 3).length;

  return (
    <div className="container">
      <header className={styles.header}>
        <h1>Medal Events</h1>
        <p>{selectedOlympics?.name || 'Olympics'} - Browse all events by sport</p>
      </header>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statNumber}>{medalEvents.length}</span>
          <span className={styles.statLabel}>Total Events</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statNumber}>{completedEvents}</span>
          <span className={styles.statLabel}>Completed</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statNumber}>{totalMedals}</span>
          <span className={styles.statLabel}>Medals Awarded</span>
        </div>
      </div>

      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Search events..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />

        <select
          value={sportFilter}
          onChange={(e) => setSportFilter(e.target.value)}
          className={styles.filter}
        >
          <option value="">All Sports</option>
          {sports.map((sport) => (
            <option key={sport.id} value={sport.id}>
              {sport.name}
            </option>
          ))}
        </select>

        <select
          value={genderFilter}
          onChange={(e) => setGenderFilter(e.target.value)}
          className={styles.filter}
        >
          <option value="">All Genders</option>
          <option value="men">Men's</option>
          <option value="women">Women's</option>
          <option value="mixed">Mixed</option>
        </select>
      </div>

      <div className={styles.eventsContainer}>
        {sortedSports.length > 0 ? (
          sortedSports.map((sportName) => (
            <div key={sportName} className={styles.sportGroup}>
              <h2 className={styles.sportHeader}>
                {groupedEvents[sportName][0]?.sport_icon_url && (
                  <img
                    src={groupedEvents[sportName][0].sport_icon_url}
                    alt={sportName}
                    className={styles.sportIcon}
                  />
                )}
                {sportName}
                <span className={styles.eventCount}>
                  {groupedEvents[sportName].length} events
                </span>
              </h2>
              <div className={styles.eventsList}>
                {groupedEvents[sportName].map((event) => {
                  const status = getMedalStatus(event);
                  return (
                    <Link key={event.id} to={`/events/${event.id}`} className={`${styles.eventCard} ${styles[status]}`}>
                      <div className={styles.eventInfo}>
                        <div className={styles.eventName}>
                          {getGenderLabel(event.gender)} {event.name}
                        </div>
                        <div className={styles.eventMeta}>
                          {event.venue && (
                            <span className={styles.venue}>{event.venue}</span>
                          )}
                          {event.scheduled_date && (
                            <span className={styles.date}>
                              {new Date(event.scheduled_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={styles.eventStats}>
                        <span className={styles.roundCount}>
                          {event.round_count || 0} rounds
                        </span>
                        <div className={styles.medalIndicators}>
                          {event.medal_count >= 1 && <span className={`${styles.medalDot} ${styles.gold}`} title="Gold awarded"></span>}
                          {event.medal_count >= 2 && <span className={`${styles.medalDot} ${styles.silver}`} title="Silver awarded"></span>}
                          {event.medal_count >= 3 && <span className={`${styles.medalDot} ${styles.bronze}`} title="Bronze awarded"></span>}
                          {event.medal_count === 0 && <span className={styles.noMedals}>No medals yet</span>}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="card">
            <p className={styles.empty}>
              {medalEvents.length === 0
                ? 'No medal events created yet. Visit the Admin panel to add events.'
                : 'No events match the selected filters.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Events;
