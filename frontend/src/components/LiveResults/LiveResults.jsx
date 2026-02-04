import { useEffect, useState } from 'react';
import { formatLocalTime } from '../../services/api';
import styles from './LiveResults.module.css';

function LiveResults({ rounds, onRefresh }) {
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

  function getRoundTypeLabel(type) {
    const labels = {
      heat: 'Heat',
      repechage: 'Repechage',
      quarterfinal: 'Quarterfinal',
      semifinal: 'Semifinal',
      final: 'Final',
      bronze_final: 'Bronze Final',
      group_stage: 'Group Stage',
      knockout: 'Knockout',
      qualification: 'Qualification',
      preliminary: 'Preliminary',
    };
    return labels[type] || type;
  }

  if (!rounds || rounds.length === 0) {
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
        {rounds.map((round) => (
          <div key={round.id} className={styles.eventCard}>
            <div className={styles.eventHeader}>
              <span className={styles.eventName}>
                {round.medal_event_name}
                {round.round_name
                  ? ` - ${round.round_name}`
                  : ` - ${getRoundTypeLabel(round.round_type)}${round.round_number > 1 ? ` ${round.round_number}` : ''}`
                }
              </span>
              <span className={styles.eventSport}>{round.sport_name}</span>
            </div>
            <div className={styles.roundMeta}>
              {round.gender && round.gender !== 'mixed' && (
                <span className={styles.gender}>
                  {round.gender === 'men' ? "Men's" : "Women's"}
                </span>
              )}
              {(round.round_venue || round.event_venue) && (
                <span className={styles.venue}>
                  {round.round_venue || round.event_venue}
                </span>
              )}
              <span className={styles.startTime}>
                Started: {formatLocalTime(round.start_time_utc)}
              </span>
            </div>
            <p className={styles.noResults}>
              Live updates will appear here as results are recorded.
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LiveResults;
