import { useEffect, useState } from 'react';
import styles from './LiveResults.module.css';

function LiveResults({ results, events, onRefresh }) {
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (onRefresh) {
        onRefresh();
        setLastUpdate(new Date());
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [onRefresh]);

  // Group results by event
  const liveEvents = events.filter((e) => e.status === 'live');

  const resultsByEvent = results.reduce((groups, result) => {
    const eventId = result.event_id;
    if (!groups[eventId]) {
      groups[eventId] = [];
    }
    groups[eventId].push(result);
    return groups;
  }, {});

  function formatUpdateTime(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  if (liveEvents.length === 0 && Object.keys(resultsByEvent).length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>LIVE</div>
        <p>No live events at the moment.</p>
        <p className={styles.emptyHint}>Check back soon for live updates!</p>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.liveIndicator}>
          <span className={styles.liveDot}></span>
          LIVE UPDATES
        </div>
        <span className={styles.lastUpdate}>
          Last updated: {lastUpdate.toLocaleTimeString()}
        </span>
      </div>

      <div className={styles.eventsList}>
        {liveEvents.map((event) => {
          const eventResults = resultsByEvent[event.id] || [];
          return (
            <div key={event.id} className={styles.eventCard}>
              <div className={styles.eventHeader}>
                <span className={styles.eventName}>{event.name}</span>
                {event.sport_name && (
                  <span className={styles.eventSport}>{event.sport_name}</span>
                )}
              </div>

              {eventResults.length > 0 ? (
                <div className={styles.resultsTable}>
                  <table>
                    <thead>
                      <tr>
                        <th>Pos</th>
                        <th>Athlete/Team</th>
                        <th>Country</th>
                        <th>Score/Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eventResults
                        .sort((a, b) => (a.position || 999) - (b.position || 999))
                        .map((result) => (
                          <tr
                            key={result.id}
                            className={result.position <= 3 ? styles.topPosition : ''}
                          >
                            <td>
                              {result.position ? (
                                <span
                                  className={`${styles.position} ${
                                    result.position === 1
                                      ? styles.first
                                      : result.position === 2
                                      ? styles.second
                                      : result.position === 3
                                      ? styles.third
                                      : ''
                                  }`}
                                >
                                  {result.position}
                                </span>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td>{result.athlete_name || '-'}</td>
                            <td>
                              {result.country_code && (
                                <span className={styles.countryCode}>
                                  {result.country_code}
                                </span>
                              )}
                              {result.country_name || '-'}
                            </td>
                            <td className={styles.score}>{result.score || '-'}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className={styles.noResults}>No results recorded yet.</p>
              )}

              {eventResults.length > 0 && eventResults[0].updated_at && (
                <div className={styles.updateTime}>
                  Updated {formatUpdateTime(eventResults[0].updated_at)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default LiveResults;
