import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, Title, Tooltip, Legend,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { logout } from '../../store/slices/authSlice';
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
  ngo: string;
  ngoAddress: string;
  status: PickupStatus;
  category: string;
}

/* ─── Mock data ─────────────────────────────────────────────── */
const INIT_PICKUPS: PickupRequest[] = [
  { id:'1', foodTitle:'Cooked Biryani (25 kg)',   donor:'Sunshine Hotel',  address:'12 MG Road, Bengaluru',     distance:'0.8 km', weight:'25 kg',  expiryIn:'2 hrs', ngo:'Helping Hands NGO',    ngoAddress:'44 Residency Rd',    status:'available',  category:'Cooked Food' },
  { id:'2', foodTitle:'Fresh Bread (10 kg)',       donor:'City Bakery',     address:'5 Park St, Bengaluru',      distance:'1.4 km', weight:'10 kg',  expiryIn:'4 hrs', ngo:'City Care Foundation', ngoAddress:'8 Brigade Rd',       status:'available',  category:'Bakery' },
  { id:'3', foodTitle:'Mixed Vegetables (15 kg)',  donor:'Fresh Mart',      address:'88 Church St, Bengaluru',   distance:'2.1 km', weight:'15 kg',  expiryIn:'6 hrs', ngo:'Green Hope Trust',     ngoAddress:'16 Commercial St',   status:'accepted',   category:'Produce' },
  { id:'4', foodTitle:'Dal & Rice (30 servings)',  donor:'Hotel Grandeur',  address:'4 Infantry Rd, Bengaluru',  distance:'3.5 km', weight:'30 srv', expiryIn:'1 hr',  ngo:'Annadanam Trust',      ngoAddress:'Majestic Bus Stand', status:'available',  category:'Cooked Food' },
  { id:'5', foodTitle:'Fruit Platter (8 kg)',      donor:'Grand Catering',  address:'22 Lavelle Rd, Bengaluru',  distance:'2.8 km', weight:'8 kg',   expiryIn:'5 hrs', ngo:'Hope Foundation',      ngoAddress:'Freedom Park',       status:'in-transit', category:'Fruits' },
  { id:'6', foodTitle:'Dairy Products (20 L)',     donor:'Amul Booth',      address:'7 Linking Rd, Bengaluru',   distance:'1.1 km', weight:'20 L',   expiryIn:'3 hrs', ngo:'Smile Foundation',     ngoAddress:'Cubbon Park Gate',   status:'completed',  category:'Dairy' },
];

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
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const initials    = user?.name ? user.name.split(' ').map((n:string)=>n[0]).join('').toUpperCase().slice(0,2) : 'VL';
  const displayName = user?.name || 'Volunteer';

  const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 3000); };

  const handleAccept = (id: string) => {
    setPickups(prev => prev.map(p => p.id===id ? {...p, status:'accepted'} : p));
    showToast('Pickup accepted! Head to the donor location.');
    setTab('active');
  };

  const handleStartTransit = (id: string) => {
    setPickups(prev => prev.map(p => p.id===id ? {...p, status:'in-transit'} : p));
    showToast('En route to NGO!');
  };

  const handleComplete = (id: string) => {
    setPickups(prev => prev.map(p => p.id===id ? {...p, status:'completed'} : p));
    showToast('Delivery completed! Great work 🎉');
    setTab('history');
  };

  const handleLogout = () => { dispatch(logout()); navigate('/login'); };

  /* Stats */
  const stats = {
    available:  pickups.filter(p => p.status==='available').length,
    accepted:   pickups.filter(p => p.status==='accepted').length,
    inTransit:  pickups.filter(p => p.status==='in-transit').length,
    completed:  pickups.filter(p => p.status==='completed').length,
  };

  const activePickups    = pickups.filter(p => p.status==='accepted' || p.status==='in-transit');
  const availablePickups = pickups.filter(p => p.status==='available');
  const completedPickups = pickups.filter(p => p.status==='completed');

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
      borderWidth:2, borderColor:'#fff',
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
            <button className="db-btn db-btn-ghost db-btn-sm"><i className="fas fa-bell"></i></button>
            <span className="db-badge badge-green" style={{ fontSize:'0.8rem', padding:'5px 12px' }}>
              <i className="fas fa-circle" style={{ fontSize:'7px', marginRight:5 }}></i>Online
            </span>
          </div>
        </div>

        <div className="db-content">

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

              {availablePickups.length === 0
                ? <div className="db-empty-state"><i className="fas fa-map-pin"></i><p>No pickup requests near you right now.</p></div>
                : (
                  <div className="pickup-cards-grid">
                    {availablePickups.map(p => (
                      <div className="pickup-card" key={p.id}>
                        <div className="pickup-card-header">
                          <div>
                            <div className="pickup-card-title">{EMOJI_MAP[p.category]||'🍽️'} {p.foodTitle}</div>
                            <div style={{ fontSize:'0.8rem', color:'var(--c-muted)', marginTop:4 }}>
                              <i className="fas fa-store" style={{ marginRight:5 }}></i>{p.donor}
                            </div>
                          </div>
                          <span className={`db-badge ${STATUS_COLORS[p.status]}`}>{p.status}</span>
                        </div>

                        <div style={{ display:'flex', flexWrap:'wrap', gap:10, margin:'12px 0' }}>
                          <span className="donation-meta-item"><i className="fas fa-location-dot"></i>{p.address.split(',')[0]}</span>
                          <span className="donation-meta-item"><i className="fas fa-route"></i>{p.distance}</span>
                          <span className="donation-meta-item"><i className="fas fa-weight-hanging"></i>{p.weight}</span>
                          <span className="donation-meta-item"><i className="fas fa-clock"></i>Expires in {p.expiryIn}</span>
                        </div>

                        <div style={{ background:'rgba(249,115,22,0.06)', border:'1px solid rgba(249,115,22,0.15)', borderRadius:'var(--r-md)', padding:'10px 14px', marginBottom:14, fontSize:'0.82rem' }}>
                          <i className="fas fa-building" style={{ color:'var(--c-accent)', marginRight:6 }}></i>
                          <strong>Deliver to:</strong> {p.ngo} — {p.ngoAddress}
                        </div>

                        <div className="pickup-card-actions">
                          <button className="db-btn db-btn-primary" style={{ flex:1 }} onClick={() => handleAccept(p.id)}>
                            <i className="fas fa-hand-point-up"></i> Accept Pickup
                          </button>
                          <button className="db-btn db-btn-ghost db-btn-sm"><i className="fas fa-map"></i></button>
                        </div>
                      </div>
                    ))}
                  </div>
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
                          <button className="db-btn db-btn-secondary" onClick={() => handleStartTransit(p.id)}>
                            <i className="fas fa-motorcycle"></i> Start Delivery
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
                  { ico:'fa-flag-checkered', bg:'rgba(16,185,129,0.1)', color:'var(--c-primary)',   num:stats.completed+3, lbl:'Total Deliveries', delta:'All time' },
                  { ico:'fa-weight-hanging', bg:'rgba(37,99,235,0.1)', color:'var(--c-secondary)', num:'127 kg',          lbl:'Food Rescued',     delta:'This month' },
                  { ico:'fa-route',          bg:'rgba(249,115,22,0.1)',color:'var(--c-accent)',    num:'38.4 km',         lbl:'Distance Covered', delta:'All time' },
                  { ico:'fa-star',           bg:'rgba(139,92,246,0.1)',color:'#8B5CF6',            num:'4.9',             lbl:'Avg. Rating',      delta:'From NGOs' },
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

      {toastMsg && <div className="db-toast"><i className="fas fa-circle-check"></i> {toastMsg}</div>}
    </div>
  );
};

export default VolunteerDashboard;
