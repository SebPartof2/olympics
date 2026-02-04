import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useOlympics } from '../context/OlympicsContext';
import LiveResults from '../components/LiveResults/LiveResults';
import styles from './Live.module.css';

function Live() {
  const { selectedOlympics, selectedOlympicsId, isLoading: olympicsLoading } = useOlympics();
  const [liveRounds, setLiveRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    if (!selectedOlympicsId) return;
    try {
      const rounds = await api.getLiveRounds(selectedOlympicsId);
      setLiveRounds(rounds);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedOlympicsId]);

  useEffect(() => {
    if (!olympicsLoading && selectedOlympicsId) {
      loadData();
    }
  }, [loadData, olympicsLoading, selectedOlympicsId]);

  if (loading || olympicsLoading) {
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
        <p>{selectedOlympics?.name || 'Olympics'} - Real-time updates from ongoing events</p>
      </header>

      <LiveResults rounds={liveRounds} onRefresh={loadData} />
    </div>
  );
}

export default Live;
