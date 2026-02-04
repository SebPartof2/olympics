import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Admin.module.css';

function AdminLayout() {
  const { isAuthenticated, isLoading, login, logout } = useAuth();
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const location = useLocation();

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError('');
    const success = await login(password);
    if (!success) setLoginError('Invalid password');
    setPassword('');
  }

  if (isLoading) return <div className="loading"></div>;

  if (!isAuthenticated) {
    return (
      <div className="container">
        <div className={styles.loginContainer}>
          <h1>Admin Login</h1>
          <p>Enter the admin password to manage Olympics data.</p>
          <form onSubmit={handleLogin} className={styles.loginForm}>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                required
              />
            </div>
            {loginError && <p className={styles.loginError}>{loginError}</p>}
            <button type="submit" className="btn btn-primary">Login</button>
          </form>
        </div>
      </div>
    );
  }

  const navItems = [
    { path: '/admin', label: 'Dashboard', end: true },
    { path: '/admin/olympics', label: 'Olympics' },
    { path: '/admin/settings', label: 'Settings' },
    { path: '/admin/countries', label: 'Countries' },
    { path: '/admin/sports', label: 'Sports' },
    { path: '/admin/events', label: 'Events' },
    { path: '/admin/participants', label: 'Participants' },
    { path: '/admin/rounds', label: 'Rounds' },
    { path: '/admin/matches', label: 'Matches' },
    { path: '/admin/medals', label: 'Medals' },
  ];

  return (
    <div className="container">
      <header className={styles.header}>
        <div>
          <h1>Admin Panel</h1>
          <p>Manage Olympics data</p>
        </div>
        <button onClick={logout} className="btn btn-secondary">Logout</button>
      </header>

      <nav className={styles.nav}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.activeNavLink : ''}`}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  );
}

export default AdminLayout;
