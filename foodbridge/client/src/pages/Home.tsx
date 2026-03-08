import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const features = [
  { emoji: '🍽️', title: 'Log Surplus Food', desc: 'Restaurants, hotels and households log leftover food in under 2 minutes with photo, quantity and pickup window.' },
  { emoji: '🚴', title: 'Volunteer Pickup',  desc: 'Nearby volunteers get instant notifications, view the live map route and accept pickups with one tap.' },
  { emoji: '🏢', title: 'NGO Distribution',  desc: 'Partner NGOs receive, verify and log incoming donations, then distribute meals to beneficiaries.' },
  { emoji: '📊', title: 'Impact Dashboard',  desc: 'Every stakeholder sees real-time analytics — donations saved, meals served and CO\u2082 prevented.' },
  { emoji: '🗺️', title: 'Live Rescue Map',  desc: 'View active pickups, donor locations and NGO shelters on an interactive map updated in real time.' },
  { emoji: '🔔', title: 'Smart Alerts',      desc: 'Role-based notifications ensure the right person is always informed at the right moment.' },
];

const stats = [
  { num:'158+',  label:'Donations this month' },
  { num:'1.4k',  label:'Meals rescued' },
  { num:'42',    label:'Active NGOs' },
  { num:'200+',  label:'Volunteers' },
];

const Home: React.FC = () => (
  <div className="home">

    {/* ─── HERO ─── */}
    <section className="home-hero">
      <div className="home-hero__bg">
        <div className="orb orb-a"></div>
        <div className="orb orb-b"></div>
      </div>
      <div className="home-hero__inner container">
        <div className="hero-content">
          <span className="hero-pill">🌱 Fighting Food Waste, One Meal at a Time</span>
          <h1 className="hero-title">
            Turning Surplus Food<br/>
            Into <span className="grad">Shared Hope</span>
          </h1>
          <p className="hero-desc">
            FoodBridge connects restaurants, hotels & households with local NGOs and volunteers — ensuring surplus food reaches those who need it most.
          </p>
          <div className="hero-btns">
            <Link to="/register" className="hbtn hbtn-primary">
              ❤️ Donate Food
            </Link>
            <Link to="/register" className="hbtn hbtn-secondary">
              🚴 Become Volunteer
            </Link>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-globe">
            <div className="globe-core">🌿</div>
            <div className="globe-ring r1"></div>
            <div className="globe-ring r2"></div>
            <div className="globe-ring r3"></div>
          </div>
          <div className="floater f1"><span>✅</span> Donation Accepted! &nbsp;<em>Sunshine Hotel · 45 kg</em></div>
          <div className="floater f2"><span>🚴</span> Volunteer on the way &nbsp;<em>ETA 8 min</em></div>
          <div className="floater f3"><span>🍽️</span> 200 Meals Served! &nbsp;<em>City Care NGO</em></div>
        </div>
      </div>
    </section>

    {/* ─── STATS BAR ─── */}
    <section className="home-stats">
      <div className="container stats-inner">
        {stats.map(s => (
          <div className="stat" key={s.label}>
            <div className="stat-num">{s.num}</div>
            <div className="stat-lbl">{s.label}</div>
          </div>
        ))}
      </div>
    </section>

    {/* ─── HOW IT WORKS ─── */}
    <section className="home-how container">
      <span className="pill pill-green">How It Works</span>
      <h2 className="section-title">The <span className="grad">FoodBridge</span> Flow</h2>
      <div className="flow-grid">
        {[
          { n:'01', icon:'🍽️', color:'#10B981', title:'Log Food',       desc:'Donors log surplus food with photo, quantity and expiry window.' },
          { n:'02', icon:'🚴',       color:'#2563EB', title:'Pickup',         desc:'Volunteers get notified, accept pickup and navigate via map.' },
          { n:'03', icon:'🏢',       color:'#F97316', title:'NGO Receives',   desc:'NGOs receive & verify the donation straight into their dashboard.' },
          { n:'04', icon:'🍽️', color:'#8B5CF6', title:'Meals Served',   desc:'Food reaches families, shelters & communities — zero waste.' },
        ].map(s => (
          <div className="flow-step" key={s.n}>
            <div className="step-num">{s.n}</div>
            <div className="step-icon" style={{background:s.color}}>{s.icon}</div>
            <h3>{s.title}</h3>
            <p>{s.desc}</p>
          </div>
        ))}
      </div>
    </section>

    {/* ─── FEATURES ─── */}
    <section className="home-features">
      <div className="container">
        <span className="pill pill-blue">Features</span>
        <h2 className="section-title">Tools Built for <span className="accent">Every Role</span></h2>
        <div className="feat-grid">
          {features.map(f => (
            <div className="feat" key={f.title}>
              <div className="feat-emoji">{f.emoji}</div>
              <h3 className="feat-title">{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ─── CTA ─── */}
    <section className="home-cta">
      <div className="container cta-inner">
        <h2>Ready to Make a Difference?</h2>
        <p>Join thousands of donors, volunteers and NGOs already using FoodBridge.</p>
        <div className="cta-btns">
          <Link to="/register" className="hbtn hbtn-white">❤️ Donate Food Today</Link>
          <Link to="/register" className="hbtn hbtn-outline">👥 Join as Volunteer</Link>
        </div>
      </div>
    </section>

  </div>
);

export default Home;