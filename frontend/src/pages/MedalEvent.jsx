import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { formatLocalTime } from '../services/api';
import styles from './MedalEvent.module.css';

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

function MedalEvent() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    try {
      setLoading(true);
      const [eventData, matchesData] = await Promise.all([
        api.getMedalEvent(id),
        api.getMatches({}),
      ]);
      setEvent(eventData);
      // Filter matches for this event's rounds
      const roundIds = new Set(eventData.rounds?.map(r => r.id) || []);
      setMatches(matchesData.filter(m => roundIds.has(m.event_round_id)));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadge(status) {
    const classes = {
      scheduled: 'badge badge-scheduled',
      delayed: 'badge badge-scheduled',
      live: 'badge badge-live',
      completed: 'badge badge-completed',
      cancelled: 'badge',
    };
    const labels = {
      scheduled: 'Scheduled',
      delayed: 'Delayed',
      live: 'Live',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    return <span className={classes[status] || 'badge'}>{labels[status] || status}</span>;
  }

  function formatEventName(name, gender) {
    if (!gender || gender === 'mixed') return name;
    const prefix = gender === 'men' ? "Men's" : "Women's";
    return `${prefix} ${name}`;
  }

  function getRoundName(round) {
    if (round.round_name) return round.round_name;
    const label = ROUND_TYPES[round.round_type] || round.round_type;
    return round.round_number > 1 ? `${label} ${round.round_number}` : label;
  }

  if (loading) {
    return <div className="loading"></div>;
  }

  if (error || !event) {
    return (
      <div className="container">
        <div className="error">Error loading event: {error || 'Event not found'}</div>
      </div>
    );
  }

  // Group rounds by type for better organization
  const roundsByType = (event.rounds || []).reduce((groups, round) => {
    const type = round.round_type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(round);
    return groups;
  }, {});

  // Define round order for display
  const roundOrder = ['qualification', 'preliminary', 'heat', 'repechage', 'round_robin', 'group_stage', 'knockout', 'quarterfinal', 'semifinal', 'bronze_final', 'final'];
  const sortedTypes = Object.keys(roundsByType).sort((a, b) => {
    return roundOrder.indexOf(a) - roundOrder.indexOf(b);
  });

  return (
    <div className="container">
      <div className={styles.breadcrumb}>
        <Link to="/events">Events</Link> / {event.sport_name}
      </div>

      <header className={styles.header}>
        <div className={styles.headerInfo}>
          <h1>{formatEventName(event.name, event.gender)}</h1>
          <div className={styles.meta}>
            <span className={styles.sport}>{event.sport_name}</span>
            {event.venue && <span className={styles.venue}>{event.venue}</span>}
            {event.scheduled_date && (
              <span className={styles.date}>
                Final: {new Date(event.scheduled_date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Medals Section */}
      {event.medals && event.medals.length > 0 && (
        <section className={styles.medalsSection}>
          <h2>Medal Winners</h2>
          <div className={styles.medalsList}>
            {event.medals.map((medal) => (
              <div key={medal.id} className={`${styles.medalCard} ${styles[medal.medal_type]}`}>
                <span className={`medal medal-${medal.medal_type}`}>
                  {medal.medal_type.charAt(0).toUpperCase()}
                </span>
                <div className={styles.medalInfo}>
                  <span className={styles.athleteName}>{medal.athlete_name}</span>
                  <span className={styles.countryCode}>{medal.country_code}</span>
                  {medal.result_value && <span className={styles.result}>{medal.result_value}</span>}
                  {medal.record_type && <span className={styles.record}>{medal.record_type}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Rounds Section */}
      <section className={styles.roundsSection}>
        <h2>Event Schedule</h2>
        {sortedTypes.length > 0 ? (
          sortedTypes.map((type) => (
            <div key={type} className={styles.roundGroup}>
              <h3 className={styles.roundTypeHeader}>{ROUND_TYPES[type] || type}</h3>
              <div className={styles.roundsList}>
                {roundsByType[type]
                  .sort((a, b) => new Date(a.start_time_utc) - new Date(b.start_time_utc))
                  .map((round) => {
                    const roundMatches = matches.filter(m => m.event_round_id === round.id);
                    return (
                      <div key={round.id} className={`${styles.roundCard} ${styles[round.status]}`}>
                        <div className={styles.roundHeader}>
                          <div className={styles.roundName}>{getRoundName(round)}</div>
                          <div className={styles.roundTime}>
                            {formatLocalTime(round.start_time_utc)}
                          </div>
                          {getStatusBadge(round.status)}
                        </div>
                        {round.venue && (
                          <div className={styles.roundVenue}>{round.venue}</div>
                        )}
                        {round.notes && (
                          <div className={styles.roundNotes}>{round.notes}</div>
                        )}

                        {/* Show matches if any */}
                        {roundMatches.length > 0 && (
                          <div className={styles.matchesList}>
                            {roundMatches.map((match) => (
                              <div key={match.id} className={`${styles.matchCard} ${styles[match.status]}`}>
                                <div className={styles.matchTeams}>
                                  <div className={`${styles.team} ${match.winner_country_id === match.team_a_country_id ? styles.winner : ''}`}>
                                    {match.team_a_flag_url && (
                                      <img src={match.team_a_flag_url} alt="" className={styles.flag} />
                                    )}
                                    <span className={styles.teamName}>
                                      {match.team_a_country_code || match.team_a_name || 'TBD'}
                                    </span>
                                    <span className={styles.score}>{match.team_a_score || '-'}</span>
                                  </div>
                                  <span className={styles.vs}>vs</span>
                                  <div className={`${styles.team} ${match.winner_country_id === match.team_b_country_id ? styles.winner : ''}`}>
                                    <span className={styles.score}>{match.team_b_score || '-'}</span>
                                    <span className={styles.teamName}>
                                      {match.team_b_country_code || match.team_b_name || 'TBD'}
                                    </span>
                                    {match.team_b_flag_url && (
                                      <img src={match.team_b_flag_url} alt="" className={styles.flag} />
                                    )}
                                  </div>
                                </div>
                                {match.match_name && (
                                  <div className={styles.matchName}>{match.match_name}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          ))
        ) : (
          <p className={styles.empty}>No rounds scheduled yet.</p>
        )}
      </section>
    </div>
  );
}

export default MedalEvent;
