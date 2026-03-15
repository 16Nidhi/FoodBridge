import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";
import "./Home.css";

const features = [
  { emoji: "🍽️", title: "Log Surplus Food",  badge: "Donor",     color: "#10B981", desc: "Log leftover food in 2 minutes with photo, quantity and pickup window." },
  { emoji: "🚴",  title: "Volunteer Pickup",  badge: "Volunteer", color: "#2563EB", desc: "Get instant notifications, view live map routes and accept pickups with one tap." },
  { emoji: "🏢",  title: "NGO Distribution",  badge: "NGO",       color: "#F97316", desc: "Receive, verify and log incoming donations then distribute meals to beneficiaries." },
  { emoji: "📊",  title: "Impact Dashboard",  badge: "All Roles", color: "#8B5CF6", desc: "Real-time analytics — donations saved, meals served and CO₂ prevented." },
  { emoji: "🗺️", title: "Live Rescue Map",   badge: "Live",      color: "#EC4899", desc: "Active pickups, donor locations and NGO shelters on an interactive map." },
  { emoji: "🔔",  title: "Smart Alerts",      badge: "Instant",   color: "#F59E0B", desc: "Role-based notifications ensure the right person is informed at the right moment." },
];

const counterData = [
  { target: 12400, label: "Meals Saved",       suffix: "+", icon: "🍽️" },
  { target: 3200,  label: "kg Food Rescued",   suffix: "+", icon: "♻️" },
  { target: 200,   label: "Active Volunteers", suffix: "+", icon: "🚴"  },
  { target: 18,    label: "Cities Connected",  suffix: "",  icon: "🌆"  },
];

const testimonials = [
  { name: "Priya Sharma", role: "NGO Director · HelpHands", text: "FoodBridge has transformed how we source food. We now serve 40% more families with zero extra cost.", avatar: "👩‍💼" },
  { name: "Rahul Mehta",  role: "Head Chef · Taj Hotels",   text: "We used to discard 30 kg of food daily. Now every meal finds a family. This platform is a game changer.", avatar: "👨‍🍳" },
  { name: "Ananya Singh", role: "Volunteer",                 text: "My weekend pickups feel meaningful. The map UI is so smooth — I can do 3 pickups in 2 hours easily.", avatar: "🧑‍🤝‍🧑" },
];

const impactStories = [
  { img: "🍲", title: "A Second Chance for 500 Meals", ngo: "City Shelter", people: 500, story: "Leftover banquet food from a tech conference was safely transported within 45 minutes, feeding hundreds of families in need." },
  { img: "🥪", title: "Weekly Bakery Rescues", ngo: "Morning Hope", people: 120, story: "Freshly baked surplus bread from downtown cafes is now automatically routed to local orphanages every single evening." },
  { img: "🍱", title: "Corporate Lunch Saved", ngo: "TechCare", people: 85, story: "Daily cafeteria excesses from a fortune 500 company have found a steady pipeline straight to elder care homes across the city." }
];

const topVolunteers = [
  { rank: 1, name: "Arjun Desai", deliveries: 142, rating: "4.9", badge: "🥇" },
  { rank: 2, name: "Sara Khan", deliveries: 128, rating: "4.9", badge: "🥈" },
  { rank: 3, name: "David Chen", deliveries: 115, rating: "4.8", badge: "🥉" },
  { rank: 4, name: "Priya Sharma", deliveries: 98, rating: "4.8", badge: "🏅" }
];

function Counter({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);
  const started = useRef<boolean>(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const steps = 60;
          const increment = target / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) { setCount(target); clearInterval(timer); }
            else setCount(Math.floor(current));
          }, 2000 / steps);
        }
      },
      { threshold: 0.4 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <div ref={ref} className="counter-num">{count.toLocaleString() + suffix}</div>;
}

