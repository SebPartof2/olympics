import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { formatLocalTime, formatLocalDate } from '../services/api';
import { useOlympics } from '../context/OlympicsContext';
import styles from './Schedule.module.css';

function Schedule() {
  const { selectedOlympics, selectedOlympicsId, isLoading: olympicsLoading } = useOlympics();
  const [schedule, setSchedule] = useState([]);
  const [matches, setMatches] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sportFilter, setSportFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [expandedRounds, setExpandedRounds] = useState(new Set());

  useEffect(() => {
    if (!olympicsLoading && selectedOlympicsId) {
      loadData();
    }
  }, [selectedOlympicsId, olympicsLoading]);

  async function loadData() {
    try {
      setLoading(true);
      const [scheduleData, sportsData, matchesData, participantsData] = await Promise.all([
        api.getSchedule({ olympics: selectedOlympicsId }),
        api.getSports(),
        api.getMatches({ olympics_id: selectedOlympicsId }),
        api.getEventParticipants({ olympics: selectedOlympicsId }),
      ]);
      setSchedule(scheduleData);
      setSports(sportsData);
      setMatches(matchesData);
      setParticipants(participantsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function getRoundTypeLabel(type) {
    const labels = {
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
    return labels[type] || type;
  }

  function formatEventName(name, gender) {
    if (!gender) return name;
    const prefixes = { men: "Men's", women: "Women's", mixed: "Mixed" };
    const prefix = prefixes[gender];
    return prefix ? `${prefix} ${name}` : name;
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

  function toggleRound(roundId) {
    setExpandedRounds(prev => {
      const next = new Set(prev);
      if (next.has(roundId)) {
        next.delete(roundId);
      } else {
        next.add(roundId);
      }
      return next;
    });
  }

  function getMatchesForRound(roundId) {
    return matches.filter(m => m.event_round_id === roundId);
  }

  function getParticipantsForEvent(medalEventId) {
    return participants.filter(p => p.medal_event_id === medalEventId);
  }

  // Filter schedule
  const filteredSchedule = schedule.filter((round) => {
    if (sportFilter && round.sport_id !== parseInt(sportFilter)) return false;
    if (statusFilter && round.status !== statusFilter) return false;
    if (dateFilter) {
      const roundDate = new Date(round.start_time_utc).toISOString().split('T')[0];
      if (roundDate !== dateFilter) return false;
    }
    return true;
  });

  // Group by date
  const groupedSchedule = filteredSchedule.reduce((groups, round) => {
    const date = formatLocalDate(round.start_time_utc);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(round);
    return groups;
  }, {});

  if (loading || olympicsLoading) {
    return <div className="loading"></div>;
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">Error loading schedule: {error}</div>
      </div>
    );
  }

  // Get unique dates for filter
  const uniqueDates = [...new Set(schedule.map(r =>
    new Date(r.start_time_utc).toISOString().split('T')[0]
  ))].sort();

  return (
    <div className="container">
      <header className={styles.header}>
        <h1>Event Schedule</h1>
        <p>{selectedOlympics?.name || 'Olympics'} - Browse events by date and sport (times in your local timezone)</p>
      </header>

      <div className={styles.filters}>
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className={styles.filter}
        >
          <option value="">All Dates</option>
          {uniqueDates.map((date) => (
            <option key={date} value={date}>
              {new Date(date).toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric'
              })}
            </option>
          ))}
        </select>

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
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={styles.filter}
        >
          <option value="">All Status</option>
          <option value="scheduled">Scheduled</option>
          <option value="live">Live</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div className="card">
        {Object.keys(groupedSchedule).length > 0 ? (
          Object.entries(groupedSchedule).map(([date, rounds]) => (
            <div key={date} className={styles.dateGroup}>
              <h3 className={styles.dateHeader}>{date}</h3>
              <div className={styles.roundsList}>
                {rounds.map((round) => {
                  const roundMatches = getMatchesForRound(round.id);
                  const eventParticipants = getParticipantsForEvent(round.medal_event_id);
                  const hasMatches = roundMatches.length > 0;
                  const hasParticipants = !hasMatches && eventParticipants.length > 0;
                  const isExpandable = hasMatches || hasParticipants;
                  const isExpanded = expandedRounds.has(round.id);

                  return (
                    <div key={round.id} className={styles.roundWrapper}>
                      <div
                        className={`${styles.roundCard} ${round.status === 'live' ? styles.live : ''} ${round.status === 'completed' ? styles.completed : ''} ${isExpandable ? styles.clickable : ''} ${isExpanded ? styles.expanded : ''}`}
                        onClick={() => isExpandable && toggleRound(round.id)}
                        role={isExpandable ? 'button' : undefined}
                        tabIndex={isExpandable ? 0 : undefined}
                      >
                        <div className={styles.roundTime}>
                          {formatLocalTime(round.start_time_utc).split(',').pop().trim()}
                        </div>
                        <div className={styles.roundInfo}>
                          <div className={styles.roundName}>
                            {formatEventName(round.medal_event_name, round.gender)}
                            {round.round_name ? ` - ${round.round_name}` : ` - ${getRoundTypeLabel(round.round_type)}${round.round_number > 1 ? ` ${round.round_number}` : ''}`}
                          </div>
                          <div className={styles.roundMeta}>
                            <span className={styles.roundSport}>{round.sport_name}</span>
                            {(round.round_venue || round.event_venue) && (
                              <span className={styles.roundVenue}>
                                {round.round_venue || round.event_venue}
                              </span>
                            )}
                            {hasMatches && (
                              <span className={styles.matchCount}>
                                {roundMatches.length} match{roundMatches.length !== 1 ? 'es' : ''}
                              </span>
                            )}
                            {hasParticipants && (
                              <span className={styles.participantCount}>
                                {eventParticipants.length} countr{eventParticipants.length !== 1 ? 'ies' : 'y'}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className={styles.roundActions}>
                          {getStatusBadge(round.status)}
                          {isExpandable && (
                            <span className={`${styles.expandIcon} ${isExpanded ? styles.iconExpanded : ''}`}>
                              ▼
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Expanded content */}
                      {isExpanded && isExpandable && (
                        <div className={styles.matchesPanel}>
                          {hasMatches ? (
                            <div className={styles.matchesGrid}>
                              {roundMatches.map((match) => (
                                <div key={match.id} className={`${styles.matchCard} ${styles[match.status]}`}>
                                  {match.status === 'live' && (
                                    <span className={styles.liveIndicator}>LIVE</span>
                                  )}
                                  {match.match_name && (
                                    <div className={styles.matchLabel}>{match.match_name}</div>
                                  )}
                                  <div className={styles.matchTeams}>
                                    <div className={`${styles.team} ${match.winner_country_id && Number(match.winner_country_id) === Number(match.team_a_country_id) ? styles.winner : ''}`}>
                                      {match.team_a_flag_url && (
                                        <img src={match.team_a_flag_url} alt="" className={styles.flag} />
                                      )}
                                      <span className={styles.teamName}>
                                        {match.team_a_country_code || match.team_a_name || 'TBD'}
                                      </span>
                                      <span className={styles.score}>
                                        {match.team_a_score ?? '-'}
                                      </span>
                                    </div>
                                    <div className={`${styles.team} ${match.winner_country_id && Number(match.winner_country_id) === Number(match.team_b_country_id) ? styles.winner : ''}`}>
                                      <span className={styles.score}>
                                        {match.team_b_score ?? '-'}
                                      </span>
                                      <span className={styles.teamName}>
                                        {match.team_b_country_code || match.team_b_name || 'TBD'}
                                      </span>
                                      {match.team_b_flag_url && (
                                        <img src={match.team_b_flag_url} alt="" className={styles.flag} />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className={styles.participantsGrid}>
                              <div className={styles.participantsLabel}>Participating Countries:</div>
                              <div className={styles.participantFlags}>
                                {eventParticipants.map((p) => (
                                  <Link
                                    key={p.id}
                                    to={`/team/${p.country_code}`}
                                    className={styles.participantItem}
                                    title={p.country_name}
                                  >
                                    {p.flag_url && (
                                      <img src={p.flag_url} alt="" className={styles.flag} />
                                    )}
                                    <span className={styles.participantCode}>{p.country_code}</span>
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )}
                          {round.medal_event_id && (
                            <Link to={`/events/${round.medal_event_id}`} className={styles.eventLink}>
                              View full event details →
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <p className={styles.empty}>
            {schedule.length === 0
              ? 'No events scheduled yet. Visit the Admin panel to add events.'
              : 'No events match the selected filters.'}
          </p>
        )}
      </div>
    </div>
  );
}

export default Schedule;
