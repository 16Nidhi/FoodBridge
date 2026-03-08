import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, Title, Tooltip, Legend,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { logout } from '../../store/slices/authSlice';
import '../../components/common/Dashboard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

/* ─── Types ─────────────────────────────────────────────────── */
type DonationStatus = 'available' | 'reserved' | 'received' | 'distributed';
type DeliveryStatus = 'assigned' | 'picked_up' | 'en_route' | 'arrived' | 'confirmed';

interface Donation {
  id: string;
  title: string;
  donor: string;
  quantity: string;
  address: string;
  expiryDate: string;
  category: string;
  status: DonationStatus;
  reservedBy?: string;
}

interface IncomingDelivery {
  id: string;
  item: string;
  donor: string;
  quantity: string;
  category: string;
  volunteer: string;
  volunteerPhone: string;
  eta: string;
  pickedUpAt: string;
  status: DeliveryStatus;
}

/* ─── Mock data ─────────────────────────────────────────────── */
const INIT_DONATIONS: Donation[] = [
  { id:'1', title:'Cooked Biryani',      donor:'Sunshine Hotel',  quantity:'25 kg',       address:'12 MG Road, Bengaluru',    expiryDate:'2026-03-08', category:'Cooked Food', status:'available' },
  { id:'2', title:'Fresh Bread & Rolls', donor:'City Bakery',     quantity:'10 kg',       address:'5 Park Street, Kolkata',   expiryDate:'2026-03-09', category:'Bakery',      status:'reserved', reservedBy:'Your NGO' },
  { id:'3', title:'Mixed Vegetables',    donor:'Fresh Mart',      quantity:'15 kg',       address:'88 Church Street, Chennai',expiryDate:'2026-03-10', category:'Produce',     status:'available' },
  { id:'4', title:'Dal & Rice',          donor:'Hotel Grandeur',  quantity:'30 servings', address:'4 Infantry Road, Delhi',   expiryDate:'2026-03-07', category:'Cooked Food', status:'received' },
  { id:'5', title:'Fruit Platter',       donor:'Grand Catering',  quantity:'8 kg',        address:'22 Bandra West, Mumbai',   expiryDate:'2026-03-09', category:'Fruits',      status:'available' },
  { id:'6', title:'Dairy Products',      donor:'Amul Booth',      quantity:'20 litres',   address:'7 Linking Road, Mumbai',   expiryDate:'2026-03-08', category:'Dairy',       status:'distributed' },
  { id:'7', title:'Packaged Biscuits',   donor:'Parle Foods',     quantity:'50 boxes',    address:'Andheri West, Mumbai',     expiryDate:'2026-04-01', category:'Packaged',    status:'available' },
];

const INIT_DELIVERIES: IncomingDelivery[] = [
  { id:'d1', item:'Cooked Biryani',     donor:'Sunshine Hotel', quantity:'25 kg',       category:'Cooked Food', volunteer:'Ananya Sharma', volunteerPhone:'+91-9876543210', eta:'~12 mins', pickedUpAt:'10:45 AM', status:'en_route' },
  { id:'d2', item:'Fresh Bread & Rolls',donor:'City Bakery',    quantity:'10 kg',       category:'Bakery',      volunteer:'Raj Kumar',     volunteerPhone:'+91-9845123456', eta:'Arrived',  pickedUpAt:'11:05 AM', status:'arrived' },
  { id:'d3', item:'Mixed Vegetables',   donor:'Fresh Mart',     quantity:'15 kg',       category:'Produce',     volunteer:'Arjun Mehta',   volunteerPhone:'+91-9712345678', eta:'~28 mins', pickedUpAt:'11:30 AM', status:'picked_up' },
  { id:'d4', item:'Fruit Platter',      donor:'Grand Catering', quantity:'8 kg',        category:'Fruits',      volunteer:'Karan Anand',   volunteerPhone:'+91-9823456789', eta:'—',        pickedUpAt:'09:00 AM', status:'confirmed' },
  { id:'d5', item:'Dal & Rice',         donor:'Hotel Grandeur', quantity:'30 servings', category:'Cooked Food', volunteer:'Priya Singh',   volunteerPhone:'+91-9634567890', eta:'Assigned', pickedUpAt:'—',        status:'assigned' },
];

