import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { formatLocalTime } from '../services/api';
import { useOlympics } from '../context/OlympicsContext';
import MedalTable from '../components/MedalTable/MedalTable';
import styles from './Home.module.css';

function Home() {
  const { selectedOlympics, selectedOlympicsId, isLoading: olympicsLoading } = useOlympics();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!olympicsLoading && selectedOlympicsId) {
      loadStats();
    }
  }, [selectedOlympicsId, olympicsLoading]);

  async function loadStats() {
    try {
      setLoading(true);
      const data = await api.getStats(selectedOlympicsId);
      setStats(data);
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

  if (loading || olympicsLoading) {
    return <div className="loading"></div>;
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">Error loading data: {error}</div>
      </div>
    );
  }

  if (!selectedOlympics) {
    return (
      <div className="container">
        <div className={styles.emptyState}>
          No Olympics configured yet. Visit the Admin panel to create one.
        </div>
      </div>
    );
  }

  const olympicsName = selectedOlympics?.name || 'Olympics Tracker';
  const olympicsLocation = `${selectedOlympics?.city || ''}, ${selectedOlympics?.country || ''}`;

  return (
    <div className={`container ${styles.home}`}>
      <section className={styles.hero}>
        {selectedOlympics?.logo_url && (
          <img src={selectedOlympics.logo_url} alt={olympicsName} className={styles.heroLogo} />
        )}
        <h1 className={styles.heroTitle}>{olympicsName}</h1>
        {olympicsLocation && (
          <p className={styles.heroSubtitle}>{olympicsLocation}</p>
        )}
        <p className={styles.heroSubtitle}>
          Follow the latest medals, events, and live results
        </p>
      </section>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>{stats?.counts?.countries || 0}</span>
          <span className={styles.statLabel}>Countries</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>{stats?.counts?.sports || 0}</span>
          <span className={styles.statLabel}>Sports</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>{stats?.counts?.medalEvents || 0}</span>
          <span className={styles.statLabel}>Events</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>{stats?.counts?.medals || 0}</span>
          <span className={styles.statLabel}>Medals</span>
        </div>
        {stats?.counts?.liveRounds > 0 && (
          <div className={`${styles.statCard} ${styles.liveCard}`}>
            <span className={styles.statNumber}>{stats.counts.liveRounds}</span>
            <span className={styles.statLabel}>Live Now</span>
          </div>
        )}
      </div>

      <div className={styles.content}>
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Medal Standings</h2>
            <Link to="/medals" className={styles.viewAll}>
              View All →
            </Link>
          </div>
          <div className="card">
            {stats?.topCountries?.length > 0 ? (
              <MedalTable data={stats.topCountries} limit={5} />
            ) : (
              <p className={styles.emptyState}>
                No medals have been awarded yet. Visit the Admin panel to add data.
              </p>
            )}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>
              {stats?.liveNow?.length > 0 ? 'Live Now' : 'Upcoming Events'}
            </h2>
            <Link to="/schedule" className={styles.viewAll}>
              View All →
            </Link>
          </div>
          <div className="card">
            {stats?.liveNow?.length > 0 ? (
              <div className={styles.roundsList}>
                {stats.liveNow.map((round) => (
                  <div key={round.id} className={`${styles.roundCard} ${styles.live}`}>
                    <div className={styles.roundTime}>
                      <span className="badge badge-live">LIVE</span>
                    </div>
                    <div className={styles.roundInfo}>
                      <div className={styles.roundName}>
                        {formatEventName(round.medal_event_name, round.gender)} - {getRoundTypeLabel(round.round_type)}
                        {round.round_number > 1 && ` ${round.round_number}`}
                      </div>
                      <div className={styles.roundSport}>{round.sport_name}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : stats?.upcomingRounds?.length > 0 ? (
              <div className={styles.roundsList}>
                {stats.upcomingRounds.slice(0, 5).map((round) => (
                  <div key={round.id} className={styles.roundCard}>
                    <div className={styles.roundTime}>
                      {formatLocalTime(round.start_time_utc)}
                    </div>
                    <div className={styles.roundInfo}>
                      <div className={styles.roundName}>
                        {formatEventName(round.medal_event_name, round.gender)} - {getRoundTypeLabel(round.round_type)}
                        {round.round_number > 1 && ` ${round.round_number}`}
                      </div>
                      <div className={styles.roundSport}>{round.sport_name}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.emptyState}>
                No upcoming events scheduled. Visit the Admin panel to add events.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default Home;
