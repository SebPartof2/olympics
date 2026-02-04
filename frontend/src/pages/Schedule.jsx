import { useState, useEffect } from 'react';
import api from '../services/api';
import EventSchedule from '../components/EventSchedule/EventSchedule';
import styles from './Schedule.module.css';

function Schedule() {
  const [events, setEvents] = useState([]);
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [eventsData, sportsData] = await Promise.all([
        api.getEvents(),
        api.getSports(),
      ]);
      setEvents(eventsData);
      setSports(sportsData);
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
        <div className="error">Error loading schedule: {error}</div>
      </div>
    );
  }

  return (
    <div className="container">
      <header className={styles.header}>
        <h1>Event Schedule</h1>
        <p>Browse all Olympic events by date and sport</p>
      </header>

      <div className="card">
        <EventSchedule events={events} sports={sports} showFilters={true} />
      </div>
    </div>
  );
}

export default Schedule;
