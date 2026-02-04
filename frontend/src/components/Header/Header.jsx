import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Header.module.css';

function Header() {
  const { isAuthenticated } = useAuth();

  return (
    <header className={styles.header}>
      <div className={`container ${styles.headerContent}`}>
        <NavLink to="/" className={styles.logo}>
          <img src="/olympic-rings.svg" alt="Olympics" className={styles.rings} />
          <span className={styles.title}>Olympics Tracker</span>
        </NavLink>

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
