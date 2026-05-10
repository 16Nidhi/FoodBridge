import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { getMyNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../../services/api';
import { Notification } from '../../types';
import './Navbar.css';

const Navbar: React.FC = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);

    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const user = useSelector((state: any) => state.auth.user);
    const isDashboard = location.pathname.includes('-dashboard');

    const unreadCount = notifications.filter(n => !n.read).length;

    // Fetch notifications periodically
    useEffect(() => {
        if (!user) return;
        const fetchNotifications = async () => {
            try {
                const res = await getMyNotifications();
                setNotifications(res.data.notifications);
            } catch (error) {
                console.error("Failed to fetch notifications:", error);
            }
        };

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000); // every minute
        return () => clearInterval(interval);
    }, [user]);

    // Close notifications dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleNotificationClick = async (notif: Notification) => {
        if (!notif.read) {
            await markNotificationAsRead(notif._id);
            setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, read: true } : n));
        }
        if (notif.link) navigate(notif.link);
        setShowNotifications(false);
    };

    const handleMarkAllRead = async () => {
        await markAllNotificationsAsRead();
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    // Close mobile menu on route change
    useEffect(() => { setMenuOpen(false); }, [location.pathname]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        dispatch(logout());
        navigate('/');
    };

    // Include the dark mode toggle even if we are not rendering the full navbar on dashboard.
    // Actually, on dashboard we might want it too. Let's add it to dashboard sidebar or topbar if possible, 
    // but for now let's just make it available in the main Navbar. If `isDashboard`, we usually return null.
    if (isDashboard) return null;

    return (
        <nav className={`fb-nav${scrolled ? ' scrolled' : ''}`}>
            <div className="inner">
                <Link to="/" className="fb-brand">
                    <span className="leaf">🌿</span> FoodBridge
                </Link>

                <ul className={`fb-links${menuOpen ? ' open' : ''}`}>
                    <li><Link to="/" className={location.pathname === '/' ? 'active' : ''}>Home</Link></li>
                    <li><Link to="/listings" className={location.pathname === '/listings' ? 'active' : ''}>Listings</Link></li>
                    {user && <li><Link to={`/${user.role}-dashboard`}>Dashboard</Link></li>}
                </ul>

                <div className="fb-actions">
                    <button className="nav-btn nav-btn-ghost theme-toggle" onClick={toggleTheme} aria-label="Toggle theme" style={{ padding: '8px', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {theme === 'light' ? '☀️' : '🌙'}
                    </button>
                    {user ? (
                        <>
                            <div className="notification-wrapper" ref={notificationRef}>
                                <button className="nav-btn nav-btn-ghost notification-btn" onClick={() => setShowNotifications(s => !s)}>
                                    🔔
                                    {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                                </button>
                                {showNotifications && (
                                    <div className="notification-dropdown">
                                        <div className="notification-header">
                                            <h3>Notifications</h3>
                                            <button onClick={handleMarkAllRead} disabled={unreadCount === 0}>Mark all as read</button>
                                        </div>
                                        <div className="notification-list">
                                            {notifications.length === 0 ? (
                                                <p className="no-notifications">No notifications yet.</p>
                                            ) : (
                                                notifications.map(notif => (
                                                    <div key={notif._id} className={`notification-item ${!notif.read ? 'unread' : ''}`} onClick={() => handleNotificationClick(notif)}>
                                                        <p>{notif.message}</p>
                                                        <small>{new Date(notif.createdAt).toLocaleString()}</small>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <span className="nav-role-badge">{user.role}</span>
                            <Link to="/profile" className="nav-btn nav-btn-ghost">Profile</Link>
                            <Link to={`/${user.role}-dashboard`} className="nav-btn nav-btn-primary">My Dashboard</Link>
                            <button onClick={handleLogout} className="nav-btn nav-btn-ghost">Logout</button>
                        </>
                    ) : (
                        <>
                            <Link to="/login"    className="nav-btn nav-btn-ghost">Login</Link>
                            <Link to="/register" className="nav-btn nav-btn-primary">Get Started →</Link>
                        </>
                    )}
                </div>

                <button
                    className={`fb-toggle${menuOpen ? ' open' : ''}`}
                    aria-label="Toggle menu"
                    onClick={() => setMenuOpen(o => !o)}
                >
                    <span></span><span></span><span></span>
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