const DISTRIBUTION_LOG = [
  { date:'2026-03-06', item:'Dal & Rice',      quantity:'30 servings', beneficiaries:45, volunteer:'Ananya Sharma' },
  { date:'2026-03-05', item:'Dairy Products',  quantity:'20 L',        beneficiaries:20, volunteer:'Raj Kumar' },
  { date:'2026-03-04', item:'Cooked Biryani',  quantity:'18 kg',       beneficiaries:60, volunteer:'Priya Singh' },
  { date:'2026-03-02', item:'Bread & Rolls',   quantity:'10 kg',       beneficiaries:32, volunteer:'Arjun Mehta' },
];

const CATEGORY_COLORS: Record<string,string> = {
  'Cooked Food':'#10B981','Bakery':'#F97316','Produce':'#2563EB',
  'Fruits':'#8B5CF6','Dairy':'#EF4444','Packaged':'#F59E0B',
};
const EMOJI_MAP: Record<string,string> = {
  'Cooked Food':'🍛','Bakery':'🍞','Produce':'🥦','Fruits':'🍎','Dairy':'🥛','Packaged':'📦',
};
const STATUS_BADGE: Record<DonationStatus,string> = {
  available:'badge-orange', reserved:'badge-blue', received:'badge-green', distributed:'badge-gray',
};
const DELIVERY_STATUS_BADGE: Record<DeliveryStatus,string> = {
  assigned:'badge-gray', picked_up:'badge-orange', en_route:'badge-blue', arrived:'badge-green', confirmed:'badge-gray',
};
const DELIVERY_STATUS_LABEL: Record<DeliveryStatus,string> = {
  assigned:'Assigned', picked_up:'Picked Up', en_route:'En Route', arrived:'Arrived', confirmed:'Confirmed',
};

const WEEKS = ['Week 1','Week 2','Week 3','Week 4','Week 5','Week 6','Week 7'];
const MONTHS = ['Sep','Oct','Nov','Dec','Jan','Feb','Mar'];
type Tab = 'overview' | 'incoming' | 'donations' | 'received' | 'distribution' | 'statistics';

