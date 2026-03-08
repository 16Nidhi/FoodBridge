import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer: React.FC = () => (
  <footer className="fb-footer">
    <div className="inner">
      <div className="footer-brand">
        <div className="brand-name">🌿 FoodBridge</div>
        <p>Turning surplus food into shared hope. Connecting donors, volunteers and NGOs to fight food waste — one meal at a time.</p>
        <div className="footer-socials">
          <a href="#" aria-label="Twitter">𝕏</a>
          <a href="#" aria-label="LinkedIn">in</a>
          <a href="#" aria-label="Instagram">ig</a>
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
        <h4>Support</h4>
        <ul>
          <li><a href="#">Help Center</a></li>
          <li><a href="#">Privacy Policy</a></li>
          <li><a href="#">Terms</a></li>
          <li><a href="#">Contact</a></li>
        </ul>
      </div>
    </div>

    <div className="footer-bar">
      © {new Date().getFullYear()} FoodBridge — Made with ❤️ to fight food waste.
    </div>
  </footer>
);

export default Footer;