const Home = () => {
  useEffect(() => {
    AOS.init({ 
      duration: 850, 
      easing: "ease-out-cubic", 
      once: true, 
      offset: 80,
      delay: 50
    });
  }, []);

  return (
    <div className="home">

      <section className="home-hero">
        <div className="home-hero__bg">
          <div className="orb orb-a"></div>
          <div className="orb orb-b"></div>
          <div className="orb orb-c"></div>
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
        <div className="home-hero__inner container">
          <div className="hero-content">
            <span className="hero-pill" data-aos="fade-down">🌱 Fighting Food Waste, One Meal at a Time</span>
            <h1 className="hero-title" data-aos="fade-up" data-aos-delay="80">
              Turning Surplus Food<br/>
              Into <span className="grad">Shared Hope</span>
            </h1>
            <p className="hero-desc" data-aos="fade-up" data-aos-delay="160">
              FoodBridge connects restaurants, hotels &amp; households with local NGOs and volunteers — ensuring surplus food reaches those who need it most.
            </p>
            <div className="hero-btns" data-aos="fade-up" data-aos-delay="240">
              <Link to="/register" className="hbtn hbtn-primary">❤️ Donate Food</Link>
              <Link to="/register" className="hbtn hbtn-secondary">🚴 Become Volunteer</Link>
            </div>
            <div className="hero-trust" data-aos="fade-up" data-aos-delay="320">
              <span>✅ Free to join</span>
              <span>🔒 Verified NGOs only</span>
              <span>⚡ Real-time updates</span>
            </div>
          </div>

          <div className="hero-visual" data-aos="fade-left" data-aos-delay="200">
            <div className="hero-globe">
              <div className="globe-core">🌿</div>
              <div className="globe-ring r1"></div>
              <div className="globe-ring r2"></div>
              <div className="globe-ring r3"></div>
            </div>
            <div className="floater f1 glass-card"><span>✅</span> Donation Accepted! &nbsp;<em>Sunshine Hotel · 45 kg</em></div>
            <div className="floater f2 glass-card"><span>🚴</span> Volunteer on the way &nbsp;<em>ETA 8 min</em></div>
            <div className="floater f3 glass-card"><span>🍽️</span> 200 Meals Served! &nbsp;<em>City Care NGO</em></div>
          </div>
        </div>
      </section>

      <section className="home-counters">
        <div className="container counters-inner">
          {counterData.map((c, i) => (
            <div className="counter-card glass-card" key={c.label} data-aos="zoom-in" data-aos-delay={i * 80}>
              <div className="counter-icon">{c.icon}</div>
              <Counter target={c.target} suffix={c.suffix} />
              <div className="counter-lbl">{c.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="home-journey">
        <div className="container">
          <div className="journey-header">
            <span className="pill pill-green" data-aos="fade-up">The Journey</span>
            <h2 className="section-title" data-aos="fade-up" data-aos-delay="60">How <span className="grad">FoodBridge</span> Works</h2>
          </div>
          <div className="timeline">
            {[
              { n:"01", icon:"🍽️", title:"Donor posts surplus food", desc:"Restaurants log leftover food with photo, quantity and expiry window in just 2 minutes." },
              { n:"02", icon:"🚴", title:"Volunteer accepts pickup", desc:"Local verified volunteers get instant pings, accept the run and navigate via the live map." },
              { n:"03", icon:"✅", title:"Food safely collected", desc:"Volunteers arrive at the venue, verify the meal quality and secure the package for transit." },
              { n:"04", icon:"🏢", title:"Delivered to NGO", desc:"The NGO receives the delivery straight into their dashboard, confirming safe arrival." },
              { n:"05", icon:"🎉", title:"Meals served to communities", desc:"Nutritious food reaches families, shelters and communities before it goes to waste." },
            ].map((s, i) => (
              <div className="timeline-item" key={s.n} data-aos={i % 2 === 0 ? "fade-right" : "fade-left"} data-aos-delay={i * 100}>
                <div className="timeline-icon">
                  <div className="t-icon-inner">{s.icon}</div>
                </div>
                <div className="timeline-content glass-card">
                  <span className="t-num">{s.n}</span>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="home-features">
        <div className="container">
          <span className="pill pill-blue" data-aos="fade-up">Features</span>
          <h2 className="section-title" data-aos="fade-up" data-aos-delay="60">Tools Built for <span className="accent">Every Role</span></h2>
          <div className="feat-grid">
            {features.map((f, i) => (
              <div className="feat glass-card" key={f.title} data-aos="fade-up" data-aos-delay={i * 80}>
                <div className="feat-header">
                  <div className="feat-emoji">{f.emoji}</div>
                  <span className="feat-badge" style={{ background: f.color + "20", color: f.color }}>{f.badge}</span>
                </div>
                <h3 className="feat-title">{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="home-testimonials">
        <div className="container">
          <span className="pill pill-green" data-aos="fade-up">Testimonials</span>
          <h2 className="section-title" data-aos="fade-up" data-aos-delay="60">Loved by Donors, <span className="grad">NGOs &amp; Volunteers</span></h2>
          <div className="testi-grid">
            {testimonials.map((t, i) => (
              <div className="testi-card glass-card" key={t.name} data-aos="fade-up" data-aos-delay={i * 100}>
                <div className="testi-stars">★★★★★</div>
                <p className="testi-text">"{t.text}"</p>
                <div className="testi-author">
                  <div className="testi-avatar">{t.avatar}</div>
                  <div>
                    <div className="testi-name">{t.name}</div>
                    <div className="testi-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="home-impact">
        <div className="container">
          <span className="pill pill-blue" data-aos="fade-up">Real impact</span>
          <h2 className="section-title" data-aos="fade-up" data-aos-delay="60">Stories of <span className="accent">Change</span></h2>
          <div className="impact-grid">
            {impactStories.map((story, i) => (
              <div className="impact-card glass-card" key={i} data-aos="fade-up" data-aos-delay={i * 100}>
                <div className="impact-img">{story.img}</div>
                <div className="impact-body">
                  <h3>{story.title}</h3>
                  <p>{story.story}</p>
                  <div className="impact-meta">
                    <span>🏢 {story.ngo}</span>
                    <span>🫂 {story.people} helped</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="home-leaderboard">
        <div className="container">
          <div className="lb-header">
            <div>
              <span className="pill pill-green" data-aos="fade-up">Community</span>
              <h2 className="section-title" data-aos="fade-up" data-aos-delay="60">Top <span className="grad">Hunger Heroes</span></h2>
            </div>
            <Link to="/register" className="hbtn hbtn-secondary" data-aos="fade-left">Join the squad</Link>
          </div>
          <div className="lb-grid">
            {topVolunteers.map((vol, i) => (
              <div className="lb-card glass-card" key={vol.rank} data-aos="flip-up" data-aos-delay={i * 80}>
                <div className="lb-rank">{vol.badge}</div>
                <div className="lb-info">
                  <h4>{vol.name}</h4>
                  <span>⭐ {vol.rating}</span>
                </div>
                <div className="lb-score">
                  <strong>{vol.deliveries}</strong> 
                  <small>Deliveries</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="home-cta-new" data-aos="fade-up">
        <div className="container">
          <div className="cta-new-inner glass-card">
            <div className="cta-head">
              <h2>Start Your <span className="grad">Impact Journey</span> Today.</h2>
              <p>Whether you're a restaurant with surplus food, an NGO needing meals, or a volunteer wanting to help — there's a place for you.</p>
            </div>
            <div className="cta-actions">
              <Link to="/register" className="hbtn hbtn-primary">❤️ Donate Food</Link>
              <Link to="/register" className="hbtn hbtn-secondary">🚴 Become Volunteer</Link>
              <Link to="/register" className="hbtn hbtn-outline-dark">🏢 Partner as NGO</Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