/* ═══════════════════════════════════════════════════════════════
   NGO DASHBOARD PAGE
═══════════════════════════════════════════════════════════════ */
const NgoDashboard: React.FC = () => {
  const user     = useSelector((state: any) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [tab, setTab]                 = useState<Tab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [donations, setDonations]     = useState<Donation[]>(INIT_DONATIONS);
  const [deliveries, setDeliveries]   = useState<IncomingDelivery[]>(INIT_DELIVERIES);
  const [filter, setFilter]           = useState<'all'|DonationStatus>('all');
  const [toastMsg, setToastMsg]       = useState<string | null>(null);

  const initials    = user?.name ? user.name.split(' ').map((n:string)=>n[0]).join('').toUpperCase().slice(0,2) : 'NG';
  const displayName = user?.name || 'NGO Manager';

  const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 3000); };
  const handleLogout = () => { dispatch(logout()); navigate('/login'); };

  const handleConfirmDelivery = (id: string) => {
    setDeliveries(prev => prev.map(d => d.id===id ? {...d, status:'confirmed'} : d));
    showToast('Food received confirmed! Thank you for updating.');
  };

  const handleDeliveryStep = (id: string, next: DeliveryStatus) => {
    setDeliveries(prev => prev.map(d => d.id===id ? {...d, status:next} : d));
  };

  const handleClaim = (id: string) => {
    setDonations(prev => prev.map(d => d.id===id ? {...d, status:'reserved', reservedBy:displayName} : d));
    showToast('Donation claimed! Coordinate with the volunteer for pickup.');
  };

  const handleReceive = (id: string) => {
    setDonations(prev => prev.map(d => d.id===id ? {...d, status:'received'} : d));
    showToast('Marked as received.');
  };

  const handleDistribute = (id: string) => {
    setDonations(prev => prev.map(d => d.id===id ? {...d, status:'distributed'} : d));
    showToast('Marked as distributed to beneficiaries!');
  };

  /* Stats */
  const stats = {
    available:   donations.filter(d => d.status==='available').length,
    reserved:    donations.filter(d => d.status==='reserved').length,
    received:    donations.filter(d => d.status==='received').length,
    distributed: donations.filter(d => d.status==='distributed').length,
  };

  const incomingActive   = deliveries.filter(d => d.status !== 'confirmed').length;
  const deliveriesToday  = deliveries.filter(d => d.status === 'confirmed' || d.status === 'arrived').length;
  const activeVolunteers = [...new Set(deliveries.filter(d => d.status !== 'confirmed').map(d => d.volunteer))].length;
  const totalReceived    = donations.filter(d => d.status==='received' || d.status==='distributed').length;

  const filtered = filter==='all' ? donations : donations.filter(d => d.status===filter);
  const received  = donations.filter(d => d.status==='received' || d.status==='distributed');

  /* Charts */
  const weeklyLineData = {
    labels: WEEKS,
    datasets:[
      { label:'Food Received (kg)', data:[48,65,54,82,70,95,112], borderColor:'#10B981', backgroundColor:'rgba(16,185,129,0.12)', tension:0.4, fill:true, pointRadius:4, pointBackgroundColor:'#10B981' },
      { label:'Distributed (kg)',   data:[40,58,48,74,63,88,104], borderColor:'#F97316', backgroundColor:'rgba(249,115,22,0.08)',  tension:0.4, fill:true, pointRadius:4, pointBackgroundColor:'#F97316' },
    ],
  };
  const lineData = {
    labels: MONTHS,
    datasets:[
      { label:'Food Received (kg)', data:[64,82,71,98,90,115,132], borderColor:'#10B981', backgroundColor:'rgba(16,185,129,0.12)', tension:0.4, fill:true, pointRadius:4, pointBackgroundColor:'#10B981' },
      { label:'Distributed (kg)',   data:[55,72,62,85,81,108,120], borderColor:'#F97316', backgroundColor:'rgba(249,115,22,0.08)',  tension:0.4, fill:true, pointRadius:4, pointBackgroundColor:'#F97316' },
    ],
  };
  const lineOpts: any = {
    responsive:true, maintainAspectRatio:false,
    plugins:{ legend:{ position:'top' as const } },
    scales:{ x:{grid:{display:false},ticks:{color:'#64748B'}}, y:{grid:{color:'rgba(0,0,0,0.04)'},ticks:{color:'#64748B'}} },
  };

  const catCounts: Record<string,number> = {};
  donations.forEach(d => { catCounts[d.category] = (catCounts[d.category]||0) + 1; });
  const doughnutData = {
    labels: Object.keys(catCounts),
    datasets:[{ data: Object.values(catCounts), backgroundColor: Object.keys(catCounts).map(c => CATEGORY_COLORS[c]||'#94A3B8'), borderWidth:2, borderColor:'#fff' }],
  };
  const doughnutOpts: any = {
    responsive:true, maintainAspectRatio:false,
    plugins:{ legend:{ position:'right' as const, labels:{ font:{size:11}, boxWidth:12 } } },
    cutout:'68%',
  };

  const barData = {
    labels: MONTHS,
    datasets:[{
      label:'Beneficiaries Fed',
      data:[142,198,175,234,215,267,310],
      backgroundColor:'rgba(37,99,235,0.75)',
      borderRadius:6, borderSkipped:false,
    }],
  };
  const barOpts: any = {
    responsive:true, maintainAspectRatio:false,
    plugins:{ legend:{display:false} },
    scales:{ x:{grid:{display:false},ticks:{color:'#64748B'}}, y:{grid:{color:'rgba(0,0,0,0.04)'},ticks:{color:'#64748B'}} },
  };

  return (
    <div className="db-layout">
      {sidebarOpen && <div className="db-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* ══════════ SIDEBAR ══════════ */}
      <aside className={`db-sidebar${sidebarOpen ? ' open' : ''}`}>
        <Link to="/" className="db-logo"><i className="fas fa-leaf"></i> FoodBridge</Link>
        <nav className="db-nav">
          <div className="db-nav-section">
            <div className="db-nav-label">NGO Menu</div>
            {([
              ['overview',     'fa-chart-pie',       'Dashboard'],
              ['incoming',     'fa-truck-fast',      'Incoming Deliveries'],
              ['donations',    'fa-boxes-stacked',   'Available Donations'],
              ['received',     'fa-inbox',           'Received Food'],
              ['distribution', 'fa-clipboard-list',  'Distribution Log'],
              ['statistics',   'fa-chart-bar',       'Statistics'],
            ] as [Tab,string,string][]).map(([t,icon,label]) => (
              <button key={t} className={`db-nav-item${tab===t?' active':''}`}
                onClick={() => { setTab(t); setSidebarOpen(false); }}>
                <i className={`fas ${icon}`}></i> {label}
                {t==='incoming' && incomingActive>0 && <span className="notif-badge"></span>}
                {t==='donations' && stats.available>0 && <span className="notif-badge"></span>}
                {t==='received'  && stats.received>0  && <span className="notif-badge"></span>}
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
          <div className="db-avatar" style={{ background:'linear-gradient(135deg,#F97316,#F59E0B)' }}>{initials}</div>
          <div>
            <div className="db-user-name">{displayName}</div>
            <div className="db-user-role">NGO Manager</div>
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
              {tab==='overview'     && '📊 NGO Dashboard'}
              {tab==='incoming'     && '🚚 Incoming Deliveries'}
              {tab==='donations'    && '📦 Available Donations'}
              {tab==='received'     && '📥 Received Food'}
              {tab==='distribution' && '📋 Distribution Log'}
              {tab==='statistics'   && '📈 Statistics'}
            </div>
          </div>
          <div className="db-topbar-right">
            <button className="db-btn db-btn-ghost db-btn-sm"><i className="fas fa-bell"></i></button>
            {stats.available > 0 && (
              <span className="db-badge badge-orange" style={{ fontSize:'0.8rem', padding:'5px 12px' }}>
                {stats.available} New
              </span>
            )}
          </div>
        </div>

        <div className="db-content">

          {/* ════ OVERVIEW ════ */}
          {tab==='overview' && (
            <>
              <div className="db-page-header">
                <h2>Welcome, {displayName}! 🏢</h2>
                <p>Track incoming deliveries and manage food distribution for your community.</p>
              </div>

              <div className="db-stats-row">
                {[
                  { ico:'fa-inbox',         bg:'rgba(16,185,129,0.1)', color:'var(--c-primary)',   num:totalReceived,      lbl:'Total Food Received',  delta:'All time' },
                  { ico:'fa-truck-fast',    bg:'rgba(37,99,235,0.1)',  color:'var(--c-secondary)', num:deliveriesToday,    lbl:'Deliveries Today',     delta:'Confirmed today' },
                  { ico:'fa-person-biking', bg:'rgba(249,115,22,0.1)', color:'var(--c-accent)',    num:activeVolunteers,   lbl:'Active Volunteers',    delta:'En route now' },
                  { ico:'fa-people-group',  bg:'rgba(139,92,246,0.1)', color:'#8B5CF6',            num:stats.distributed, lbl:'Distributed',          delta:'Served to community' },
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

              {/* Incoming at-a-glance */}
              {incomingActive > 0 && (
                <div className="db-card" style={{ marginBottom:24, border:'1.5px solid rgba(37,99,235,0.2)', background:'rgba(239,246,255,0.6)' }}>
                  <div className="db-card-header">
                    <div className="db-card-title" style={{ color:'var(--c-secondary)' }}>
                      <i className="fas fa-truck-fast"></i> {incomingActive} Deliveries In Progress
                    </div>
                    <button className="db-btn db-btn-secondary db-btn-sm" onClick={() => setTab('incoming')}>
                      Track All <i className="fas fa-arrow-right"></i>
                    </button>
                  </div>
                  <div className="db-card-body" style={{ paddingTop:0 }}>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:12 }}>
                      {deliveries.filter(d => d.status !== 'confirmed').slice(0,3).map(d => (
                        <div key={d.id} style={{ display:'flex', alignItems:'center', gap:10, background:'#fff', borderRadius:'var(--r-sm)', padding:'10px 14px', boxShadow:'0 1px 6px rgba(0,0,0,0.07)', flex:'1 1 240px' }}>
                          <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#2563EB,#3B82F6)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:'0.8rem', fontWeight:700, flexShrink:0 }}>
                            {d.volunteer.split(' ').map(n=>n[0]).join('')}
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontWeight:600, fontSize:'0.88rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.item}</div>
                            <div style={{ fontSize:'0.78rem', color:'var(--c-muted)' }}>{d.volunteer} · ETA {d.eta}</div>
                          </div>
                          <span className={`db-badge ${DELIVERY_STATUS_BADGE[d.status]}`} style={{ fontSize:'0.72rem' }}>{DELIVERY_STATUS_LABEL[d.status]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="db-chart-row">
                <div className="db-card db-chart-card">
                  <div className="db-card-header"><div className="db-card-title"><i className="fas fa-chart-line"></i> Weekly Food Received (kg)</div></div>
                  <div className="db-card-body"><div style={{ height:240 }}><Line data={weeklyLineData} options={lineOpts} /></div></div>
                </div>
                <div className="db-card db-chart-card db-chart-card--sm">
                  <div className="db-card-header"><div className="db-card-title"><i className="fas fa-chart-pie"></i> Distribution Categories</div></div>
                  <div className="db-card-body"><div style={{ height:220 }}><Doughnut data={doughnutData} options={doughnutOpts} /></div></div>
                </div>
              </div>

              <div className="db-card" style={{ marginBottom:24 }}>
                <div className="db-card-header"><div className="db-card-title"><i className="fas fa-chart-bar"></i> Beneficiaries Fed (per month)</div></div>
                <div className="db-card-body"><div style={{ height:200 }}><Bar data={barData} options={barOpts} /></div></div>
              </div>

              {/* Recent distribution */}
              <div className="db-card">
                <div className="db-card-header">
                  <div className="db-card-title"><i className="fas fa-clock"></i> Recent Distributions</div>
                  <button className="db-btn db-btn-ghost db-btn-sm" onClick={() => setTab('distribution')}>
                    View all <i className="fas fa-arrow-right"></i>
                  </button>
                </div>
                <div className="db-card-body" style={{ paddingTop:0 }}>
                  <table className="db-table">
                    <thead><tr><th>Date</th><th>Item</th><th>Quantity</th><th>Beneficiaries</th><th>Volunteer</th></tr></thead>
                    <tbody>
                      {DISTRIBUTION_LOG.map((r, i) => (
                        <tr key={i}>
                          <td style={{ fontSize:'0.82rem', color:'var(--c-muted)' }}>{r.date}</td>
                          <td>{r.item}</td>
                          <td>{r.quantity}</td>
                          <td><span className="db-badge badge-green">{r.beneficiaries} people</span></td>
                          <td style={{ fontSize:'0.85rem' }}>{r.volunteer}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ════ INCOMING DELIVERIES ════ */}
          {tab==='incoming' && (
            <>
              <div className="db-page-header" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
                <div>
                  <h2>Incoming Deliveries</h2>
                  <p>{incomingActive} active deliveries headed to your location</p>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <span className="db-badge badge-blue" style={{ padding:'8px 14px', fontSize:'0.82rem' }}>
                    <i className="fas fa-truck-fast" style={{ marginRight:5 }}></i>{incomingActive} En Route
                  </span>
                </div>
              </div>

              {deliveries.length === 0
                ? <div className="db-empty-state"><i className="fas fa-truck-fast"></i><p>No deliveries at the moment.</p></div>
                : (
                  <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                    {deliveries.map(delivery => (
                      <div
                        key={delivery.id}
                        className="db-card"
                        style={{
                          borderLeft: delivery.status === 'arrived'  ? '4px solid #10B981'
                                    : delivery.status === 'en_route' ? '4px solid #2563EB'
                                    : delivery.status === 'confirmed'? '4px solid #94A3B8'
                                    : '4px solid #F97316',
                          opacity: delivery.status === 'confirmed' ? 0.7 : 1,
                        }}
                      >
                        <div className="db-card-body" style={{ display:'flex', flexWrap:'wrap', gap:20, alignItems:'center' }}>
                          {/* Volunteer avatar */}
                          <div style={{ textAlign:'center', minWidth:60 }}>
                            <div style={{ width:52, height:52, borderRadius:'50%', background:'linear-gradient(135deg,#2563EB,#3B82F6)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:'0.95rem', margin:'0 auto 6px' }}>
                              {delivery.volunteer.split(' ').map(n=>n[0]).join('')}
                            </div>
                            <div style={{ fontSize:'0.72rem', color:'var(--c-muted)', whiteSpace:'nowrap' }}>Volunteer</div>
                          </div>

                          {/* Delivery info */}
                          <div style={{ flex:1, minWidth:200 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                              <span style={{ fontWeight:700, fontSize:'1rem' }}>{EMOJI_MAP[delivery.category]||'🍽️'} {delivery.item}</span>
                              <span className={`db-badge ${DELIVERY_STATUS_BADGE[delivery.status]}`}>{DELIVERY_STATUS_LABEL[delivery.status]}</span>
                            </div>
                            <div style={{ display:'flex', flexWrap:'wrap', gap:14, fontSize:'0.83rem', color:'var(--c-muted)' }}>
                              <span><i className="fas fa-user" style={{ marginRight:5, color:'var(--c-secondary)' }}></i>{delivery.volunteer}</span>
                              <span><i className="fas fa-phone" style={{ marginRight:5, color:'var(--c-primary)' }}></i>{delivery.volunteerPhone}</span>
                              <span><i className="fas fa-store" style={{ marginRight:5, color:'var(--c-accent)' }}></i>{delivery.donor}</span>
                              <span><i className="fas fa-weight-hanging" style={{ marginRight:5 }}></i>{delivery.quantity}</span>
                            </div>
                          </div>

                          {/* ETA & timing */}
                          <div style={{ textAlign:'center', minWidth:90 }}>
                            <div style={{ fontSize:'1.3rem', fontWeight:800, color: delivery.status==='arrived'?'#10B981':delivery.status==='en_route'?'#2563EB':'#94A3B8' }}>
                              {delivery.eta}
                            </div>
                            <div style={{ fontSize:'0.72rem', color:'var(--c-muted)' }}>ETA</div>
                            {delivery.pickedUpAt !== '—' && (
                              <div style={{ fontSize:'0.72rem', color:'var(--c-muted)', marginTop:4 }}>
                                Picked up {delivery.pickedUpAt}
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div style={{ display:'flex', flexDirection:'column', gap:8, minWidth:160 }}>
                            {delivery.status === 'arrived' && (
                              <button className="db-btn db-btn-success" onClick={() => handleConfirmDelivery(delivery.id)}>
                                <i className="fas fa-circle-check"></i> Confirm Food Received
                              </button>
                            )}
                            {delivery.status === 'en_route' && (
                              <button className="db-btn db-btn-secondary db-btn-sm" onClick={() => handleDeliveryStep(delivery.id, 'arrived')}>
                                <i className="fas fa-location-dot"></i> Mark as Arrived
                              </button>
                            )}
                            {delivery.status === 'picked_up' && (
                              <button className="db-btn db-btn-ghost db-btn-sm" onClick={() => handleDeliveryStep(delivery.id, 'en_route')}>
                                <i className="fas fa-truck-fast"></i> Mark En Route
                              </button>
                            )}
                            {delivery.status === 'confirmed' && (
                              <span className="db-badge badge-gray" style={{ textAlign:'center', padding:'8px 12px' }}>
                                <i className="fas fa-circle-check"></i> Received
                              </span>
                            )}
                            {delivery.status === 'assigned' && (
                              <span style={{ fontSize:'0.78rem', color:'var(--c-muted)', textAlign:'center' }}>Waiting for volunteer to pick up</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
            </>
          )}

          {/* ════ AVAILABLE DONATIONS ════ */}
          {tab==='donations' && (
            <>
              <div className="db-page-header" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
                <div>
                  <h2>Available Donations</h2>
                  <p>{stats.available} unclaimed donations near you</p>
                </div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {(['all','available','reserved','received','distributed'] as const).map(f => (
                    <button key={f} className={`db-btn db-btn-sm${filter===f?' db-btn-primary':' db-btn-ghost'}`} onClick={() => setFilter(f)}>
                      {f.charAt(0).toUpperCase()+f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {filtered.length === 0
                ? <div className="db-empty-state"><i className="fas fa-boxes-stacked"></i><p>No donations in this category.</p></div>
                : (
                  <div className="pickup-cards-grid">
                    {filtered.map(d => (
                      <div className="pickup-card" key={d.id} style={{ '--accent-color':'var(--c-accent)' } as any}>
                        <div className="pickup-card-header">
                          <div>
                            <div className="pickup-card-title">{EMOJI_MAP[d.category]||'🍽️'} {d.title}</div>
                            <div style={{ fontSize:'0.8rem', color:'var(--c-muted)', marginTop:4 }}>
                              <i className="fas fa-store" style={{ marginRight:5 }}></i>{d.donor}
                            </div>
                          </div>
                          <span className={`db-badge ${STATUS_BADGE[d.status]}`}>{d.status}</span>
                        </div>

                        <div style={{ display:'flex', flexWrap:'wrap', gap:10, margin:'12px 0' }}>
                          <span className="donation-meta-item"><i className="fas fa-weight-hanging"></i>{d.quantity}</span>
                          <span className="donation-meta-item"><i className="fas fa-location-dot"></i>{d.address.split(',')[0]}</span>
                          <span className="donation-meta-item"><i className="fas fa-tag"></i>{d.category}</span>
                          <span className="donation-meta-item"><i className="fas fa-calendar"></i>{d.expiryDate}</span>
                        </div>

                        {d.reservedBy && (
                          <div style={{ fontSize:'0.78rem', color:'var(--c-secondary)', background:'rgba(37,99,235,0.06)', borderRadius:'var(--r-sm)', padding:'6px 10px', marginBottom:10 }}>
                            <i className="fas fa-bookmark" style={{ marginRight:5 }}></i>Reserved by {d.reservedBy}
                          </div>
                        )}

                        <div className="pickup-card-actions">
                          {d.status === 'available' && (
                            <button className="db-btn db-btn-primary" style={{ flex:1 }} onClick={() => handleClaim(d.id)}>
                              <i className="fas fa-hand-holding"></i> Claim Donation
                            </button>
                          )}
                          {d.status === 'reserved' && (
                            <button className="db-btn db-btn-secondary" style={{ flex:1 }} onClick={() => handleReceive(d.id)}>
                              <i className="fas fa-inbox"></i> Mark Received
                            </button>
                          )}
                          {d.status === 'received' && (
                            <button className="db-btn db-btn-success" style={{ flex:1 }} onClick={() => handleDistribute(d.id)}>
                              <i className="fas fa-people-group"></i> Mark Distributed
                            </button>
                          )}
                          {d.status === 'distributed' && (
                            <span className="db-badge badge-gray" style={{ margin:'0 auto', padding:'8px 16px' }}>Completed</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
            </>
          )}

          {/* ════ RECEIVED FOOD ════ */}
          {tab==='received' && (
            <>
              <div className="db-page-header">
                <h2>Received Food Tracker</h2>
                <p>Items in your possession ready for distribution</p>
              </div>

              {received.length === 0
                ? <div className="db-empty-state"><i className="fas fa-inbox"></i><p>No received donations yet.</p></div>
                : (
                  <div className="db-card">
                    <div className="db-card-body" style={{ padding:0 }}>
                      <table className="db-table">
                        <thead>
                          <tr><th>Item</th><th>Donor</th><th>Quantity</th><th>Category</th><th>Received Date</th><th>Status</th><th>Action</th></tr>
                        </thead>
                        <tbody>
                          {received.map(d => (
                            <tr key={d.id}>
                              <td>{EMOJI_MAP[d.category]||'🍽️'} {d.title}</td>
                              <td style={{ fontSize:'0.85rem' }}>{d.donor}</td>
                              <td>{d.quantity}</td>
                              <td><span className="db-badge badge-blue">{d.category}</span></td>
                              <td style={{ fontSize:'0.82rem', color:'var(--c-muted)' }}>{d.expiryDate}</td>
                              <td><span className={`db-badge ${STATUS_BADGE[d.status]}`}>{d.status}</span></td>
                              <td>
                                {d.status==='received' && (
                                  <button className="db-btn db-btn-success db-btn-sm" onClick={() => handleDistribute(d.id)}>
                                    <i className="fas fa-people-group"></i> Distribute
                                  </button>
                                )}
                              </td>
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

          {/* ════ DISTRIBUTION LOG ════ */}
          {tab==='distribution' && (
            <>
              <div className="db-page-header">
                <h2>Distribution Log</h2>
                <p>Record of all food distributed to beneficiaries</p>
              </div>

              {/* summary chips */}
              <div className="db-stats-row" style={{ marginBottom:24 }}>
                {[
                  { ico:'fa-utensils',     bg:'rgba(16,185,129,0.1)', color:'var(--c-primary)',   num:DISTRIBUTION_LOG.length, lbl:'Distributions',      delta:'This month' },
                  { ico:'fa-people-group', bg:'rgba(37,99,235,0.1)', color:'var(--c-secondary)', num:DISTRIBUTION_LOG.reduce((a,r)=>a+r.beneficiaries,0), lbl:'Beneficiaries Fed', delta:'Total' },
                  { ico:'fa-weight-hanging',bg:'rgba(249,115,22,0.1)',color:'var(--c-accent)',   num:'78 kg',                  lbl:'Food Distributed',   delta:'This month' },
                  { ico:'fa-star',          bg:'rgba(139,92,246,0.1)',color:'#8B5CF6',           num:'100%',                   lbl:'Success Rate',       delta:'All items used' },
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

              <div className="db-card">
                <div className="db-card-body" style={{ padding:0 }}>
                  <table className="db-table">
                    <thead>
                      <tr><th>Date</th><th>Food Item</th><th>Quantity</th><th>Beneficiaries</th><th>Volunteer</th></tr>
                    </thead>
                    <tbody>
                      {DISTRIBUTION_LOG.map((r, i) => (
                        <tr key={i}>
                          <td style={{ fontSize:'0.82rem', color:'var(--c-muted)', whiteSpace:'nowrap' }}>{r.date}</td>
                          <td>🍽️ {r.item}</td>
                          <td>{r.quantity}</td>
                          <td><span className="db-badge badge-green">{r.beneficiaries} people</span></td>
                          <td style={{ fontSize:'0.85rem' }}>{r.volunteer}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {toastMsg && <div className="db-toast"><i className="fas fa-circle-check"></i> {toastMsg}</div>}
    </div>
  );
};

export default NgoDashboard;
