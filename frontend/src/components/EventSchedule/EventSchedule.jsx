import { useState } from 'react';
import styles from './EventSchedule.module.css';

function EventSchedule({ events, sports = [], showFilters = false }) {
  const [sportFilter, setSportFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filteredEvents = events.filter((event) => {
    if (sportFilter && event.sport_id !== parseInt(sportFilter)) return false;
    if (statusFilter && event.status !== statusFilter) return false;
    return true;
  });

  // Group events by date
  const groupedEvents = filteredEvents.reduce((groups, event) => {
    const date = event.event_date
      ? new Date(event.event_date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'Date TBD';
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(event);
    return groups;
  }, {});

  function formatTime(dateStr) {
    if (!dateStr) return 'TBD';
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  function getStatusBadge(status) {
    const classes = {
      scheduled: 'badge badge-scheduled',
      live: 'badge badge-live',
      completed: 'badge badge-completed',
    };
    const labels = {
      scheduled: 'Scheduled',
      live: 'Live',
      completed: 'Completed',
    };
    return <span className={classes[status] || 'badge'}>{labels[status] || status}</span>;
  }

  if (events.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No events scheduled yet.</p>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      {showFilters && (
        <div className={styles.filters}>
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
      )}

      {Object.entries(groupedEvents).map(([date, dateEvents]) => (
        <div key={date} className={styles.dateGroup}>
          <h3 className={styles.dateHeader}>{date}</h3>
          <div className={styles.eventList}>
            {dateEvents.map((event) => (
              <div key={event.id} className={`${styles.eventCard} ${styles[event.status]}`}>
                <div className={styles.eventTime}>
                  {formatTime(event.event_date)}
                </div>
                <div className={styles.eventInfo}>
                  <div className={styles.eventName}>{event.name}</div>
                  {event.sport_name && (
                    <div className={styles.eventSport}>{event.sport_name}</div>
                  )}
                  {event.venue && (
                    <div className={styles.eventVenue}>{event.venue}</div>
                  )}
                </div>
                <div className={styles.eventStatus}>
                  {getStatusBadge(event.status)}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {filteredEvents.length === 0 && events.length > 0 && (
        <p className={styles.noResults}>No events match the selected filters.</p>
      )}
    </div>
  );
}

export default EventSchedule;
