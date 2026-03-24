import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, Title, Tooltip, Legend,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { logout } from '../../store/slices/authSlice';
import { getAllDonations, volunteerAcceptPickup, markPickedUp as apiMarkPickedUp } from '../../services/api';
import '../../components/common/Dashboard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

/* ─── Types ────────────────────────────────────────────────── */
type PickupStatus = 'available' | 'accepted' | 'in-transit' | 'completed';

interface PickupRequest {
  id: string;
  foodTitle: string;
  donor: string;
  address: string;
  distance: string;
  weight: string;
  expiryIn: string;
  expiryTimestamp: number;   // actual epoch ms for countdown
  ngoWindowEnd: number;      // epoch ms when NGO-priority window ends
  ngo: string;
  ngoAddress: string;
  status: PickupStatus;
  category: string;
}

/* ─── Expiry helper ─────────────────────────────────────────── */
const calcExpiry = (ts: number, now: number) => {
  const diff = ts - now;
  if (diff <= 0) return { label: 'Expired', color: '#DC2626', bg: '#FEE2E2', urgency: 'red' as const };
  const totalMins = Math.floor(diff / 60000);
  const hrs  = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  const label = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  if (hrs >= 4) return { label, color: '#059669', bg: '#D1FAE5', urgency: 'green' as const };
  if (hrs >= 2) return { label, color: '#D97706', bg: '#FEF3C7', urgency: 'yellow' as const };
  return { label, color: '#DC2626', bg: '#FEE2E2', urgency: 'red' as const };
};

/* ─── Map backend donation → PickupRequest ──────────────────── */
const mapApiDonationToPickup = (d: any): PickupRequest => {
  const statusMap: Record<string, PickupStatus> = {
    posted: 'available', accepted: 'accepted',
    picked_up: 'in-transit', delivered: 'completed', expired: 'completed',
  };
  return {
    id: d._id,
    foodTitle: d.foodType + (d.quantity ? ` (${d.quantity})` : ''),
    donor: d.donorId?.name || 'Donor',
    address: d.location,
    distance: '—',
    weight: d.quantity || '—',
    expiryIn: '',
    expiryTimestamp: d.expiryTime ? new Date(d.expiryTime).getTime() : Date.now() + 4 * 3600000,
    ngoWindowEnd: d.createdAt ? new Date(d.createdAt).getTime() + 2 * 3600000 : Date.now() - 1,
    ngo: d.assignedNGO?.name || '—',
    ngoAddress: '—',
    status: statusMap[d.status] || 'available',
    category: d.category || 'Other',
  };
};

/* ─── Mock data (used only in demo mode without token) ──────── */
const BASE = Date.now();
const H    = 3600000;

const INIT_PICKUPS: PickupRequest[] = [];

const EMOJI_MAP: Record<string, string> = {
  'Cooked Food':'🍛','Bakery':'🍞','Produce':'🥦','Fruits':'🍎','Dairy':'🥛','Other':'🍽️',
};

const STATUS_COLORS: Record<PickupStatus, string> = {
  available:  'badge-orange',
  accepted:   'badge-blue',
  'in-transit':'badge-gray',
  completed:  'badge-green',
};

const WEEKS = ['Week 1','Week 2','Week 3','Week 4','Week 5','Week 6','Week 7'];

type Tab = 'pickups' | 'active' | 'history' | 'stats';

