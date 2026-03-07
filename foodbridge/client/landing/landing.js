/* ================================================
   FOODBRIDGE LANDING PAGE — JAVASCRIPT
   - AOS scroll animations
   - Navbar scroll behaviour
   - Mobile menu
   - Chart.js impact charts
   - Leaflet.js food rescue map
   - Live rescue counter simulation
   ================================================ */

'use strict';

/* ── AOS INITIALISATION ── */
AOS.init({
  duration: 720,
  easing: 'ease-out-cubic',
  once: true,
  offset: 70,
});

/* ── NAVBAR SCROLL BEHAVIOUR ── */
const navbar = document.getElementById('navbar');
let lastScrollY = 0;

window.addEventListener('scroll', () => {
  const y = window.scrollY;
  if (y > 60) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
  lastScrollY = y;
}, { passive: true });

/* ── MOBILE MENU TOGGLE ── */
const navToggle = document.getElementById('navToggle');
const navLinks  = document.getElementById('navLinks');

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    const isOpen = navLinks.classList.contains('active');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!navbar.contains(e.target)) {
      navLinks.classList.remove('active');
    }
  });
}

/* ── SMOOTH SCROLL (non-React anchor links) ── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
      navLinks && navLinks.classList.remove('active');
    }
  });
});

/* ================================================
   CHART.JS — IMPACT CHARTS
   ================================================ */

// Shared tooltip / style defaults for dark backgrounds
Chart.defaults.color = '#64748B';
Chart.defaults.font.family = "'Inter', sans-serif";

const tooltipDefaults = {
  backgroundColor: 'rgba(15,23,42,0.92)',
  titleColor: '#F8FAFC',
  bodyColor: '#94A3B8',
  borderColor: 'rgba(255,255,255,0.08)',
  borderWidth: 1,
  padding: 12,
  cornerRadius: 10,
};

function initCharts() {
  /* ── 1. Meals Saved — Line Chart ── */
  const mealsEl = document.getElementById('mealsChart');
  if (mealsEl) {
    new Chart(mealsEl, {
      type: 'line',
      data: {
        labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
        datasets: [{
          label: 'Meals Saved',
          data: [1200, 1850, 2400, 2150, 3300, 3900, 4200, 4750, 5200, 5700, 6300, 7500],
          borderColor: '#10B981',
          backgroundColor: 'rgba(16,185,129,0.10)',
          borderWidth: 2.5,
          fill: true,
          tension: 0.45,
          pointBackgroundColor: '#10B981',
          pointRadius: 4,
          pointHoverRadius: 6,
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: tooltipDefaults,
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: '#475569', font: { size: 11 } },
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: '#475569', font: { size: 11 } },
            beginAtZero: true,
          },
        },
      },
    });
  }

  /* ── 2. Food Categories — Doughnut Chart ── */
  const catEl = document.getElementById('categoriesChart');
  if (catEl) {
    new Chart(catEl, {
      type: 'doughnut',
      data: {
        labels: ['Cooked Meals','Bakery','Fruits & Veg','Dairy','Grains','Others'],
        datasets: [{
          data: [35, 20, 18, 12, 10, 5],
          backgroundColor: ['#10B981','#2563EB','#F97316','#8B5CF6','#EF4444','#475569'],
          borderColor: '#111827',
          borderWidth: 3,
          hoverOffset: 10,
        }],
      },
      options: {
        responsive: true,
        cutout: '64%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#64748B',
              font: { size: 11 },
              usePointStyle: true,
              padding: 14,
            },
          },
          tooltip: tooltipDefaults,
        },
      },
    });
  }

  /* ── 3. NGOs Connected — Bar Chart ── */
  const ngosEl = document.getElementById('ngosChart');
  if (ngosEl) {
    new Chart(ngosEl, {
      type: 'bar',
      data: {
        labels: ['Q1 2025','Q2 2025','Q3 2025','Q4 2025','Q1 2026'],
        datasets: [{
          label: 'NGOs Connected',
          data: [12, 24, 38, 55, 78],
          backgroundColor: [
            'rgba(37,99,235,0.75)',
            'rgba(37,99,235,0.75)',
            'rgba(37,99,235,0.75)',
            'rgba(37,99,235,0.75)',
            'rgba(16,185,129,0.9)',
          ],
          borderRadius: 8,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: tooltipDefaults,
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: '#475569', font: { size: 11 } },
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: '#475569', font: { size: 11 } },
            beginAtZero: true,
          },
        },
      },
    });
  }
}

/* ================================================
   LEAFLET.JS — FOOD RESCUE MAP
   ================================================ */
