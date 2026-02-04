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

function Team() {
  const { countryCode } = useParams();
  const { selectedOlympics, selectedOlympicsId, isLoading: olympicsLoading } = useOlympics();
  const [country, setCountry] = useState(null);
  const [matches, setMatches] = useState([]);
  const [allMatches, setAllMatches] = useState([]);
  const [participatingEvents, setParticipatingEvents] = useState([]);
  const [participatingRounds, setParticipatingRounds] = useState([]);
  const [medals, setMedals] = useState({ gold: 0, silver: 0, bronze: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [expandedEvents, setExpandedEvents] = useState(new Set());

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

      // Get matches, medals, event participations, and schedule in parallel
      const [matchesData, medalsData, participantsData, scheduleData] = await Promise.all([
        api.getMatches(selectedOlympicsId ? { olympics_id: selectedOlympicsId } : {}),
        api.getMedalStandings(selectedOlympicsId),
        api.getEventParticipants({ country: foundCountry.id, olympics: selectedOlympicsId }),
        api.getSchedule(selectedOlympicsId ? { olympics: selectedOlympicsId } : {}),
      ]);

      // Store all matches for event view
      setAllMatches(matchesData);

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

      // Get event IDs that have country matches
      const eventIdsWithCountryMatches = new Set(countryMatches.map(m => m.medal_event_id).filter(Boolean));

      // Get medal event IDs the country participates in
      const participatingEventIds = new Set(participantsData.map(p => p.medal_event_id));

      // Filter rounds for events the country participates in (without direct matches)
      const countryRounds = scheduleData.filter(round => {
        // Only include rounds for events the country participates in
        if (!participatingEventIds.has(round.medal_event_id)) return false;
        // Exclude events where the country already has direct matches
        if (eventIdsWithCountryMatches.has(round.medal_event_id)) return false;
        return true;
      });

      // Sort rounds by start time
      countryRounds.sort((a, b) => {
        if (!a.start_time_utc) return 1;
        if (!b.start_time_utc) return -1;
        return new Date(a.start_time_utc) - new Date(b.start_time_utc);
      });

      setParticipatingRounds(countryRounds);

      // Filter participating events - only those without country's direct matches
      const eventsWithoutCountryMatches = participantsData.filter(
        p => !eventIdsWithCountryMatches.has(p.medal_event_id)
      );
      setParticipatingEvents(eventsWithoutCountryMatches);

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

  // Combine matches and rounds into schedule items
  const scheduleItems = [
    ...matches.map(m => ({ ...m, itemType: 'match' })),
    ...participatingRounds.map(r => ({ ...r, itemType: 'round' })),
  ];

  // Sort all items by start time
  scheduleItems.sort((a, b) => {
    if (!a.start_time_utc) return 1;
    if (!b.start_time_utc) return -1;
    return new Date(a.start_time_utc) - new Date(b.start_time_utc);
  });

  // Filter schedule items by tab
  const filteredItems = scheduleItems.filter(item => {
    if (activeTab === 'all') return true;
    if (activeTab === 'live') return item.status === 'live';
    if (activeTab === 'upcoming') return item.status === 'scheduled';
    if (activeTab === 'results') return item.status === 'completed';
    return true;
  });

  // Group items by date
  const itemsByDate = filteredItems.reduce((groups, item) => {
    const date = item.start_time_utc
      ? formatLocalDate(item.start_time_utc)
      : 'Date TBD';
    if (!groups[date]) groups[date] = [];
    groups[date].push(item);
    return groups;
  }, {});

  // Count by status (matches + rounds)
  const statusCounts = {
    all: scheduleItems.length,
    live: scheduleItems.filter(item => item.status === 'live').length,
    upcoming: scheduleItems.filter(item => item.status === 'scheduled').length,
    results: scheduleItems.filter(item => item.status === 'completed').length,
    events: participatingEvents.length,
  };

  function getRoundName(round) {
    if (round.round_name) return round.round_name;
    const label = ROUND_TYPES[round.round_type] || round.round_type;
    return round.round_number > 1 ? `${label} ${round.round_number}` : label;
  }

  function isWinner(match, countryId) {
    if (match.status !== 'completed') return false;
    return Number(match.winner_country_id) === Number(countryId);
  }

  function getMatchResult(match, countryId) {
    if (match.status !== 'completed') return null;
    const winnerId = match.winner_country_id ? Number(match.winner_country_id) : null;
    const ourId = Number(countryId);
    if (winnerId === ourId) return 'win';
    if (winnerId && winnerId !== ourId) return 'loss';
    return 'draw';
  }

  function toggleEvent(eventId) {
    setExpandedEvents(prev => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  }

  function getMatchesForEvent(medalEventId) {
    return allMatches
      .filter(m => m.medal_event_id === medalEventId)
      .sort((a, b) => {
        if (!a.start_time_utc) return 1;
        if (!b.start_time_utc) return -1;
        return new Date(a.start_time_utc) - new Date(b.start_time_utc);
      });
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
          // Events tab - show participating events with their matches
          <div className={styles.eventsList}>
            <p className={styles.eventsHint}>
              Events {country.name} is registered for:
            </p>
            {participatingEvents.map(event => {
              const eventMatches = getMatchesForEvent(event.medal_event_id);
              const hasMatches = eventMatches.length > 0;
              const isExpanded = expandedEvents.has(event.medal_event_id);

              return (
                <div key={event.id} className={styles.eventWrapper}>
                  <div
                    className={`${styles.eventCard} ${hasMatches ? styles.expandable : ''} ${isExpanded ? styles.expanded : ''}`}
                    onClick={() => hasMatches && toggleEvent(event.medal_event_id)}
                    role={hasMatches ? 'button' : undefined}
                  >
                    <span className={styles.eventSport}>{event.sport_name}</span>
                    <span className={styles.eventTitle}>
                      {formatEventName(event.medal_event_name, event.gender)}
                    </span>
                    {hasMatches && (
                      <span className={styles.eventMatchCount}>
                        {eventMatches.length} match{eventMatches.length !== 1 ? 'es' : ''}
                      </span>
                    )}
                    {hasMatches && (
                      <span className={`${styles.expandIcon} ${isExpanded ? styles.iconExpanded : ''}`}>
                        ▼
                      </span>
                    )}
                    {!hasMatches && (
                      <Link
                        to={`/events/${event.medal_event_id}`}
                        className={styles.eventLink}
                        onClick={(e) => e.stopPropagation()}
                      >
                        View Event →
                      </Link>
                    )}
                  </div>

                  {isExpanded && hasMatches && (
                    <div className={styles.eventMatchesPanel}>
                      {eventMatches.map(match => {
                        const involvesCountry = match.team_a_country_id === country.id || match.team_b_country_id === country.id;
                        const isTeamA = match.team_a_country_id === country.id;
                        const result = involvesCountry ? getMatchResult(match, country.id) : null;

                        return (
                          <div
                            key={match.id}
                            className={`${styles.eventMatchCard} ${involvesCountry ? styles.highlighted : ''} ${result ? styles[result] : ''}`}
                          >
                            {match.status === 'live' && (
                              <span className={styles.liveIndicator}>LIVE</span>
                            )}
                            <div className={styles.eventMatchHeader}>
                              {match.round_name && <span>{match.round_name}</span>}
                              {match.match_name && <span>{match.match_name}</span>}
                              {match.start_time_utc && (
                                <span className={styles.matchTime}>
                                  {formatLocalTime(match.start_time_utc).split(',').pop().trim()}
                                </span>
                              )}
                            </div>
                            <div className={styles.eventMatchTeams}>
                              <div className={`${styles.eventTeam} ${match.winner_country_id && Number(match.winner_country_id) === Number(match.team_a_country_id) ? styles.winner : ''}`}>
                                {match.team_a_flag_url && (
                                  <img src={match.team_a_flag_url} alt="" className={styles.teamFlag} />
                                )}
                                <span className={isTeamA ? styles.ourTeam : ''}>
                                  {match.team_a_country_code || match.team_a_name || 'TBD'}
                                </span>
                                <span className={styles.eventScore}>{match.team_a_score ?? '-'}</span>
                              </div>
                              <span className={styles.eventVs}>vs</span>
                              <div className={`${styles.eventTeam} ${match.winner_country_id && Number(match.winner_country_id) === Number(match.team_b_country_id) ? styles.winner : ''}`}>
                                <span className={styles.eventScore}>{match.team_b_score ?? '-'}</span>
                                <span className={!isTeamA && involvesCountry ? styles.ourTeam : ''}>
                                  {match.team_b_country_code || match.team_b_name || 'TBD'}
                                </span>
                                {match.team_b_flag_url && (
                                  <img src={match.team_b_flag_url} alt="" className={styles.teamFlag} />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <Link to={`/events/${event.medal_event_id}`} className={styles.viewFullEvent}>
                        View full event details →
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          // Schedule tabs (matches + rounds)
          Object.keys(itemsByDate).length > 0 ? (
            Object.entries(itemsByDate).map(([date, dateItems]) => (
              <div key={date} className={styles.dateGroup}>
                <h3 className={styles.dateHeader}>{date}</h3>
                <div className={styles.matchesList}>
                  {dateItems.map(item => {
                    if (item.itemType === 'round') {
                      // Render round (non-match event)
                      return (
                        <Link
                          key={`round-${item.id}`}
                          to={`/events/${item.medal_event_id}`}
                          className={`${styles.roundCard} ${styles[item.status]}`}
                        >
                          {item.status === 'live' && (
                            <span className={styles.liveIndicator}>LIVE</span>
                          )}

                          <div className={styles.matchMeta}>
                            <span className={styles.sportName}>{item.sport_name}</span>
                            <span className={styles.eventName}>
                              {formatEventName(item.medal_event_name, item.gender)}
                            </span>
                            <span className={styles.roundName}>{getRoundName(item)}</span>
                          </div>

                          <div className={styles.roundContent}>
                            <span className={styles.participatingLabel}>Participating</span>
                            {(item.round_venue || item.event_venue) && (
                              <span className={styles.venueInfo}>{item.round_venue || item.event_venue}</span>
                            )}
                          </div>

                          <div className={styles.matchFooter}>
                            {item.start_time_utc && (
                              <span className={styles.matchTime}>
                                {formatLocalTime(item.start_time_utc).split(',').pop().trim()}
                              </span>
                            )}
                            <span className={`badge badge-${item.status}`}>
                              {item.status === 'scheduled' ? 'Scheduled' : item.status === 'live' ? 'Live' : 'Completed'}
                            </span>
                          </div>
                        </Link>
                      );
                    }

                    // Render match
                    const match = item;
                    const isTeamA = match.team_a_country_id === country.id;
                    const result = getMatchResult(match, country.id);

                    return (
                      <div
                        key={`match-${match.id}`}
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
                          <div className={`${styles.team} ${isTeamA ? styles.highlight : ''} ${match.winner_country_id && Number(match.winner_country_id) === Number(match.team_a_country_id) ? styles.winner : ''}`}>
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
                          <div className={`${styles.team} ${!isTeamA ? styles.highlight : ''} ${match.winner_country_id && Number(match.winner_country_id) === Number(match.team_b_country_id) ? styles.winner : ''}`}>
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
              {scheduleItems.length === 0
                ? participatingEvents.length > 0
                  ? `No schedule for ${country.name} yet. Check the Events tab to see registered events.`
                  : `No schedule for ${country.name} yet.`
                : 'No items match the selected filter.'}
            </p>
          )
        )}
      </div>

      <Link to="/medals" className={styles.backLink}>← Back to Medal Standings</Link>
    </div>
  );
}

export default Team;
