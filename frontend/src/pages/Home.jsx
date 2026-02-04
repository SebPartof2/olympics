import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import MedalTable from '../components/MedalTable/MedalTable';
import EventSchedule from '../components/EventSchedule/EventSchedule';
import styles from './Home.module.css';

function Home() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      setLoading(true);
      const data = await api.getStats();
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="loading"></div>;
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">Error loading data: {error}</div>
      </div>
    );
  }

  return (
    <div className={`container ${styles.home}`}>
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>Olympics Tracker</h1>
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
          <span className={styles.statNumber}>{stats?.counts?.events || 0}</span>
          <span className={styles.statLabel}>Events</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>{stats?.counts?.medals || 0}</span>
          <span className={styles.statLabel}>Medals</span>
        </div>
        {stats?.counts?.liveEvents > 0 && (
          <div className={`${styles.statCard} ${styles.liveCard}`}>
            <span className={styles.statNumber}>{stats.counts.liveEvents}</span>
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
            <h2>Today's Events</h2>
            <Link to="/schedule" className={styles.viewAll}>
              View All →
            </Link>
          </div>
          <div className="card">
            {stats?.todayEvents?.length > 0 ? (
              <EventSchedule events={stats.todayEvents} />
            ) : (
              <p className={styles.emptyState}>
                No events scheduled for today. Visit the Admin panel to add events.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default Home;
