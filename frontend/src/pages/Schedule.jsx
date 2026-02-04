import { useState, useEffect } from 'react';
import api, { formatLocalTime, formatLocalDate } from '../services/api';
import { useOlympics } from '../context/OlympicsContext';
import styles from './Schedule.module.css';

function Schedule() {
  const { selectedOlympics, selectedOlympicsId, isLoading: olympicsLoading } = useOlympics();
  const [schedule, setSchedule] = useState([]);
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sportFilter, setSportFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    if (!olympicsLoading && selectedOlympicsId) {
      loadData();
    }
  }, [selectedOlympicsId, olympicsLoading]);

  async function loadData() {
    try {
      setLoading(true);
      const [scheduleData, sportsData] = await Promise.all([
        api.getSchedule({ olympics: selectedOlympicsId }),
        api.getSports(),
      ]);
      setSchedule(scheduleData);
      setSports(sportsData);
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
                {rounds.map((round) => (
                  <div
                    key={round.id}
                    className={`${styles.roundCard} ${round.status === 'live' ? styles.live : ''} ${round.status === 'completed' ? styles.completed : ''}`}
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
                      </div>
                    </div>
                    <div className={styles.roundStatus}>
                      {getStatusBadge(round.status)}
                    </div>
                  </div>
                ))}
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
