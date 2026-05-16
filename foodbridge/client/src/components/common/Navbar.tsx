import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../../services/api';
import { Notification } from '../../types';
import './Navbar.css';

function applyTheme(theme: 'light' | 'dark') {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  localStorage.setItem('theme', theme);
}

function readStoredTheme(): 'light' | 'dark' {
  try {
    const stored = localStorage.getItem('theme');
    return stored === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

const Navbar: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(readStoredTheme);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state: { auth: { user: { _id: string; role: string } | null } }) =>
    state.auth.user
  );
  const isDashboard = location.pathname.includes('-dashboard');

  const unreadCount = notifications.filter((n) => !n.read).length;

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      try {
        const res = await getMyNotifications();
        setNotifications(res.data.notifications);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    closeMenu();
    setShowNotifications(false);
  }, [location.pathname, closeMenu]);

  useEffect(() => {
    document.body.classList.toggle('nav-menu-open', menuOpen);
    return () => document.body.classList.remove('nav-menu-open');
  }, [menuOpen]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };
    if (menuOpen) {
      document.addEventListener('keydown', onKeyDown);
      return () => document.removeEventListener('keydown', onKeyDown);
    }
  }, [menuOpen, closeMenu]);

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.read) {
      await markNotificationAsRead(notif._id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notif._id ? { ...n, read: true } : n))
      );
    }
    if (notif.link) navigate(notif.link);
    setShowNotifications(false);
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    dispatch(logout());
    closeMenu();
    navigate('/');
  };

  if (isDashboard) return null;

  const authActions = user ? (
    <>
      <div className="notification-wrapper" ref={notificationRef}>
        <button
          type="button"
          className="nav-btn nav-btn-icon nav-btn-ghost notification-btn"
          onClick={() => setShowNotifications((s) => !s)}
          aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
          aria-expanded={showNotifications}
        >
          🔔
          {unreadCount > 0 && (
            <span className="notification-badge">{unreadCount}</span>
          )}
        </button>
        {showNotifications && (
          <div className="notification-dropdown">
            <div className="notification-header">
              <h3>Notifications</h3>
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0}
              >
                Mark all read
              </button>
            </div>
            <div className="notification-list">
              {notifications.length === 0 ? (
                <p className="no-notifications">No notifications yet.</p>
              ) : (
                notifications.map((notif) => (
                  <button
                    type="button"
                    key={notif._id}
                    className={`notification-item${!notif.read ? ' unread' : ''}`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <p>{notif.message}</p>
                    <small>{new Date(notif.createdAt).toLocaleString()}</small>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      <span className="nav-role-badge">{user.role}</span>
      <Link to="/profile" className="nav-btn nav-btn-ghost" onClick={closeMenu}>
        Profile
      </Link>
      <Link
        to={`/${user.role}-dashboard`}
        className="nav-btn nav-btn-primary"
        onClick={closeMenu}
      >
        Dashboard
      </Link>
      <button type="button" onClick={handleLogout} className="nav-btn nav-btn-ghost">
        Logout
      </button>
    </>
  ) : (
    <>
      <Link to="/login" className="nav-btn nav-btn-ghost" onClick={closeMenu}>
        Login
      </Link>
      <Link to="/register" className="nav-btn nav-btn-primary" onClick={closeMenu}>
        Get Started
      </Link>
    </>
  );

  return (
    <nav
      ref={navRef}
      className={`fb-nav${scrolled ? ' scrolled' : ''}${menuOpen ? ' menu-open' : ''}`}
      aria-label="Main navigation"
    >
      <div className="inner container">
        <Link to="/" className="fb-brand" onClick={closeMenu}>
          <span className="leaf" aria-hidden="true">
            🌿
          </span>
          <span className="fb-brand-text">FoodBridge</span>
        </Link>

        <button
          type="button"
          className={`fb-toggle${menuOpen ? ' open' : ''}`}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="fb-nav-panel"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span />
          <span />
          <span />
        </button>

        {menuOpen && (
          <button
            type="button"
            className="fb-nav-backdrop"
            aria-label="Close menu"
            onClick={closeMenu}
            tabIndex={-1}
          />
        )}

        <div id="fb-nav-panel" className="fb-nav-panel">
          <ul className="fb-links">
            <li>
              <Link
                to="/"
                className={location.pathname === '/' ? 'active' : ''}
                onClick={closeMenu}
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                to="/listings"
                className={location.pathname === '/listings' ? 'active' : ''}
                onClick={closeMenu}
              >
                Listings
              </Link>
            </li>
            {user && (
              <li className="fb-links-dashboard">
                <Link to={`/${user.role}-dashboard`} onClick={closeMenu}>
                  Dashboard
                </Link>
              </li>
            )}
          </ul>

          <div className="fb-actions">
            <button
              type="button"
              className="nav-btn nav-btn-icon nav-btn-ghost theme-toggle"
              onClick={toggleTheme}
              aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              aria-pressed={theme === 'dark'}
            >
              <span aria-hidden="true">{theme === 'light' ? '☀️' : '🌙'}</span>
            </button>
            {authActions}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
