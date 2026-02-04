import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useOlympics } from '../../context/OlympicsContext';
import styles from './Header.module.css';

function Header() {
  const { isAuthenticated } = useAuth();
  const { olympicsList, selectedOlympicsId, selectOlympics, isLoading } = useOlympics();

  return (
    <header className={styles.header}>
      <div className={`container ${styles.headerContent}`}>
        <div className={styles.logoSection}>
          <NavLink to="/" className={styles.logo}>
            <img src="/olympic-rings.svg" alt="Olympics" className={styles.rings} />
            <span className={styles.title}>Olympics Tracker</span>
          </NavLink>
          {!isLoading && olympicsList.length > 0 && (
            <select
              className={styles.olympicsSelector}
              value={selectedOlympicsId || ''}
              onChange={(e) => selectOlympics(Number(e.target.value))}
            >
              {olympicsList.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} {o.is_active ? '(Active)' : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        <nav className={styles.nav}>
          <NavLink
            to="/"
            className={({ isActive }) => isActive ? styles.active : ''}
          >
            Home
          </NavLink>
          <NavLink
            to="/medals"
            className={({ isActive }) => isActive ? styles.active : ''}
          >
            Medals
          </NavLink>
          <NavLink
            to="/schedule"
            className={({ isActive }) => isActive ? styles.active : ''}
          >
            Schedule
          </NavLink>
          <NavLink
            to="/live"
            className={({ isActive }) => isActive ? styles.active : ''}
          >
            Live
          </NavLink>
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `${styles.adminLink} ${isActive ? styles.active : ''} ${isAuthenticated ? styles.authenticated : ''}`
            }
          >
            Admin
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

export default Header;
