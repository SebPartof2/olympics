import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useOlympics } from '../../context/OlympicsContext';
import styles from './Admin.module.css';

function AdminDashboard() {
  const { selectedOlympics, olympicsList } = useOlympics();
  const [stats, setStats] = useState({
    countries: 0,
    sports: 0,
    events: 0,
    rounds: 0,
    matches: 0,
    medals: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const [countries, sports, events, rounds, matches, medals] = await Promise.all([
        api.getCountries(),
        api.getSports(),
        api.getMedalEvents({}),
        api.getRounds({}),
        api.getMatches({}),
        api.getAllMedals(),
      ]);
      setStats({
        countries: countries.length,
        sports: sports.length,
        events: events.length,
        rounds: rounds.length,
        matches: matches.length,
        medals: medals.length,
      });
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }

  const sections = [
    {
      path: '/admin/olympics',
      title: 'Olympics',
      description: 'Create and manage different Olympic games',
      stat: olympicsList.length,
      statLabel: 'Olympics',
    },
    {
      path: '/admin/settings',
      title: 'Settings',
      description: 'Configure global settings like timezone',
      stat: null,
      statLabel: null,
    },
    {
      path: '/admin/countries',
      title: 'Countries',
      description: 'Manage participating countries',
      stat: stats.countries,
      statLabel: 'Countries',
    },
    {
      path: '/admin/sports',
      title: 'Sports',
      description: 'Manage sports and disciplines',
      stat: stats.sports,
      statLabel: 'Sports',
    },
    {
      path: '/admin/events',
      title: 'Medal Events',
      description: 'Create events that award medals',
      stat: stats.events,
      statLabel: 'Events',
    },
    {
      path: '/admin/rounds',
      title: 'Rounds',
      description: 'Schedule heats, semifinals, and finals',
      stat: stats.rounds,
      statLabel: 'Rounds',
    },
    {
      path: '/admin/matches',
      title: 'Matches',
      description: 'Manage individual matches within rounds',
      stat: stats.matches,
      statLabel: 'Matches',
    },
    {
      path: '/admin/medals',
      title: 'Medals',
      description: 'Award gold, silver, and bronze medals',
      stat: stats.medals,
      statLabel: 'Medals',
    },
  ];

  return (
    <div className={styles.section}>
      <h2>Dashboard</h2>
      {selectedOlympics && (
        <p className={styles.hint}>
          Currently managing: <strong>{selectedOlympics.name}</strong>
        </p>
      )}
      <div className={styles.dashboard}>
        {sections.map((section) => (
          <Link key={section.path} to={section.path} className={styles.dashboardCard}>
            <h3>{section.title}</h3>
            <p>{section.description}</p>
            {section.stat !== null && (
              <span className={styles.dashboardStat}>
                {section.stat} {section.statLabel}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default AdminDashboard;
