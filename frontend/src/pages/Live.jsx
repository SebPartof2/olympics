import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import LiveResults from '../components/LiveResults/LiveResults';
import styles from './Live.module.css';

function Live() {
  const [results, setResults] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [resultsData, eventsData] = await Promise.all([
        api.getResults(),
        api.getEvents({ status: 'live' }),
      ]);
      setResults(resultsData);
      setEvents(eventsData);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return <div className="loading"></div>;
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">Error loading live results: {error}</div>
      </div>
    );
  }

  return (
    <div className="container">
      <header className={styles.header}>
        <h1>Live Results</h1>
        <p>Real-time updates from ongoing events</p>
      </header>

      <LiveResults results={results} events={events} onRefresh={loadData} />
    </div>
  );
}

export default Live;
