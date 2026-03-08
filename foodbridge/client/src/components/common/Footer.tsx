import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) { setSubscribed(true); setEmail(''); }
  };

  return (
    <footer className="fb-footer">
      <div className="inner">
        <div className="footer-brand">
          <div className="brand-name">🌿 FoodBridge</div>
          <p>Turning surplus food into shared hope. Connecting donors, volunteers and NGOs to fight food waste — one meal at a time.</p>
          <div className="footer-socials">
            <a href="#" aria-label="Twitter"  title="Twitter"><i className="fab fa-x-twitter"></i></a>
            <a href="#" aria-label="LinkedIn" title="LinkedIn"><i className="fab fa-linkedin-in"></i></a>
            <a href="#" aria-label="Instagram" title="Instagram"><i className="fab fa-instagram"></i></a>
            <a href="#" aria-label="GitHub"   title="GitHub"><i className="fab fa-github"></i></a>
          </div>
        </div>

        <div className="footer-col">
          <h4>Platform</h4>
          <ul>
            <li><Link to="/register">Donate Food</Link></li>
            <li><Link to="/register">Volunteer</Link></li>
            <li><Link to="/register">For NGOs</Link></li>
            <li><Link to="/listings">View Listings</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Company</h4>
          <ul>
            <li><a href="#">About Us</a></li>
            <li><a href="#">Impact Report</a></li>
            <li><a href="#">Blog</a></li>
            <li><a href="#">Partners</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Newsletter</h4>
          <p className="newsletter-desc">Get weekly impact updates, new features and rescue stories.</p>
          {subscribed ? (
            <div className="newsletter-thanks">🎉 Thanks for subscribing!</div>
          ) : (
            <form className="newsletter-form" onSubmit={handleSubscribe}>
              <input
                type="email" placeholder="Enter your email"
                value={email} onChange={e => setEmail(e.target.value)} required
              />
              <button type="submit">Subscribe</button>
            </form>
          )}
        </div>
      </div>

      <div className="footer-bar">
        <span>© {new Date().getFullYear()} FoodBridge — Made with ❤️ to fight food waste.</span>
        <div className="footer-bar-links">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Contact</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;