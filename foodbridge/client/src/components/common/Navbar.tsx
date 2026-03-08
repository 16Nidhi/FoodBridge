import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './Navbar.css';

const Navbar: React.FC = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const location = useLocation();
    const user = useSelector((state: any) => state.auth.user);
    const isDashboard = location.pathname.startsWith('/dashboard');

    if (isDashboard) return null; // Dashboards render their own sidebar

    return (
        <nav className="fb-nav">
            <div className="inner">
                {/* Brand */}
                <Link to="/" className="fb-brand">
                    <span className="leaf">🌿</span> FoodBridge
                </Link>

                {/* Links */}
                <ul className={`fb-links ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(false)}>
                    <li><Link to="/" className={location.pathname === '/' ? 'active' : ''}>Home</Link></li>
                    <li><Link to="/listings" className={location.pathname === '/listings' ? 'active' : ''}>Listings</Link></li>
                    {user && <li><Link to="/dashboard">Dashboard</Link></li>}
                </ul>

                {/* Actions */}
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

                {/* Mobile toggle */}
                <button className="fb-toggle" aria-label="Toggle menu" onClick={() => setMenuOpen(o => !o)}>
                    <span></span><span></span><span></span>
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
