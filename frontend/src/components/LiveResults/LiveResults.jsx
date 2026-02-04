import { useEffect, useState } from 'react';
import { formatLocalTime } from '../../services/api';
import styles from './LiveResults.module.css';

function LiveResults({ rounds, matches = [], onRefresh }) {
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
      round_robin: 'Round Robin',
      knockout: 'Knockout',
      qualification: 'Qualification',
      preliminary: 'Preliminary',
    };
    return labels[type] || type;
  }

  function formatEventName(name, gender) {
    if (!gender || gender === 'mixed') return name;
    const prefix = gender === 'men' ? "Men's" : "Women's";
    return `${prefix} ${name}`;
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
        {rounds.map((round) => {
          const roundMatches = matches.filter(m => m.event_round_id === round.id);
          return (
            <div key={round.id} className={styles.eventCard}>
              <div className={styles.eventHeader}>
                <span className={styles.eventName}>
                  {formatEventName(round.medal_event_name, round.gender)}
                  {round.round_name
                    ? ` - ${round.round_name}`
                    : ` - ${getRoundTypeLabel(round.round_type)}${round.round_number > 1 ? ` ${round.round_number}` : ''}`
                  }
                </span>
                <span className={styles.eventSport}>{round.sport_name}</span>
              </div>
              <div className={styles.roundMeta}>
                {(round.round_venue || round.event_venue) && (
                  <span className={styles.venue}>
                    {round.round_venue || round.event_venue}
                  </span>
                )}
                <span className={styles.startTime}>
                  Started: {formatLocalTime(round.start_time_utc)}
                </span>
              </div>

              {/* Show matches if any */}
              {roundMatches.length > 0 ? (
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
                          <span className={styles.matchScore}>{match.team_a_score || '-'}</span>
                        </div>
                        <span className={styles.vs}>vs</span>
                        <div className={`${styles.team} ${match.winner_country_id === match.team_b_country_id ? styles.winner : ''}`}>
                          <span className={styles.matchScore}>{match.team_b_score || '-'}</span>
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
              ) : (
                <p className={styles.noResults}>
                  Live updates will appear here as results are recorded.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default LiveResults;
