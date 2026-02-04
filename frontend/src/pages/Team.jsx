import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { formatLocalTime, formatLocalDate } from '../services/api';
import { useOlympics } from '../context/OlympicsContext';
import styles from './Team.module.css';

function formatEventName(name, gender) {
  if (!gender) return name;
  const prefixes = { men: "Men's", women: "Women's", mixed: "Mixed" };
  const prefix = prefixes[gender];
  return prefix ? `${prefix} ${name}` : name;
}

function Team() {
  const { countryCode } = useParams();
  const { selectedOlympics, selectedOlympicsId, isLoading: olympicsLoading } = useOlympics();
  const [country, setCountry] = useState(null);
  const [matches, setMatches] = useState([]);
  const [participatingEvents, setParticipatingEvents] = useState([]);
  const [medals, setMedals] = useState({ gold: 0, silver: 0, bronze: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (!olympicsLoading && countryCode) {
      loadData();
    }
  }, [countryCode, selectedOlympicsId, olympicsLoading]);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      // Get country info
      const countries = await api.getCountries();
      const foundCountry = countries.find(
        c => c.code.toLowerCase() === countryCode.toLowerCase()
      );

      if (!foundCountry) {
        setError('Country not found');
        setLoading(false);
        return;
      }

      setCountry(foundCountry);

      // Get matches, medals, and event participations in parallel
      const [matchesData, medalsData, participantsData] = await Promise.all([
        api.getMatches(selectedOlympicsId ? { olympics_id: selectedOlympicsId } : {}),
        api.getMedalStandings(selectedOlympicsId),
        api.getEventParticipants({ country: foundCountry.id, olympics: selectedOlympicsId }),
      ]);

      // Filter matches involving this country
      const countryMatches = matchesData.filter(
        m => m.team_a_country_id === foundCountry.id || m.team_b_country_id === foundCountry.id
      );

      // Sort by start time
      countryMatches.sort((a, b) => {
        if (!a.start_time_utc) return 1;
        if (!b.start_time_utc) return -1;
        return new Date(a.start_time_utc) - new Date(b.start_time_utc);
      });

      setMatches(countryMatches);

      // Get event IDs that have matches
      const eventIdsWithMatches = new Set(countryMatches.map(m => m.medal_event_id).filter(Boolean));

      // Filter participating events that don't have matches
      const eventsWithoutMatches = participantsData.filter(
        p => !eventIdsWithMatches.has(p.medal_event_id)
      );
      setParticipatingEvents(eventsWithoutMatches);

      // Find medal count for this country
      const countryMedals = medalsData.find(m => m.country_id === foundCountry.id);
      if (countryMedals) {
        setMedals({
          gold: countryMedals.gold || 0,
          silver: countryMedals.silver || 0,
          bronze: countryMedals.bronze || 0,
          total: countryMedals.total || 0,
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Filter matches by tab
  const filteredMatches = matches.filter(m => {
    if (activeTab === 'all') return true;
    if (activeTab === 'live') return m.status === 'live';
    if (activeTab === 'upcoming') return m.status === 'scheduled';
    if (activeTab === 'results') return m.status === 'completed';
    return true;
  });

  // Group matches by date
  const matchesByDate = filteredMatches.reduce((groups, match) => {
    const date = match.start_time_utc
      ? formatLocalDate(match.start_time_utc)
      : 'Date TBD';
    if (!groups[date]) groups[date] = [];
    groups[date].push(match);
    return groups;
  }, {});

  // Count by status
  const statusCounts = {
    all: matches.length,
    live: matches.filter(m => m.status === 'live').length,
    upcoming: matches.filter(m => m.status === 'scheduled').length,
    results: matches.filter(m => m.status === 'completed').length,
    events: participatingEvents.length,
  };

  function isWinner(match, countryId) {
    if (match.status !== 'completed') return false;
    return match.winner_country_id === countryId;
  }

  function getMatchResult(match, countryId) {
    if (match.status !== 'completed') return null;
    if (match.winner_country_id === countryId) return 'win';
    if (match.winner_country_id && match.winner_country_id !== countryId) return 'loss';
    return 'draw';
  }

  if (loading || olympicsLoading) {
    return <div className="loading"></div>;
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">Error: {error}</div>
        <Link to="/medals" className={styles.backLink}>← Back to Medal Standings</Link>
      </div>
    );
  }

  if (!country) {
    return (
      <div className="container">
        <div className="error">Country not found</div>
        <Link to="/medals" className={styles.backLink}>← Back to Medal Standings</Link>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Country Header */}
      <header className={styles.header}>
        <div className={styles.countryInfo}>
          {country.flag_url && (
            <img src={country.flag_url} alt={country.name} className={styles.flag} />
          )}
          <div>
            <h1>{country.name}</h1>
            <span className={styles.countryCode}>{country.code}</span>
          </div>
        </div>

        {/* Medal Summary */}
        <div className={styles.medalSummary}>
          <div className={styles.medalBox}>
            <span className="medal medal-gold">G</span>
            <span className={styles.medalCount}>{medals.gold}</span>
          </div>
          <div className={styles.medalBox}>
            <span className="medal medal-silver">S</span>
            <span className={styles.medalCount}>{medals.silver}</span>
          </div>
          <div className={styles.medalBox}>
            <span className="medal medal-bronze">B</span>
            <span className={styles.medalCount}>{medals.bronze}</span>
          </div>
          <div className={styles.medalBoxTotal}>
            <span className={styles.totalLabel}>Total</span>
            <span className={styles.medalCount}>{medals.total}</span>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'all' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All <span className={styles.tabCount}>{statusCounts.all}</span>
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'live' ? styles.activeTab : ''} ${statusCounts.live > 0 ? styles.liveTab : ''}`}
          onClick={() => setActiveTab('live')}
        >
          Live <span className={styles.tabCount}>{statusCounts.live}</span>
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'upcoming' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('upcoming')}
        >
          Upcoming <span className={styles.tabCount}>{statusCounts.upcoming}</span>
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'results' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('results')}
        >
          Results <span className={styles.tabCount}>{statusCounts.results}</span>
        </button>
        {participatingEvents.length > 0 && (
          <button
            className={`${styles.tab} ${activeTab === 'events' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('events')}
          >
            Events <span className={styles.tabCount}>{statusCounts.events}</span>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="card">
        {activeTab === 'events' ? (
          // Events tab - show participating events without matches
          <div className={styles.eventsList}>
            <p className={styles.eventsHint}>
              Events {country.name} is registered for (no match schedule yet):
            </p>
            {participatingEvents.map(event => (
              <Link
                key={event.id}
                to={`/events/${event.medal_event_id}`}
                className={styles.eventCard}
              >
                <span className={styles.eventSport}>{event.sport_name}</span>
                <span className={styles.eventTitle}>
                  {formatEventName(event.medal_event_name, event.gender)}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          // Matches tabs
          Object.keys(matchesByDate).length > 0 ? (
            Object.entries(matchesByDate).map(([date, dateMatches]) => (
              <div key={date} className={styles.dateGroup}>
                <h3 className={styles.dateHeader}>{date}</h3>
                <div className={styles.matchesList}>
                  {dateMatches.map(match => {
                    const isTeamA = match.team_a_country_id === country.id;
                    const result = getMatchResult(match, country.id);

                    return (
                      <div
                        key={match.id}
                        className={`${styles.matchCard} ${styles[match.status]} ${result ? styles[result] : ''}`}
                      >
                        {match.status === 'live' && (
                          <span className={styles.liveIndicator}>LIVE</span>
                        )}

                        <div className={styles.matchMeta}>
                          <span className={styles.sportName}>{match.sport_name}</span>
                          <span className={styles.eventName}>
                            {formatEventName(match.medal_event_name, match.gender)}
                          </span>
                          {match.round_name && (
                            <span className={styles.roundName}>{match.round_name}</span>
                          )}
                          {match.match_name && (
                            <span className={styles.matchName}>{match.match_name}</span>
                          )}
                        </div>

                        <div className={styles.matchContent}>
                          {/* Team A */}
                          <div className={`${styles.team} ${isTeamA ? styles.highlight : ''} ${match.winner_country_id === match.team_a_country_id ? styles.winner : ''}`}>
                            {match.team_a_flag_url && (
                              <img src={match.team_a_flag_url} alt="" className={styles.teamFlag} />
                            )}
                            <span className={styles.teamName}>
                              {match.team_a_country_code || match.team_a_name || 'TBD'}
                            </span>
                            <span className={styles.score}>
                              {match.team_a_score ?? '-'}
                            </span>
                          </div>

                          <span className={styles.vs}>vs</span>

                          {/* Team B */}
                          <div className={`${styles.team} ${!isTeamA ? styles.highlight : ''} ${match.winner_country_id === match.team_b_country_id ? styles.winner : ''}`}>
                            <span className={styles.score}>
                              {match.team_b_score ?? '-'}
                            </span>
                            <span className={styles.teamName}>
                              {match.team_b_country_code || match.team_b_name || 'TBD'}
                            </span>
                            {match.team_b_flag_url && (
                              <img src={match.team_b_flag_url} alt="" className={styles.teamFlag} />
                            )}
                          </div>
                        </div>

                        <div className={styles.matchFooter}>
                          {match.start_time_utc && (
                            <span className={styles.matchTime}>
                              {formatLocalTime(match.start_time_utc).split(',').pop().trim()}
                            </span>
                          )}
                          {result && (
                            <span className={`${styles.resultBadge} ${styles[result]}`}>
                              {result.toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <p className={styles.empty}>
              {matches.length === 0
                ? participatingEvents.length > 0
                  ? `No matches scheduled for ${country.name} yet. Check the Events tab to see registered events.`
                  : `No matches scheduled for ${country.name} yet.`
                : 'No matches match the selected filter.'}
            </p>
          )
        )}
      </div>

      <Link to="/medals" className={styles.backLink}>← Back to Medal Standings</Link>
    </div>
  );
}

export default Team;
