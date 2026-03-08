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

function Counter({ target, suffix }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

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

  return React.createElement("div", { ref, className: "counter-num" }, count.toLocaleString() + suffix);
}

const Home = () => {
  useEffect(() => {
    AOS.init({ duration: 700, easing: "ease-out-cubic", once: true, offset: 60 });
  }, []);

  return (
    <div className="home">

      <section className="home-hero">
        <div className="home-hero__bg">
          <div className="orb orb-a"></div>
          <div className="orb orb-b"></div>
          <div className="orb orb-c"></div>
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

      <section className="home-how container">
        <span className="pill pill-green" data-aos="fade-up">How It Works</span>
        <h2 className="section-title" data-aos="fade-up" data-aos-delay="60">The <span className="grad">FoodBridge</span> Flow</h2>
        <div className="flow-grid">
          {[
            { n:"01", icon:"🍽️", color:"#10B981", title:"Log Food",     desc:"Donors log surplus food with photo, quantity and expiry window." },
            { n:"02", icon:"🚴", color:"#2563EB", title:"Pickup",       desc:"Volunteers get notified, accept pickup and navigate via map." },
            { n:"03", icon:"🏢", color:"#F97316", title:"NGO Receives", desc:"NGOs receive & verify the donation straight into their dashboard." },
            { n:"04", icon:"🎉", color:"#8B5CF6", title:"Meals Served", desc:"Food reaches families, shelters & communities — zero waste." },
          ].map((s, i) => (
            <div className="flow-step glass-card" key={s.n} data-aos="fade-up" data-aos-delay={i * 100}>
              <div className="step-num">{s.n}</div>
              <div className="step-icon" style={{ background: s.color }}>{s.icon}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
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

      <section className="home-cta" data-aos="fade-up">
        <div className="container cta-inner">
          <div className="cta-badge">🚀 Join 500+ Members</div>
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
};

export default Home;