/* ═══════════════════════════════════════════════════════════════
   VOLUNTEER DASHBOARD PAGE
═══════════════════════════════════════════════════════════════ */
const VolunteerDashboard: React.FC = () => {
  const user     = useSelector((state: any) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [tab, setTab]           = useState<Tab>('pickups');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pickups, setPickups]   = useState<PickupRequest[]>(INIT_PICKUPS);
  const [loading, setLoading]   = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [now, setNow]           = useState(Date.now());

  const initials    = user?.name ? user.name.split(' ').map((n:string)=>n[0]).join('').toUpperCase().slice(0,2) : 'VL';
  const displayName = user?.name || 'Volunteer';

  /* Live countdown - updates every 30s */
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  /* ── Fetch available donations from backend ──────────────── */
  useEffect(() => {
    const fetchPickups = async () => {
      setLoading(true);
      setApiError(null);
      try {
        const res = await getAllDonations();
        setPickups((res.data.donations || []).map(mapApiDonationToPickup));
      } catch (err: any) {
        setApiError(err.response?.data?.message || 'Failed to load pickup requests.');
      } finally {
        setLoading(false);
      }
    };
    fetchPickups();
  }, []);

  const verificationStatus = user?.verificationStatus ?? 'pending'; // default pending for demo
  const isVerified         = verificationStatus === 'verified';

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  
  

  const handleAccept = async (id: string) => {
    if (!isVerified) {
      const activeCount = pickups.filter(p => p.status === 'accepted' || p.status === 'in-transit').length;
      if (activeCount >= 3) {
        showToast('⚠️ Unverified volunteers can accept up to 3 pickups. Verification is pending admin review.', 'error');
        return;
      }
    }
    setActionLoading(prev => ({ ...prev, [id]: true }));
    try {
      await volunteerAcceptPickup(id);
      setPickups(prev => prev.map(p => p.id === id ? {...p, status:'accepted'} : p));
      showToast('Pickup accepted! Head to the donor location.');
      setTab('active');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to accept pickup.', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleStartTransit = async (id: string) => {
    setActionLoading(prev => ({ ...prev, [id]: true }));
    try {
      await apiMarkPickedUp(id);
      setPickups(prev => prev.map(p => p.id === id ? {...p, status:'in-transit'} : p));
      showToast('En route to NGO! Food has been picked up.');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to mark as picked up.', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleComplete = (id: string) => {
    // Delivery confirmation is done by the NGO on their dashboard.
    // Volunteer marks it locally and NGO confirms via /api/donations/delivered.
    setPickups(prev => prev.map(p => p.id === id ? {...p, status:'completed'} : p));
    showToast('Delivery marked! The NGO will confirm receipt. Great work 🎉');
    setTab('history');
  };

  const handleLogout = () => { localStorage.removeItem('token'); dispatch(logout()); navigate('/login'); };

  /* Stats */
  const stats = {
    available:  pickups.filter(p => p.status==='available' && p.ngoWindowEnd <= now).length,
    accepted:   pickups.filter(p => p.status==='accepted').length,
    inTransit:  pickups.filter(p => p.status==='in-transit').length,
    completed:  pickups.filter(p => p.status==='completed').length,
  };

  const activePickups    = pickups.filter(p => p.status==='accepted' || p.status==='in-transit');
  const availablePickups = pickups.filter(p => p.status==='available' && p.ngoWindowEnd <= now);
  const ngoPriorityPickups = pickups.filter(p => p.status==='available' && p.ngoWindowEnd > now);
  const completedPickups = pickups.filter(p => p.status==='completed');

  /* Mock rating data (would come from backend in production) */
  const myRating = { average: user?.rating || 0, count: user?.deliveriesCompleted || 0, totalKg: 127 };

  /* Charts */
  const barData = {
    labels: WEEKS,
    datasets:[{
      label:'Pickups Completed',
      data:[4,6,5,8,7,9,stats.completed + 3],
      backgroundColor:'rgba(37,99,235,0.75)',
      borderRadius:6, borderSkipped:false,
    }],
  };
  const barOpts: any = {
    responsive:true, maintainAspectRatio:false,
    plugins:{ legend:{display:false} },
    scales:{ x:{grid:{display:false},ticks:{color:'#64748B'}}, y:{grid:{color:'rgba(0,0,0,0.04)'},ticks:{color:'#64748B'}} },
  };

  const statusDoughnut = {
    labels:['Available','Accepted','In Transit','Completed'],
    datasets:[{
      data:[stats.available, stats.accepted, stats.inTransit, stats.completed],
      backgroundColor:['#F97316','#2563EB','#8B5CF6','#10B981'],
      borderWidth:2, borderColor:'var(--card-bg)',
    }],
  };
  const doughnutOpts: any = {
    responsive:true, maintainAspectRatio:false,
    plugins:{ legend:{position:'right' as const, labels:{font:{size:11},boxWidth:12}} },
    cutout:'65%',
  };

  const lineData = {
    labels: WEEKS,
    datasets:[{
      label:'kg Rescued',
      data:[52,74,61,93,85,110,127],
      borderColor:'#10B981', backgroundColor:'rgba(16,185,129,0.12)',
      tension:0.4, fill:true, pointRadius:4, pointBackgroundColor:'#10B981',
    }],
  };
  const lineOpts: any = {
    responsive:true, maintainAspectRatio:false,
    plugins:{ legend:{display:false} },
    scales:{ x:{grid:{display:false},ticks:{color:'#64748B'}}, y:{grid:{color:'rgba(0,0,0,0.04)'},ticks:{color:'#64748B'}} },
  };

  /* Delivery status steps */
  const DELIVERY_STEPS = [
    { key:'accepted',   label:'Pickup Accepted', icon:'fa-circle-check' },
    { key:'in-transit', label:'En Route to NGO',  icon:'fa-motorcycle' },
    { key:'completed',  label:'Delivered',        icon:'fa-flag-checkered' },
  ];

  return (
    <div className="db-layout">
      {sidebarOpen && <div className="db-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* ══════════ SIDEBAR ══════════ */}
      <aside className={`db-sidebar${sidebarOpen ? ' open' : ''}`}>
        <Link to="/" className="db-logo"><i className="fas fa-leaf"></i> FoodBridge</Link>
        <nav className="db-nav">
          <div className="db-nav-section">
            <div className="db-nav-label">Volunteer Menu</div>
            {([
              ['pickups', 'fa-list-check',      'Nearby Pickups'],
              ['active',  'fa-motorcycle',       'Active Deliveries'],
              ['history', 'fa-flag-checkered',   'Completed'],
              ['stats',   'fa-chart-bar',        'My Stats'],
            ] as [Tab,string,string][]).map(([t,icon,label]) => (
              <button key={t} className={`db-nav-item${tab===t?' active':''}`}
                onClick={() => { setTab(t); setSidebarOpen(false); }}>
                <i className={`fas ${icon}`}></i> {label}
                {t==='pickups' && stats.available>0 && <span className="notif-badge"></span>}
                {t==='active'  && (stats.accepted+stats.inTransit)>0 && <span className="notif-badge"></span>}
              </button>
            ))}
          </div>
          <div className="db-nav-section">
            <div className="db-nav-label">Account</div>
            <Link to="/profile"  className="db-nav-item"><i className="fas fa-user"></i> Profile</Link>
            <Link to="/settings" className="db-nav-item"><i className="fas fa-gear"></i> Settings</Link>
            <button className="db-nav-item" style={{color:'#EF4444'}} onClick={handleLogout}>
              <i className="fas fa-right-from-bracket"></i> Logout
            </button>
          </div>
        </nav>
        <div className="db-user-block">
          <div className="db-avatar" style={{ background:'linear-gradient(135deg,#2563EB,#8B5CF6)' }}>{initials}</div>
          <div>
            <div className="db-user-name">{displayName}</div>
            <div className="db-user-role">Volunteer</div>
          </div>
        </div>
      </aside>

      {/* ══════════ MAIN ══════════ */}
      <main className="db-main">
        <div className="db-topbar">
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button className="db-hamburger" onClick={() => setSidebarOpen(o=>!o)} aria-label="Menu">
              <i className="fas fa-bars"></i>
            </button>
            <div className="db-topbar-title">
              {tab==='pickups' && '📍 Nearby Pickup Requests'}
              {tab==='active'  && '🚴 Active Deliveries'}
              {tab==='history' && '✅ Completed Pickups'}
              {tab==='stats'   && '📊 My Volunteer Stats'}
            </div>
          </div>
          <div className="db-topbar-right">
              <button className="db-btn db-btn-ghost db-btn-sm" onClick={() => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  }} aria-label="Toggle theme">
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
              <button className="db-btn db-btn-ghost db-btn-sm"><i className="fas fa-bell"></i></button>
            <span className="db-badge badge-green" style={{ fontSize:'0.8rem', padding:'5px 12px' }}>
              <i className="fas fa-circle" style={{ fontSize:'7px', marginRight:5 }}></i>Online
            </span>
          </div>
        </div>

        <div className="db-content">

          {/* Loading / error banner */}
          {loading && (
            <div style={{ textAlign:'center', padding:'40px 0', color:'var(--c-muted)' }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize:'2rem', marginBottom:12, display:'block' }}></i>
              Loading pickup requests…
            </div>
          )}
          {apiError && !loading && (
            <div style={{ background:'#FEE2E2', border:'1px solid #FCA5A5', borderRadius:'var(--r-md)', padding:'14px 20px', marginBottom:20, color:'#991B1B', display:'flex', alignItems:'center', gap:10 }}>
              <i className="fas fa-circle-exclamation"></i>
              <span>{apiError}</span>
              <button className="db-btn db-btn-ghost db-btn-sm" style={{ marginLeft:'auto' }} onClick={() => setApiError(null)}>
                <i className="fas fa-xmark"></i>
              </button>
            </div>
          )}

          {/* ════ VERIFICATION BANNER ════ */}
          {verificationStatus !== 'verified' && (
            <div style={{
              marginBottom: 20,
              padding: '14px 20px',
              borderRadius: 'var(--r-md)',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              background: verificationStatus === 'rejected' ? '#FEE2E2' : '#FFF7ED',
              border: `1.5px solid ${verificationStatus === 'rejected' ? '#FCA5A5' : '#FED7AA'}`,
            }}>
              <div style={{ fontSize:'1.5rem', flexShrink:0 }}>
                {verificationStatus === 'rejected' ? '❌' : '⏳'}
              </div>
              <div style={{ flex:1 }}>
                {verificationStatus === 'pending' && (
                  <>
                    <div style={{ fontWeight:700, color:'#92400E', fontSize:'0.9rem' }}>
                      Verification Pending — Limited Access
                    </div>
                    <div style={{ fontSize:'0.8rem', color:'#B45309', marginTop:2 }}>
                      Your ID is under admin review. You can accept up to <strong>3 pickups</strong> until verified. Verified volunteers have unlimited access.
                    </div>
                  </>
                )}
                {verificationStatus === 'rejected' && (
                  <>
                    <div style={{ fontWeight:700, color:'#991B1B', fontSize:'0.9rem' }}>
                      Verification Rejected
                    </div>
                    <div style={{ fontSize:'0.8rem', color:'#B91C1C', marginTop:2 }}>
                      Your verification was rejected. Please contact support or re-register with a valid ID to unlock full access.
                    </div>
                  </>
                )}
              </div>
              <div style={{
                padding:'4px 12px', borderRadius:999,
                background: verificationStatus === 'rejected' ? '#FCA5A5' : '#FED7AA',
                color: verificationStatus === 'rejected' ? '#991B1B' : '#92400E',
                fontSize:'0.72rem', fontWeight:700, flexShrink:0,
              }}>
                {verificationStatus === 'pending' ? 'PENDING' : 'REJECTED'}
              </div>
            </div>
          )}

          {/* ════ NEARBY PICKUPS ════ */}
          {tab==='pickups' && (
            <>
              <div className="db-page-header">
                <h2>Nearby Pickup Requests</h2>
                <p>{stats.available} pickup{stats.available!==1?'s':''} available in your area.</p>
              </div>

              {/* Quick stats */}
              <div className="db-stats-row" style={{ marginBottom:28 }}>
                {[
                  { ico:'fa-map-pin',       bg:'rgba(249,115,22,0.1)', color:'var(--c-accent)',    num:stats.available,  lbl:'Available',  delta:'Open requests' },
                  { ico:'fa-motorcycle',    bg:'rgba(37,99,235,0.1)', color:'var(--c-secondary)', num:stats.accepted,   lbl:'Accepted',   delta:'Waiting pickup' },
                  { ico:'fa-route',         bg:'rgba(139,92,246,0.1)',color:'#8B5CF6',            num:stats.inTransit,  lbl:'In Transit', delta:'On the way' },
                  { ico:'fa-circle-check',  bg:'rgba(16,185,129,0.1)',color:'var(--c-primary)',   num:stats.completed,  lbl:'Completed',  delta:'Total deliveries' },
                ].map((s, i) => (
                  <div className="db-stat-chip" key={i}>
                    <div className="db-stat-ico" style={{ background:s.bg }}>
                      <i className={`fas ${s.ico}`} style={{ color:s.color }}></i>
                    </div>
                    <div>
                      <div className="db-stat-num">{s.num}</div>
                      <div className="db-stat-lbl">{s.lbl}</div>
                      <div className="db-stat-delta delta-up">{s.delta}</div>
                    </div>
                  </div>
                ))}
              </div>

              {availablePickups.length === 0 && ngoPriorityPickups.length === 0
                ? <div className="db-empty-state"><i className="fas fa-map-pin"></i><p>No pickup requests near you right now.</p></div>
                : (
                  <>
                    {/* NGO Priority Window pickups */}
                    {ngoPriorityPickups.length > 0 && (
                      <div style={{ marginBottom:24 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                          <div style={{ width:36, height:36, borderRadius:'50%', background:'rgba(139,92,246,0.12)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <i className="fas fa-building" style={{ color:'#8B5CF6', fontSize:'0.9rem' }}></i>
                          </div>
                          <div>
                            <div style={{ fontWeight:700, fontSize:'0.9rem', color:'#6D28D9' }}>NGO Priority Window</div>
                            <div style={{ fontSize:'0.75rem', color:'#8B5CF6' }}>These requests are reserved for NGOs. They'll be released to volunteers after the window expires.</div>
                          </div>
                        </div>
                        <div className="pickup-cards-grid">
                          {ngoPriorityPickups.map(p => {
                            const windowLeft = calcExpiry(p.ngoWindowEnd, now);
                            return (
                              <div className="pickup-card" key={p.id} style={{ opacity:0.7, border:'1.5px solid rgba(139,92,246,0.25)' }}>
                                <div className="pickup-card-header">
                                  <div>
                                    <div className="pickup-card-title">{EMOJI_MAP[p.category]||'🍽️'} {p.foodTitle}</div>
                                    <div style={{ fontSize:'0.8rem', color:'var(--c-muted)', marginTop:4 }}>
                                      <i className="fas fa-store" style={{ marginRight:5 }}></i>{p.donor}
                                    </div>
                                  </div>
                                  <span className="db-badge" style={{ background:'rgba(139,92,246,0.12)', color:'#6D28D9' }}>NGO Priority</span>
                                </div>
                                <div style={{ display:'flex', flexWrap:'wrap', gap:10, margin:'12px 0' }}>
                                  <span className="donation-meta-item"><i className="fas fa-location-dot"></i>{p.address.split(',')[0]}</span>
                                  <span className="donation-meta-item"><i className="fas fa-route"></i>{p.distance}</span>
                                  <span className="donation-meta-item"><i className="fas fa-weight-hanging"></i>{p.weight}</span>
                                </div>
                                <div style={{ background:'rgba(139,92,246,0.06)', border:'1px solid rgba(139,92,246,0.15)', borderRadius:'var(--r-md)', padding:'10px 14px', fontSize:'0.82rem', color:'#6D28D9' }}>
                                  <i className="fas fa-clock" style={{ marginRight:6 }}></i>
                                  <strong>Available for you in:</strong> {windowLeft.label}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Available pickups */}
                    {availablePickups.length > 0 && (
                      <div className="pickup-cards-grid">
                        {availablePickups.map(p => {
                          const expiry = calcExpiry(p.expiryTimestamp, now);
                          const activeCount = pickups.filter(pk => pk.status === 'accepted' || pk.status === 'in-transit').length;
                          const limitReached = !isVerified && activeCount >= 3;
                          return (
                            <div className="pickup-card" key={p.id} style={{ borderTop: `3px solid ${expiry.color}` }}>
                              <div className="pickup-card-header">
                                <div>
                                  <div className="pickup-card-title">{EMOJI_MAP[p.category]||'🍽️'} {p.foodTitle}</div>
                                  <div style={{ fontSize:'0.8rem', color:'var(--c-muted)', marginTop:4 }}>
                                    <i className="fas fa-store" style={{ marginRight:5 }}></i>{p.donor}
                                  </div>
                                </div>
                                <span className={`db-badge ${STATUS_COLORS[p.status]}`}>{p.status}</span>
                              </div>

                              {/* Expiry urgency badge */}
                              <div style={{ display:'flex', alignItems:'center', gap:8, margin:'10px 0 4px' }}>
                                <span style={{
                                  display:'inline-flex', alignItems:'center', gap:5,
                                  padding:'4px 10px', borderRadius:999,
                                  background: expiry.bg, color: expiry.color,
                                  fontSize:'0.75rem', fontWeight:700,
                                }}>
                                  <i className="fas fa-fire" style={{ fontSize:'0.65rem' }}></i>
                                  {expiry.urgency === 'red' ? '🔴 Urgent:' : expiry.urgency === 'yellow' ? '🟡 Soon:' : '🟢 Fresh:'}
                                  &nbsp;{expiry.label} left
                                </span>
                              </div>

                              <div style={{ display:'flex', flexWrap:'wrap', gap:10, margin:'10px 0' }}>
                                <span className="donation-meta-item"><i className="fas fa-location-dot"></i>{p.address.split(',')[0]}</span>
                                <span className="donation-meta-item"><i className="fas fa-route"></i>{p.distance}</span>
                                <span className="donation-meta-item"><i className="fas fa-weight-hanging"></i>{p.weight}</span>
                              </div>

                              <div style={{ background:'rgba(249,115,22,0.06)', border:'1px solid rgba(249,115,22,0.15)', borderRadius:'var(--r-md)', padding:'10px 14px', marginBottom:14, fontSize:'0.82rem' }}>
                                <i className="fas fa-building" style={{ color:'var(--c-accent)', marginRight:6 }}></i>
                                <strong>Deliver to:</strong> {p.ngo} — {p.ngoAddress}
                              </div>

                              {limitReached && (
                                <div style={{ background:'#FFF7ED', border:'1px solid #FED7AA', borderRadius:'var(--r-sm)', padding:'8px 12px', marginBottom:10, fontSize:'0.78rem', color:'#92400E' }}>
                                  <i className="fas fa-lock" style={{ marginRight:6 }}></i>
                                  Limit reached (3/3). <strong>Verify your account</strong> to accept unlimited pickups.
                                </div>
                              )}

                              <div className="pickup-card-actions">
                                <button
                                  className="db-btn db-btn-primary"
                                  style={{ flex:1, opacity: limitReached ? 0.5 : 1 }}
                                  onClick={() => handleAccept(p.id)}
                                  disabled={limitReached || !!actionLoading[p.id]}
                                >
                                  {actionLoading[p.id]
                                    ? <><i className="fas fa-spinner fa-spin"></i> Accepting…</>
                                    : <><i className="fas fa-hand-point-up"></i> Accept Pickup</>
                                  }
                                </button>
                                <button className="db-btn db-btn-ghost db-btn-sm"><i className="fas fa-map"></i></button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )
              }
            </>
          )}

          {/* ════ ACTIVE DELIVERIES ════ */}
          {tab==='active' && (
            <>
              <div className="db-page-header">
                <h2>Active Deliveries</h2>
                <p>{activePickups.length} active assignment{activePickups.length!==1?'s':''}</p>
              </div>

              {activePickups.length === 0
                ? (
                  <div className="db-empty-state">
                    <i className="fas fa-motorcycle"></i>
                    <p>No active deliveries. <button className="db-btn db-btn-primary db-btn-sm" style={{marginTop:12}} onClick={()=>setTab('pickups')}>Browse Pickups</button></p>
                  </div>
                )
                : activePickups.map(p => (
                  <div className="db-card" key={p.id} style={{ marginBottom:20 }}>
                    <div className="db-card-header">
                      <div className="db-card-title"><i className="fas fa-route"></i> {p.foodTitle}</div>
                      <span className={`db-badge ${STATUS_COLORS[p.status]}`}>{p.status}</span>
                    </div>
                    <div className="db-card-body">
                      {/* Progress stepper */}
                      <div className="db-delivery-steps">
                        {DELIVERY_STEPS.map((step, idx) => {
                          const stepOrder: Record<string,number> = { accepted:0, 'in-transit':1, completed:2 };
                          const currentIdx = stepOrder[p.status] ?? 0;
                          const isDone  = idx < currentIdx;
                          const isActive= idx === currentIdx;
                          return (
                            <div key={step.key} className={`db-step${isActive?' db-step--active':''}${isDone?' db-step--done':''}`}>
                              <div className="db-step-circle">
                                <i className={`fas ${isDone ? 'fa-check' : step.icon}`}></i>
                              </div>
                              <div className="db-step-label">{step.label}</div>
                              {idx < DELIVERY_STEPS.length-1 && <div className={`db-step-line${isDone||isActive?' db-step-line--done':''}`} />}
                            </div>
                          );
                        })}
                      </div>

                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, margin:'20px 0 24px' }}>
                        <div style={{ background:'#F0FDF4', borderRadius:'var(--r-md)', padding:'14px 18px', border:'1px solid #BBF7D0' }}>
                          <div style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--c-primary)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:6 }}>
                            <i className="fas fa-utensils" style={{marginRight:6}}></i>Pickup From
                          </div>
                          <div style={{ fontWeight:600, fontSize:'0.92rem' }}>{p.donor}</div>
                          <div style={{ fontSize:'0.82rem', color:'var(--c-muted)', marginTop:4 }}>{p.address}</div>
                          <div style={{ fontSize:'0.8rem', color:'var(--c-primary)', marginTop:6 }}><i className="fas fa-route"></i> {p.distance}</div>
                        </div>
                        <div style={{ background:'#FFF7ED', borderRadius:'var(--r-md)', padding:'14px 18px', border:'1px solid #FED7AA' }}>
                          <div style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--c-accent)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:6 }}>
                            <i className="fas fa-building" style={{marginRight:6}}></i>Deliver To
                          </div>
                          <div style={{ fontWeight:600, fontSize:'0.92rem' }}>{p.ngo}</div>
                          <div style={{ fontSize:'0.82rem', color:'var(--c-muted)', marginTop:4 }}>{p.ngoAddress}</div>
                          <div style={{ fontSize:'0.8rem', color:'var(--c-accent)', marginTop:6 }}><i className="fas fa-weight-hanging"></i> {p.weight}</div>
                        </div>
                      </div>

                      <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                        {p.status==='accepted' && (
                          <button className="db-btn db-btn-secondary" onClick={() => handleStartTransit(p.id)} disabled={!!actionLoading[p.id]}>
                            {actionLoading[p.id] ? <><i className="fas fa-spinner fa-spin"></i> Updating…</> : <><i className="fas fa-motorcycle"></i> Start Delivery</>}
                          </button>
                        )}
                        {p.status==='in-transit' && (
                          <button className="db-btn db-btn-primary" onClick={() => handleComplete(p.id)}>
                            <i className="fas fa-flag-checkered"></i> Mark as Delivered
                          </button>
                        )}
                        <button className="db-btn db-btn-ghost">
                          <i className="fas fa-map"></i> Open Map
                        </button>
                        <button className="db-btn db-btn-ghost db-btn-sm">
                          <i className="fas fa-phone"></i> Contact NGO
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              }
            </>
          )}

          {/* ════ COMPLETED ════ */}
          {tab==='history' && (
            <>
              <div className="db-page-header">
                <h2>Completed Pickups</h2>
                <p>{completedPickups.length} deliveries completed — Thank you for your service!</p>
              </div>

              {completedPickups.length === 0
                ? <div className="db-empty-state"><i className="fas fa-flag-checkered"></i><p>No completed pickups yet.</p></div>
                : (
                  <div className="db-card">
                    <div className="db-card-body" style={{ padding:0 }}>
                      <table className="db-table">
                        <thead>
                          <tr><th>Food</th><th>Donor</th><th>NGO</th><th>Weight</th><th>Distance</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                          {completedPickups.map(p => (
                            <tr key={p.id}>
                              <td>{EMOJI_MAP[p.category]||'🍽️'} {p.foodTitle}</td>
                              <td style={{ fontSize:'0.85rem' }}>{p.donor}</td>
                              <td style={{ fontSize:'0.82rem', color:'var(--c-muted)' }}>{p.ngo}</td>
                              <td>{p.weight}</td>
                              <td>{p.distance}</td>
                              <td><span className="db-badge badge-green">completed</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              }
            </>
          )}

          {/* ════ STATS ════ */}
          {tab==='stats' && (
            <>
              <div className="db-page-header">
                <h2>My Volunteer Stats</h2>
                <p>Your impact on food rescue — keep it up!</p>
              </div>

              <div className="db-stats-row" style={{ marginBottom:28 }}>
                {[
                  { ico:'fa-flag-checkered', bg:'rgba(16,185,129,0.1)', color:'var(--c-primary)',   num:myRating.count,          lbl:'Total Deliveries', delta:'All time' },
                  { ico:'fa-weight-hanging', bg:'rgba(37,99,235,0.1)', color:'var(--c-secondary)', num:`${myRating.totalKg} kg`, lbl:'Food Rescued',     delta:'This month' },
                  { ico:'fa-route',          bg:'rgba(249,115,22,0.1)',color:'var(--c-accent)',    num:'38.4 km',               lbl:'Distance Covered', delta:'All time' },
                  { ico:'fa-star',           bg:'rgba(139,92,246,0.1)',color:'#8B5CF6',            num:myRating.average.toFixed(1), lbl:'Avg. Rating', delta:`From ${myRating.count} deliveries` },
                ].map((s, i) => (
                  <div className="db-stat-chip" key={i}>
                    <div className="db-stat-ico" style={{ background:s.bg }}>
                      <i className={`fas ${s.ico}`} style={{ color:s.color }}></i>
                    </div>
                    <div>
                      <div className="db-stat-num">{s.num}</div>
                      <div className="db-stat-lbl">{s.lbl}</div>
                      <div className="db-stat-delta delta-up">{s.delta}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Rating display card */}
              <div className="db-card" style={{ marginBottom:24, background:'linear-gradient(135deg,rgba(139,92,246,0.06),rgba(37,99,235,0.06))', border:'1.5px solid rgba(139,92,246,0.2)' }}>
                <div className="db-card-header">
                  <div className="db-card-title" style={{ color:'#6D28D9' }}>
                    <i className="fas fa-star" style={{ color:'#F59E0B' }}></i> My NGO Rating
                  </div>
                </div>
                <div className="db-card-body">
                  <div style={{ display:'flex', alignItems:'center', gap:28, flexWrap:'wrap' }}>
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontSize:'3.5rem', fontWeight:800, color:'#6D28D9', lineHeight:1 }}>{myRating.average.toFixed(1)}</div>
                      <div style={{ display:'flex', gap:3, justifyContent:'center', marginTop:6 }}>
                        {[1,2,3,4,5].map(star => (
                          <i key={star} className="fas fa-star" style={{
                            color: star <= Math.round(myRating.average) ? '#F59E0B' : 'var(--border-color)',
                            fontSize:'1.1rem',
                          }}></i>
                        ))}
                      </div>
                      <div style={{ fontSize:'0.75rem', color:'var(--c-muted)', marginTop:4 }}>out of 5.0</div>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:'0.9rem', fontWeight:600, color:'var(--c-text)', marginBottom:4 }}>
                        Based on {myRating.count} completed deliveries
                      </div>
                      <div style={{ fontSize:'0.82rem', color:'var(--c-muted)', marginBottom:12 }}>
                        Ratings are given by NGOs after each delivery. Keep up the great work!
                      </div>
                      {/* Simulated rating breakdown */}
                      {[5,4,3,2,1].map(stars => {
                        const pct = stars === 5 ? 75 : stars === 4 ? 18 : stars === 3 ? 5 : stars === 2 ? 2 : 0;
                        return (
                          <div key={stars} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                            <span style={{ fontSize:'0.72rem', color:'var(--c-muted)', width:12 }}>{stars}</span>
                            <i className="fas fa-star" style={{ color:'#F59E0B', fontSize:'0.65rem' }}></i>
                            <div style={{ flex:1, height:6, background:'#F1F5F9', borderRadius:999 }}>
                              <div style={{ width:`${pct}%`, height:'100%', background:'#F59E0B', borderRadius:999 }}></div>
                            </div>
                            <span style={{ fontSize:'0.72rem', color:'var(--c-muted)', width:28 }}>{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="db-chart-row">
                <div className="db-card db-chart-card">
                  <div className="db-card-header"><div className="db-card-title"><i className="fas fa-chart-bar"></i> Weekly Pickups</div></div>
                  <div className="db-card-body"><div style={{ height:240 }}><Bar data={barData} options={barOpts} /></div></div>
                </div>
                <div className="db-card db-chart-card db-chart-card--sm">
                  <div className="db-card-header"><div className="db-card-title"><i className="fas fa-chart-pie"></i> Status Breakdown</div></div>
                  <div className="db-card-body"><div style={{ height:220 }}><Doughnut data={statusDoughnut} options={doughnutOpts} /></div></div>
                </div>
              </div>

              <div className="db-card" style={{ marginTop:24 }}>
                <div className="db-card-header"><div className="db-card-title"><i className="fas fa-chart-line"></i> Food Rescued (kg/week)</div></div>
                <div className="db-card-body"><div style={{ height:200 }}><Line data={lineData} options={lineOpts} /></div></div>
              </div>
            </>
          )}
        </div>
      </main>

      {toastMsg && (
        <div className={`db-toast${toastType === 'error' ? ' db-toast-error' : ''}`}>
          <i className={`fas ${toastType === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'}`}></i> {toastMsg}
        </div>
      )}
    </div>
  );
};

export default VolunteerDashboard;



