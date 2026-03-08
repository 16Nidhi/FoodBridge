import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './Navbar.css';

const Navbar: React.FC = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled]  = useState(false);
    const location = useLocation();
    const user = useSelector((state: any) => state.auth.user);
    const isDashboard = location.pathname.startsWith('/dashboard');

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Close mobile menu on route change
    useEffect(() => { setMenuOpen(false); }, [location.pathname]);

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
                    {user && <li><Link to="/dashboard">Dashboard</Link></li>}
                </ul>

                <div className="fb-actions">
                    {user ? (
                        <>
                            <span className="nav-role-badge">{user.role}</span>
                            <Link to="/dashboard" className="nav-btn nav-btn-primary">My Dashboard</Link>
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
