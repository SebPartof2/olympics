import { useState, useEffect } from 'react';
import api from '../services/api';
import { useOlympics } from '../context/OlympicsContext';
import MedalTable from '../components/MedalTable/MedalTable';
import styles from './Medals.module.css';

function Medals() {
  const { selectedOlympics, selectedOlympicsId, isLoading: olympicsLoading } = useOlympics();
  const [medals, setMedals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!olympicsLoading && selectedOlympicsId) {
      loadMedals();
    }
  }, [selectedOlympicsId, olympicsLoading]);

  async function loadMedals() {
    try {
      setLoading(true);
      const data = await api.getMedalStandings(selectedOlympicsId);
      setMedals(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading || olympicsLoading) {
    return <div className="loading"></div>;
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">Error loading medals: {error}</div>
      </div>
    );
  }

  return (
    <div className="container">
      <header className={styles.header}>
        <h1>Medal Standings</h1>
        <p>{selectedOlympics?.name || 'Olympics'} - Complete medal count by country</p>
      </header>

      <div className="card">
        <MedalTable data={medals} showSearch={true} />
      </div>
    </div>
  );
}

export default Medals;