function initMap() {
  const mapEl = document.getElementById('foodRescueMap');
  if (!mapEl) return;

  const map = L.map('foodRescueMap', {
    center: [28.6139, 77.2090],
    zoom: 13,
    zoomControl: true,
    scrollWheelZoom: false,
    attributionControl: true,
  });

  // OpenStreetMap tiles (free, no API key)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(map);

  /* ── Custom marker factory ── */
  function makeIcon(bg, faClass) {
    return L.divIcon({
      html: `
        <div style="
          background:${bg};
          width:40px;height:40px;
          border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 4px 16px ${bg}66;
          border:3px solid #fff;
          font-size:15px;color:#fff;
        ">
          <i class="fas ${faClass}"></i>
        </div>`,
      className: '',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -24],
    });
  }

  const iconDonor     = makeIcon('#10B981', 'fa-utensils');
  const iconVolunteer = makeIcon('#2563EB', 'fa-motorcycle');
  const iconNgo       = makeIcon('#F97316', 'fa-building');
  const iconActive    = makeIcon('#EF4444', 'fa-fire-flame-curved');

  /* ── Marker data ── */
  const donors = [
    { pos: [28.6250, 77.2080], name: 'Sunshine Hotel',  desc: '45 kg rice & curry · Ready for pickup' },
    { pos: [28.6080, 77.2250], name: 'Grand Restaurant',desc: '30 kg cooked food · Expires in 2 hrs' },
    { pos: [28.6320, 77.1950], name: 'Fresh Bakery',    desc: '15 kg bread & pastries' },
  ];
  const volunteers = [
    { pos: [28.6180, 77.2150], name: 'Rahul K.',  desc: 'Available · 0.5 km away' },
    { pos: [28.6050, 77.2100], name: 'Priya M.',  desc: 'On pickup · Returning soon' },
  ];
  const ngos = [
    { pos: [28.6200, 77.1900], name: 'Helping Hands NGO',    desc: 'Capacity: 200 meals/day' },
    { pos: [28.6350, 77.2200], name: 'City Care Foundation',  desc: 'Capacity: 150 meals/day' },
  ];
  const active = [
    { pos: [28.6139, 77.2090], name: 'Live Rescue #1', desc: 'In transit · ETA 12 mins' },
  ];

  function addMarkers(list, icon) {
    list.forEach(({ pos, name, desc }) => {
      L.marker(pos, { icon })
        .addTo(map)
        .bindPopup(`<strong style="font-family:'Poppins',sans-serif;">${name}</strong><br>
                    <span style="font-size:0.82rem;color:#64748B;">${desc}</span>`)
        .on('mouseover', function () { this.openPopup(); });
    });
  }

  addMarkers(donors, iconDonor);
  addMarkers(volunteers, iconVolunteer);
  addMarkers(ngos, iconNgo);
  addMarkers(active, iconActive);

  /* ── Animated dashed route: Donor → NGO ── */
  const route1 = [
    [28.6250, 77.2080],
    [28.6230, 77.2050],
    [28.6210, 77.2010],
    [28.6200, 77.1970],
    [28.6200, 77.1900],
  ];
  const line1 = L.polyline(route1, {
    color: '#10B981',
    weight: 3,
    opacity: 0.85,
    dashArray: '10 8',
    dashOffset: '0',
  }).addTo(map);

  /* ── Second route: Volunteer → Active ── */
  const route2 = [
    [28.6180, 77.2150],
    [28.6165, 77.2125],
    [28.6150, 77.2110],
    [28.6139, 77.2090],
  ];
  L.polyline(route2, {
    color: '#2563EB',
    weight: 3,
    opacity: 0.65,
    dashArray: '6 10',
  }).addTo(map);

  /* ── Animate route dash offset ── */
  let dashOffset = 0;
  setInterval(() => {
    dashOffset += 1;
    line1.setStyle({ dashOffset: String(-dashOffset) });
  }, 50);
}

/* ================================================
   LIVE RESCUE COUNTER SIMULATION
   ================================================ */
function initLiveCounter() {
  const el = document.getElementById('liveCount');
  if (!el) return;

  let count = 12;
  setInterval(() => {
    if (Math.random() > 0.65) {
      count += Math.random() > 0.55 ? 1 : -1;
      count = Math.max(8, Math.min(22, count));
      el.textContent = count;
    }
  }, 3200);
}

/* ================================================
   INITIALISE EVERYTHING ON DOM READY
   ================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initCharts();
  initMap();
  initLiveCounter();
});
