import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getAllDonations } from "../services/api";
import { Donation } from "../types";
import "./Home.css";

const counterData = [
  { target: 12400, label: "Meals Saved", suffix: "+" },
  { target: 3200, label: "kg Food Rescued", suffix: "+" },
  { target: 200, label: "Active Volunteers", suffix: "+" },
  { target: 18, label: "Cities Connected", suffix: "" },
];

const journeySteps = [
  {
    icon: "🍽️",
    title: "Donor posts surplus food",
    desc: "Add what you have, when it can be picked up, and where.",
  },
  {
    icon: "🚴",
    title: "Volunteer accepts pickup",
    desc: "Someone nearby claims the run and heads to you.",
  },
  {
    icon: "✅",
    title: "Food is collected safely",
    desc: "The pickup is verified and transported with care.",
  },
  {
    icon: "🏢",
    title: "NGO receives the delivery",
    desc: "Partner organizations confirm arrival in their dashboard.",
  },
  {
    icon: "🎉",
    title: "Meals reach people nearby",
    desc: "Surplus food becomes meals before it goes to waste.",
  },
];

const roles = [
  {
    emoji: "🍽️",
    title: "Donors",
    outcome: "Turn tonight's extra food into tomorrow's meals.",
    cta: "Donate Food",
    to: "/register",
    accent: "#10B981",
  },
  {
    emoji: "🚴",
    title: "Volunteers",
    outcome: "Pick up nearby surplus and deliver it where it's needed.",
    cta: "Join Rescue Network",
    to: "/register",
    accent: "#2563EB",
  },
  {
    emoji: "🏢",
    title: "NGOs",
    outcome: "Receive verified donations and serve your community faster.",
    cta: "Partner as NGO",
    to: "/register",
    accent: "#F97316",
  },
];

function Counter({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const steps = 50;
          const increment = target / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, 1600 / steps);
        }
      },
      { threshold: 0.35 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <div ref={ref} className="counter-num">
      {count.toLocaleString()}
      {suffix}
    </div>
  );
}

function formatPickupTime(value: string | Date) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Pickup time TBD";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const Home = () => {
  const [listings, setListings] = useState<Donation[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getAllDonations();
        if (!cancelled) {
          const pending = data.filter((d) => d.status === "pending");
          setListings(pending.slice(0, 3));
        }
      } catch {
        if (!cancelled) setListings([]);
      } finally {
        if (!cancelled) setListingsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="home">
      <section className="home-hero">
        <div className="home-hero__bg" aria-hidden="true" />
        <div className="home-hero__inner container">
          <div className="hero-content">
            <p className="hero-eyebrow">Food rescue, locally</p>
            <h1 className="hero-title">
              Your extra food can feed nearby people{" "}
              <span className="grad">before it goes to waste</span>
            </h1>
            <p className="hero-desc">
              FoodBridge connects households, restaurants, and caterers with
              volunteers and NGOs — so surplus meals reach people in your area,
              not the bin.
            </p>
            <div className="hero-btns">
              <Link to="/register" className="hbtn hbtn-primary">
                Donate Food
              </Link>
              <Link to="/register" className="hbtn hbtn-secondary">
                Join Rescue Network
              </Link>
            </div>
            <p className="hero-trust">
              Free to join · Verified NGO partners · Real-time pickup updates
            </p>
          </div>
        </div>
      </section>

      <section className="home-counters" aria-label="Impact statistics">
        <div className="container counters-inner">
          {counterData.map((c) => (
            <div className="counter-card" key={c.label}>
              <Counter target={c.target} suffix={c.suffix} />
              <div className="counter-lbl">{c.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="home-journey">
        <div className="container">
          <div className="section-header">
            <p className="section-eyebrow">How it works</p>
            <h2 className="section-title">
              From surplus to served <span className="grad">in five steps</span>
            </h2>
            <p className="section-lead">
              A simple path from posting food to feeding your community.
            </p>
          </div>
          <ol className="journey-steps">
            {journeySteps.map((step, i) => (
              <li className="journey-step" key={step.title}>
                <span className="journey-step__num">{i + 1}</span>
                <span className="journey-step__icon" aria-hidden="true">
                  {step.icon}
                </span>
                <div className="journey-step__body">
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="home-roles">
        <div className="container">
          <div className="section-header">
            <p className="section-eyebrow">Who it's for</p>
            <h2 className="section-title">
              One network, <span className="grad">three ways to help</span>
            </h2>
            <p className="section-lead">
              Choose the role that fits you — every contribution moves food to
              people who need it.
            </p>
          </div>
          <div className="roles-grid">
            {roles.map((role) => (
              <article className="role-card" key={role.title}>
                <span className="role-card__emoji" aria-hidden="true">
                  {role.emoji}
                </span>
                <h3>{role.title}</h3>
                <p>{role.outcome}</p>
                <Link
                  to={role.to}
                  className="role-card__link"
                  style={{ color: role.accent }}
                >
                  {role.cta} →
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="home-listings">
        <div className="container">
          <div className="section-header section-header--row">
            <div>
              <p className="section-eyebrow">Live near you</p>
              <h2 className="section-title">Available food listings</h2>
              <p className="section-lead">
                Surplus meals waiting for pickup in the rescue network.
              </p>
            </div>
            <Link to="/listings" className="hbtn hbtn-secondary hbtn-sm">
              View all listings
            </Link>
          </div>

          {listingsLoading ? (
            <p className="listings-status">Loading nearby listings…</p>
          ) : listings.length === 0 ? (
            <div className="listings-empty">
              <p>No pending listings right now.</p>
              <Link to="/register" className="hbtn hbtn-primary hbtn-sm">
                Be the first to donate
              </Link>
            </div>
          ) : (
            <div className="listings-preview-grid">
              {listings.map((listing) => (
                <article className="listing-preview-card" key={listing._id}>
                  <div className="listing-preview-card__top">
                    <h3>{listing.foodItem}</h3>
                    <span
                      className={`listing-status listing-status--${listing.status}`}
                    >
                      {listing.status}
                    </span>
                  </div>
                  <p className="listing-preview-card__qty">{listing.quantity}</p>
                  <p className="listing-preview-card__meta">
                    📍 {listing.pickupLocation}
                  </p>
                  <p className="listing-preview-card__meta">
                    🕐 {formatPickupTime(listing.pickupTime)}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="home-cta">
        <div className="container">
          <div className="cta-inner">
            <h2>Ready to put surplus food on someone's plate?</h2>
            <p>
              Join donors, volunteers, and NGOs already rescuing meals in your
              city.
            </p>
            <div className="cta-btns">
              <Link to="/register" className="hbtn hbtn-primary">
                Donate Food
              </Link>
              <Link to="/register" className="hbtn hbtn-secondary">
                Join Rescue Network
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
