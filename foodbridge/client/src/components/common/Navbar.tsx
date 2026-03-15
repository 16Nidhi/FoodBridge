import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import './Navbar.css';

const Navbar: React.FC = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled]  = useState(false);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const user = useSelector((state: any) => state.auth.user);
    const isDashboard = location.pathname.includes('-dashboard');

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
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
                        {theme === 'light' ? '🌙' : '☀️'}
                    </button>
                    {user ? (
                        <>
                            <span className="nav-role-badge">{user.role}</span>
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
