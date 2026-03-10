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
type UserRole   = 'donor' | 'ngo' | 'volunteer' | 'admin';
type UserStatus = 'active' | 'inactive' | 'suspended';
type NgoApprovalStatus = 'pending' | 'approved' | 'rejected';
type DeliveryStatus = 'assigned' | 'picked_up' | 'en_route' | 'delivered' | 'cancelled';

interface AppUser {
  id: string; name: string; email: string; role: UserRole;
  joinDate: string; status: UserStatus;
  donations?: number; pickups?: number;
  location: string;
}

interface NgoRegistration {
  id: string; orgName: string; contactName: string; email: string;
  phone: string; location: string; description: string;
  appliedDate: string; approvalStatus: NgoApprovalStatus;
}

interface PlatformDelivery {
  id: string; item: string; donor: string; ngo: string;
  volunteer: string; quantity: string; date: string;
  status: DeliveryStatus;
}

/* ─── Mock data ─────────────────────────────────────────────── */
const MOCK_USERS: AppUser[] = [
  { id:'1', name:'Rajesh Sharma',     email:'rajesh@foodco.in',   role:'donor',     joinDate:'2025-12-01', status:'active',    donations:23, location:'Bengaluru' },
  { id:'2', name:'Priya Singh',       email:'priya@helpngo.org',  role:'ngo',       joinDate:'2025-11-15', status:'active',    donations:0,  location:'Mumbai' },
  { id:'3', name:'Ananya Verma',      email:'ananya@gmail.com',   role:'volunteer', joinDate:'2026-01-05', status:'active',    pickups:17,   location:'Delhi' },
  { id:'4', name:'Hotel Grandeur',    email:'ops@grandeur.com',   role:'donor',     joinDate:'2025-10-20', status:'active',    donations:51, location:'Bengaluru' },
  { id:'5', name:'City Bakery',       email:'info@citybakery.in', role:'donor',     joinDate:'2025-09-11', status:'inactive',  donations:8,  location:'Kolkata' },
  { id:'6', name:'Feeding India',     email:'mail@feedindia.org', role:'ngo',       joinDate:'2025-08-30', status:'suspended', donations:0,  location:'Chennai' },
  { id:'7', name:'Karan Mehta',       email:'karan@gmail.com',    role:'volunteer', joinDate:'2026-02-14', status:'active',    pickups:9,    location:'Mumbai' },
  { id:'8', name:'Fresh Mart',        email:'fresh@mart.co',      role:'donor',     joinDate:'2026-01-22', status:'active',    donations:14, location:'Hyderabad' },
  { id:'9', name:'Green Hope Trust',  email:'info@greenhope.org', role:'ngo',       joinDate:'2025-12-10', status:'active',    donations:0,  location:'Bengaluru' },
  { id:'10',name:'Sunita Patel',      email:'sunita@gmail.com',   role:'volunteer', joinDate:'2026-03-01', status:'active',    pickups:4,    location:'Pune' },
];

const MOCK_NGO_REGISTRATIONS: NgoRegistration[] = [
  { id:'n1', orgName:'Hope Feeds',         contactName:'Arun Kumar',    email:'arun@hopefeeds.org',    phone:'+91-9812345678', location:'Hyderabad', description:'Distributing food to urban poor families across Hyderabad.', appliedDate:'2026-03-07', approvalStatus:'pending' },
  { id:'n2', orgName:'Nourish India',      contactName:'Meera Joshi',   email:'meera@nourishindia.in', phone:'+91-9723456789', location:'Pune',      description:'Community kitchen serving 200+ meals daily to homeless.', appliedDate:'2026-03-06', approvalStatus:'pending' },
  { id:'n3', orgName:'FoodCare Trust',     contactName:'Sanjay Desai',  email:'info@foodcare.org',     phone:'+91-9634567890', location:'Surat',     description:'Food redistribution NGO working with local temples.', appliedDate:'2026-03-05', approvalStatus:'approved' },
  { id:'n4', orgName:'Helping Hands NGO',  contactName:'Lakshmi Nair',  email:'lnair@helpinghands.in', phone:'+91-9545678901', location:'Kochi',     description:'Providing meals to elderly care homes and orphanages.', appliedDate:'2026-03-04', approvalStatus:'rejected' },
];

const MOCK_DELIVERIES: PlatformDelivery[] = [
  { id:'del1', item:'Cooked Biryani',  donor:'Sunshine Hotel',  ngo:'Green Hope Trust', volunteer:'Ananya Verma', quantity:'25 kg',       date:'2026-03-09', status:'en_route' },
  { id:'del2', item:'Fresh Bread',     donor:'City Bakery',     ngo:'Priya Singh',      volunteer:'Raj Kumar',    quantity:'10 kg',       date:'2026-03-09', status:'delivered' },
  { id:'del3', item:'Mixed Vegetables',donor:'Fresh Mart',      ngo:'Feeding India',    volunteer:'Karan Mehta',  quantity:'15 kg',       date:'2026-03-09', status:'picked_up' },
  { id:'del4', item:'Dal & Rice',      donor:'Hotel Grandeur',  ngo:'Green Hope Trust', volunteer:'Sunita Patel', quantity:'30 servings', date:'2026-03-08', status:'delivered' },
  { id:'del5', item:'Fruit Platter',   donor:'Grand Catering',  ngo:'Priya Singh',      volunteer:'Arjun Mehta',  quantity:'8 kg',        date:'2026-03-08', status:'assigned' },
  { id:'del6', item:'Dairy Products',  donor:'Amul Booth',      ngo:'Feeding India',    volunteer:'Raj Kumar',    quantity:'20 litres',   date:'2026-03-07', status:'delivered' },
  { id:'del7', item:'Packaged Biscuits',donor:'Parle Foods',    ngo:'Green Hope Trust', volunteer:'Ananya Verma', quantity:'50 boxes',    date:'2026-03-07', status:'cancelled' },
];

const MONTHS = ['Sep','Oct','Nov','Dec','Jan','Feb','Mar'];

const ROLE_BADGE: Record<UserRole,string>     = { donor:'badge-green', ngo:'badge-blue', volunteer:'badge-orange', admin:'badge-red' };
const STATUS_BADGE: Record<UserStatus,string> = { active:'badge-green', inactive:'badge-gray', suspended:'badge-red' };
const DELIVERY_STATUS_BADGE: Record<DeliveryStatus,string> = {
  assigned:'badge-gray', picked_up:'badge-orange', en_route:'badge-blue', delivered:'badge-green', cancelled:'badge-red',
};
const NGO_APPROVAL_BADGE: Record<NgoApprovalStatus,string> = {
  pending:'badge-orange', approved:'badge-green', rejected:'badge-red',
};

type Tab = 'overview' | 'donors' | 'volunteers' | 'ngos' | 'users' | 'deliveries' | 'analytics';

/* ═══════════════════════════════════════════════════════════════
   ADMIN DASHBOARD PAGE
═══════════════════════════════════════════════════════════════ */
const AdminDashboard: React.FC = () => {
  const user     = useSelector((state: any) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [tab, setTab]             = useState<Tab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers]         = useState<AppUser[]>(MOCK_USERS);
  const [ngoRegistrations, setNgoRegistrations] = useState<NgoRegistration[]>(MOCK_NGO_REGISTRATIONS);
  const [deliveries]              = useState<PlatformDelivery[]>(MOCK_DELIVERIES);
  const [roleFilter, setRoleFilter] = useState<'all'|UserRole>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg]   = useState<string | null>(null);

  const displayName = user?.name || 'Admin';
  const initials    = user?.name ? user.name.split(' ').map((n:string)=>n[0]).join('').toUpperCase().slice(0,2) : 'AD';

  const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 3000); };
  const handleLogout = () => { dispatch(logout()); navigate('/login'); };

  const handleStatusChange = (id: string, status: UserStatus) =>
    setUsers(prev => prev.map(u => u.id===id ? {...u, status} : u));

  const handleNgoApproval = (id: string, status: NgoApprovalStatus) => {
    setNgoRegistrations(prev => prev.map(r => r.id===id ? {...r, approvalStatus:status} : r));
    showToast(status === 'approved' ? 'NGO registration approved!' : 'NGO registration rejected.');
  };

  /* Computed */
  const donors     = users.filter(u => u.role==='donor');
  const volunteers = users.filter(u => u.role==='volunteer');
  const ngos       = users.filter(u => u.role==='ngo');
  const activeCount= users.filter(u => u.status==='active').length;

  const totalDonations = donors.reduce((a,u) => a + (u.donations||0), 0);
  const totalPickups   = volunteers.reduce((a,u) => a + (u.pickups||0), 0);
  const pendingNgos    = ngoRegistrations.filter(r => r.approvalStatus === 'pending').length;
  const totalDeliveries = deliveries.length;
  const completedDeliveries = deliveries.filter(d => d.status === 'delivered').length;

  const filteredUsers = users
    .filter(u => roleFilter==='all' || u.role===roleFilter)
    .filter(u => !searchQuery || u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()));

  /* ── Charts ── */
  const lineData = {
    labels: MONTHS,
    datasets:[
      { label:'Donations',  data:[42,65,78,91,110,136,158], borderColor:'#10B981', backgroundColor:'rgba(16,185,129,0.12)', tension:0.4, fill:true, pointRadius:4, pointBackgroundColor:'#10B981' },
      { label:'Meals Saved',data:[380,590,760,840,990,1240,1430], borderColor:'#2563EB', backgroundColor:'rgba(37,99,235,0.09)', tension:0.4, fill:true, pointRadius:4, pointBackgroundColor:'#2563EB', yAxisID:'y2' },
    ],
  };
  const lineOpts: any = {
    responsive:true, maintainAspectRatio:false,
    plugins:{ legend:{ position:'top' as const } },
    scales:{
      y:  { grid:{color:'rgba(0,0,0,0.04)'}, ticks:{color:'#64748B'}, title:{display:true,text:'Donations',color:'#10B981'} },
      y2: { position:'right', grid:{drawOnChartArea:false}, ticks:{color:'#64748B'}, title:{display:true,text:'Meals',color:'#2563EB'} },
      x:  { grid:{display:false}, ticks:{color:'#64748B'} },
    },
  };

  const barData = {
    labels:['Hotel Grandeur','Sunshine Hotel','Fresh Mart','City Bakery','Rajesh Sharma','Grand Catering'],
    datasets:[{
      label:'Donations Made',
      data:[51,38,14,8,23,19],
      backgroundColor:['#10B981','#2563EB','#F97316','#8B5CF6','#EF4444','#F59E0B'],
      borderRadius:6, borderSkipped:false,
    }],
  };
  const barOpts: any = {
    responsive:true, maintainAspectRatio:false, indexAxis:'y' as const,
    plugins:{ legend:{display:false} },
    scales:{ x:{grid:{color:'rgba(0,0,0,0.04)'},ticks:{color:'#64748B'}}, y:{grid:{display:false},ticks:{color:'#64748B'}} },
  };

  const roleDoughnut = {
    labels:['Donors','Volunteers','NGOs','Admins'],
    datasets:[{
      data:[donors.length, volunteers.length, ngos.length, 1],
      backgroundColor:['#10B981','#F97316','#2563EB','#8B5CF6'],
      borderWidth:2, borderColor:'#fff',
    }],
  };
  const doughnutOpts: any = {
    responsive:true, maintainAspectRatio:false,
    plugins:{ legend:{ position:'right' as const, labels:{font:{size:11},boxWidth:12} } },
    cutout:'68%',
  };

  const userGrowthData = {
    labels: MONTHS,
    datasets:[{
      label:'New Users',
      data:[8,13,11,18,15,22,10],
      backgroundColor:'rgba(139,92,246,0.7)',
      borderRadius:6, borderSkipped:false,
    }],
  };
  const growthOpts: any = {
    responsive:true, maintainAspectRatio:false,
    plugins:{ legend:{display:false} },
    scales:{ x:{grid:{display:false},ticks:{color:'#64748B'}}, y:{grid:{color:'rgba(0,0,0,0.04)'},ticks:{color:'#64748B'}} },
  };

  /* ─── Reusable user table ─── */
  const UserTable = ({ data }: { data: AppUser[] }) => (
    <div className="db-card">
      <div className="db-card-body" style={{ padding:0 }}>
        <table className="db-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Location</th><th>Joined</th><th>Activity</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {data.map(u => (
              <tr key={u.id}>
                <td>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#10B981,#2563EB)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.72rem', fontWeight:700, color:'#fff', flexShrink:0 }}>
                      {u.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)}
                    </div>
                    <span style={{ fontWeight:500 }}>{u.name}</span>
                  </div>
                </td>
                <td style={{ fontSize:'0.82rem', color:'var(--c-muted)' }}>{u.email}</td>
                <td><span className={`db-badge ${ROLE_BADGE[u.role]}`}>{u.role}</span></td>
                <td style={{ fontSize:'0.85rem' }}>{u.location}</td>
                <td style={{ fontSize:'0.82rem', color:'var(--c-muted)' }}>{u.joinDate}</td>
                <td style={{ fontSize:'0.82rem' }}>
                  {u.donations != null && <><i className="fas fa-box-open" style={{color:'var(--c-primary)',marginRight:4}}></i>{u.donations} donations</>}
                  {u.pickups   != null && <><i className="fas fa-motorcycle" style={{color:'var(--c-secondary)',marginRight:4}}></i>{u.pickups} pickups</>}
                </td>
                <td><span className={`db-badge ${STATUS_BADGE[u.status]}`}>{u.status}</span></td>
                <td>
                  <div style={{ display:'flex', gap:6 }}>
                    {u.status !== 'active' && (
                      <button className="db-btn db-btn-success db-btn-sm" onClick={() => handleStatusChange(u.id,'active')}>
                        <i className="fas fa-check"></i>
                      </button>
                    )}
                    {u.status !== 'suspended' && (
                      <button className="db-btn db-btn-danger db-btn-sm" onClick={() => handleStatusChange(u.id,'suspended')}>
                        <i className="fas fa-ban"></i>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="db-layout">
      {sidebarOpen && <div className="db-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* ══════════ SIDEBAR ══════════ */}
      <aside className={`db-sidebar${sidebarOpen ? ' open' : ''}`}>
        <Link to="/" className="db-logo"><i className="fas fa-leaf"></i> FoodBridge</Link>
        <nav className="db-nav">
          <div className="db-nav-section">
            <div className="db-nav-label">Admin Menu</div>
            {([
              ['overview',   'fa-chart-line',   'Dashboard'],
              ['users',      'fa-users',        'All Users'],
              ['donors',     'fa-box-open',     'Donors'],
              ['volunteers', 'fa-motorcycle',   'Volunteers'],
              ['ngos',       'fa-building',     'NGOs'],
              ['deliveries', 'fa-truck-fast',   'Deliveries'],
              ['analytics',  'fa-chart-bar',    'Analytics'],
            ] as [Tab,string,string][]).map(([t,icon,label]) => (
              <button key={t} className={`db-nav-item${tab===t?' active':''}`}
                onClick={() => { setTab(t); setSidebarOpen(false); }}>
                <i className={`fas ${icon}`}></i> {label}
                {t==='ngos' && pendingNgos>0 && <span className="notif-badge"></span>}
              </button>
            ))}
          </div>
          <div className="db-nav-section">
            <div className="db-nav-label">System</div>
            <Link to="/settings" className="db-nav-item"><i className="fas fa-gear"></i> Settings</Link>
            <Link to="/"         className="db-nav-item"><i className="fas fa-earth-asia"></i> View Site</Link>
            <button className="db-nav-item" style={{color:'#EF4444'}} onClick={handleLogout}>
              <i className="fas fa-right-from-bracket"></i> Logout
            </button>
          </div>
        </nav>
        <div className="db-user-block">
          <div className="db-avatar" style={{ background:'linear-gradient(135deg,#8B5CF6,#2563EB)' }}>{initials}</div>
          <div>
            <div className="db-user-name">{displayName}</div>
            <div className="db-user-role">Platform Admin</div>
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
              {tab==='overview'   && '📊 Admin Dashboard'}
              {tab==='users'      && '👥 All Users'}
              {tab==='donors'     && '🍽️ Donor Management'}
              {tab==='volunteers' && '🚴 Volunteer Management'}
              {tab==='ngos'       && '🏢 NGO Management'}
              {tab==='deliveries' && '🚚 Delivery Monitoring'}
              {tab==='analytics'  && '📈 Platform Analytics'}
            </div>
          </div>
          <div className="db-topbar-right">
            <button className="db-btn db-btn-ghost db-btn-sm"><i className="fas fa-bell"></i></button>
            <span className="db-badge badge-green" style={{ fontSize:'0.8rem', padding:'5px 12px' }}>
              <i className="fas fa-circle" style={{ fontSize:'7px', marginRight:5 }}></i>{activeCount} Active
            </span>
          </div>
        </div>

        <div className="db-content">

          {/* ════ OVERVIEW ════ */}
          {tab==='overview' && (
            <>
              <div className="db-page-header">
                <h2>Platform Overview 🚀</h2>
                <p>Real-time analytics across all FoodBridge users and donations.</p>
              </div>

              <div className="db-stats-row">
                {[
                  { ico:'fa-users',        bg:'rgba(16,185,129,0.1)', color:'var(--c-primary)',   num:users.length,      lbl:'Total Users',       delta:activeCount + ' active' },
                  { ico:'fa-box-open',     bg:'rgba(37,99,235,0.1)', color:'var(--c-secondary)', num:totalDonations,    lbl:'Total Donations',   delta:'All food listed' },
                  { ico:'fa-truck-fast',   bg:'rgba(249,115,22,0.1)',color:'var(--c-accent)',    num:totalDeliveries,   lbl:'Total Deliveries',  delta:completedDeliveries + ' completed' },
                  { ico:'fa-seedling',     bg:'rgba(139,92,246,0.1)',color:'#8B5CF6',            num:'532 kg',          lbl:'Food Rescued',      delta:'Saved from waste' },
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

              {/* Pending NGO registrations alert */}
              {pendingNgos > 0 && (
                <div className="db-card" style={{ marginBottom:24, border:'1.5px solid rgba(249,115,22,0.3)', background:'rgba(255,247,237,0.8)' }}>
                  <div className="db-card-body" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{ width:42, height:42, borderRadius:'50%', background:'rgba(249,115,22,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <i className="fas fa-clock" style={{ color:'var(--c-accent)', fontSize:'1.1rem' }}></i>
                      </div>
                      <div>
                        <div style={{ fontWeight:700, fontSize:'0.95rem', color:'#92400E' }}>{pendingNgos} Pending NGO Registration{pendingNgos>1?'s':''}</div>
                        <div style={{ fontSize:'0.82rem', color:'#B45309' }}>Review and approve/reject NGO applications</div>
                      </div>
                    </div>
                    <button className="db-btn db-btn-sm" style={{ background:'#F97316', color:'#fff' }} onClick={() => setTab('ngos')}>
                      Review Now <i className="fas fa-arrow-right"></i>
                    </button>
                  </div>
                </div>
              )}

              {/* Platform growth line chart */}
              <div className="db-card" style={{ marginBottom:24 }}>
                <div className="db-card-header"><div className="db-card-title"><i className="fas fa-chart-line"></i> Monthly Donations & Meals Saved</div></div>
                <div className="db-card-body"><div style={{ height:260 }}><Line data={lineData} options={lineOpts} /></div></div>
              </div>

              <div className="db-chart-row">
                {/* Top donors bar */}
                <div className="db-card db-chart-card">
                  <div className="db-card-header"><div className="db-card-title"><i className="fas fa-chart-bar"></i> Top Donors by Contributions</div></div>
                  <div className="db-card-body"><div style={{ height:240 }}><Bar data={barData} options={barOpts} /></div></div>
                </div>

                {/* Role doughnut */}
                <div className="db-card db-chart-card db-chart-card--sm">
                  <div className="db-card-header"><div className="db-card-title"><i className="fas fa-chart-pie"></i> Active Users by Role</div></div>
                  <div className="db-card-body"><div style={{ height:220 }}><Doughnut data={roleDoughnut} options={doughnutOpts} /></div></div>
                </div>
              </div>

              {/* User growth bar */}
              <div className="db-card" style={{ marginTop:24, marginBottom:24 }}>
                <div className="db-card-header"><div className="db-card-title"><i className="fas fa-user-plus"></i> New User Registrations</div></div>
                <div className="db-card-body"><div style={{ height:200 }}><Bar data={userGrowthData} options={growthOpts} /></div></div>
              </div>

              {/* Recent users table */}
              <div className="db-card">
                <div className="db-card-header">
                  <div className="db-card-title"><i className="fas fa-clock"></i> Recent Registrations</div>
                  <button className="db-btn db-btn-ghost db-btn-sm" onClick={() => setTab('users')}>
                    View all <i className="fas fa-arrow-right"></i>
                  </button>
                </div>
                <div className="db-card-body" style={{ paddingTop:0 }}>
                  <table className="db-table">
                    <thead><tr><th>Name</th><th>Role</th><th>Location</th><th>Joined</th><th>Status</th></tr></thead>
                    <tbody>
                      {[...users].sort((a,b) => b.joinDate.localeCompare(a.joinDate)).slice(0,5).map(u => (
                        <tr key={u.id}>
                          <td style={{ fontWeight:500 }}>{u.name}</td>
                          <td><span className={`db-badge ${ROLE_BADGE[u.role]}`}>{u.role}</span></td>
                          <td style={{ fontSize:'0.85rem' }}>{u.location}</td>
                          <td style={{ fontSize:'0.82rem', color:'var(--c-muted)' }}>{u.joinDate}</td>
                          <td><span className={`db-badge ${STATUS_BADGE[u.status]}`}>{u.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ════ DONORS ════ */}
          {tab==='donors' && (
            <>
              <div className="db-page-header" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
                <div>
                  <h2>Donor Management</h2>
                  <p>{donors.length} registered donors · {donors.filter(d=>d.status==='active').length} active</p>
                </div>
              </div>
              <div className="db-stats-row" style={{ marginBottom:24 }}>
                {[
                  { ico:'fa-users',    bg:'rgba(16,185,129,0.1)',  color:'var(--c-primary)',   num:donors.length,                    lbl:'Total Donors',     delta:'' },
                  { ico:'fa-box-open', bg:'rgba(37,99,235,0.1)',   color:'var(--c-secondary)', num:totalDonations,                   lbl:'Total Donations',  delta:'Combined' },
                  { ico:'fa-circle-check',bg:'rgba(249,115,22,0.1)',color:'var(--c-accent)',   num:donors.filter(d=>d.status==='active').length, lbl:'Active', delta:'Online now' },
                  { ico:'fa-star',     bg:'rgba(139,92,246,0.1)',  color:'#8B5CF6',            num:donors.sort((a,b)=>(b.donations||0)-(a.donations||0))[0]?.name.split(' ')[0]||'—', lbl:'Top Donor', delta:'Most donations' },
                ].map((s,i) => (
                  <div className="db-stat-chip" key={i}>
                    <div className="db-stat-ico" style={{background:s.bg}}><i className={`fas ${s.ico}`} style={{color:s.color}}></i></div>
                    <div><div className="db-stat-num">{s.num}</div><div className="db-stat-lbl">{s.lbl}</div>{s.delta&&<div className="db-stat-delta delta-up">{s.delta}</div>}</div>
                  </div>
                ))}
              </div>
              <UserTable data={donors} />
            </>
          )}

          {/* ════ VOLUNTEERS ════ */}
          {tab==='volunteers' && (
            <>
              <div className="db-page-header">
                <h2>Volunteer Management</h2>
                <p>{volunteers.length} registered volunteers · {totalPickups} pickups completed</p>
              </div>
              <div className="db-stats-row" style={{ marginBottom:24 }}>
                {[
                  { ico:'fa-users',        bg:'rgba(37,99,235,0.1)', color:'var(--c-secondary)', num:volunteers.length,                      lbl:'Total Volunteers', delta:'' },
                  { ico:'fa-motorcycle',   bg:'rgba(249,115,22,0.1)',color:'var(--c-accent)',    num:totalPickups,                           lbl:'Total Pickups',    delta:'Combined' },
                  { ico:'fa-circle-check', bg:'rgba(16,185,129,0.1)',color:'var(--c-primary)',   num:volunteers.filter(v=>v.status==='active').length, lbl:'Active',  delta:'Available now' },
                  { ico:'fa-star',         bg:'rgba(139,92,246,0.1)',color:'#8B5CF6',            num:volunteers.sort((a,b)=>(b.pickups||0)-(a.pickups||0))[0]?.name.split(' ')[0]||'—', lbl:'Top Volunteer', delta:'Most pickups' },
                ].map((s,i) => (
                  <div className="db-stat-chip" key={i}>
                    <div className="db-stat-ico" style={{background:s.bg}}><i className={`fas ${s.ico}`} style={{color:s.color}}></i></div>
                    <div><div className="db-stat-num">{s.num}</div><div className="db-stat-lbl">{s.lbl}</div>{s.delta&&<div className="db-stat-delta delta-up">{s.delta}</div>}</div>
                  </div>
                ))}
              </div>
              <UserTable data={volunteers} />
            </>
          )}

          {/* ════ NGOs ════ */}
          {tab==='ngos' && (
            <>
              <div className="db-page-header">
                <h2>NGO Management</h2>
                <p>{ngos.length} partner NGOs · {ngos.filter(n=>n.status==='active').length} active · {pendingNgos} pending approval</p>
              </div>

              {/* Pending Registrations */}
              {ngoRegistrations.filter(r => r.approvalStatus === 'pending').length > 0 && (
                <div className="db-card" style={{ marginBottom:24, border:'1.5px solid rgba(249,115,22,0.25)' }}>
                  <div className="db-card-header">
                    <div className="db-card-title" style={{ color:'var(--c-accent)' }}>
                      <i className="fas fa-clock"></i> Pending NGO Registrations
                      <span className="db-badge badge-orange" style={{ marginLeft:10, fontSize:'0.75rem' }}>{pendingNgos}</span>
                    </div>
                  </div>
                  <div className="db-card-body" style={{ paddingTop:0 }}>
                    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                      {ngoRegistrations.filter(r => r.approvalStatus === 'pending').map(reg => (
                        <div key={reg.id} style={{ background:'rgba(249,115,22,0.04)', border:'1px solid rgba(249,115,22,0.15)', borderRadius:'var(--r-sm)', padding:'16px 20px', display:'flex', flexWrap:'wrap', gap:16, alignItems:'center' }}>
                          <div style={{ flex:1, minWidth:220 }}>
                            <div style={{ fontWeight:700, fontSize:'0.95rem', marginBottom:4 }}>{reg.orgName}</div>
                            <div style={{ fontSize:'0.82rem', color:'var(--c-muted)', display:'flex', flexWrap:'wrap', gap:12 }}>
                              <span><i className="fas fa-user" style={{ marginRight:4 }}></i>{reg.contactName}</span>
                              <span><i className="fas fa-envelope" style={{ marginRight:4 }}></i>{reg.email}</span>
                              <span><i className="fas fa-location-dot" style={{ marginRight:4 }}></i>{reg.location}</span>
                              <span><i className="fas fa-calendar" style={{ marginRight:4 }}></i>{reg.appliedDate}</span>
                            </div>
                            <div style={{ fontSize:'0.82rem', color:'#475569', marginTop:8, fontStyle:'italic' }}>"{reg.description}"</div>
                          </div>
                          <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                            <button className="db-btn db-btn-success db-btn-sm" onClick={() => handleNgoApproval(reg.id,'approved')}>
                              <i className="fas fa-check"></i> Approve
                            </button>
                            <button className="db-btn db-btn-danger db-btn-sm" onClick={() => handleNgoApproval(reg.id,'rejected')}>
                              <i className="fas fa-times"></i> Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* All NGO registrations history */}
              {ngoRegistrations.filter(r => r.approvalStatus !== 'pending').length > 0 && (
                <div className="db-card" style={{ marginBottom:24 }}>
                  <div className="db-card-header">
                    <div className="db-card-title"><i className="fas fa-history"></i> Registration History</div>
                  </div>
                  <div className="db-card-body" style={{ paddingTop:0 }}>
                    <table className="db-table">
                      <thead><tr><th>Organisation</th><th>Contact</th><th>Location</th><th>Applied</th><th>Status</th></tr></thead>
                      <tbody>
                        {ngoRegistrations.filter(r => r.approvalStatus !== 'pending').map(reg => (
                          <tr key={reg.id}>
                            <td style={{ fontWeight:600 }}>{reg.orgName}</td>
                            <td style={{ fontSize:'0.83rem' }}>{reg.contactName}</td>
                            <td style={{ fontSize:'0.83rem' }}>{reg.location}</td>
                            <td style={{ fontSize:'0.82rem', color:'var(--c-muted)' }}>{reg.appliedDate}</td>
                            <td><span className={`db-badge ${NGO_APPROVAL_BADGE[reg.approvalStatus]}`}>{reg.approvalStatus}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <UserTable data={ngos} />
            </>
          )}

          {/* ════ DELIVERIES ════ */}
          {tab==='deliveries' && (
            <>
              <div className="db-page-header" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
                <div>
                  <h2>Delivery Monitoring</h2>
                  <p>{totalDeliveries} total deliveries · {completedDeliveries} completed · {deliveries.filter(d=>d.status!=='delivered'&&d.status!=='cancelled').length} active</p>
                </div>
              </div>

              <div className="db-stats-row" style={{ marginBottom:24 }}>
                {[
                  { ico:'fa-truck-fast',   bg:'rgba(16,185,129,0.1)',  color:'var(--c-primary)',   num:totalDeliveries,                                               lbl:'Total Deliveries',  delta:'All time' },
                  { ico:'fa-circle-check', bg:'rgba(37,99,235,0.1)',   color:'var(--c-secondary)', num:completedDeliveries,                                           lbl:'Completed',         delta:'Successfully delivered' },
                  { ico:'fa-spinner',      bg:'rgba(249,115,22,0.1)',  color:'var(--c-accent)',    num:deliveries.filter(d=>d.status==='en_route'||d.status==='picked_up').length, lbl:'In Progress', delta:'Currently moving' },
                  { ico:'fa-circle-xmark', bg:'rgba(239,68,68,0.1)',   color:'#EF4444',            num:deliveries.filter(d=>d.status==='cancelled').length,           lbl:'Cancelled',         delta:'This period' },
                ].map((s,i) => (
                  <div className="db-stat-chip" key={i}>
                    <div className="db-stat-ico" style={{background:s.bg}}><i className={`fas ${s.ico}`} style={{color:s.color}}></i></div>
                    <div><div className="db-stat-num">{s.num}</div><div className="db-stat-lbl">{s.lbl}</div><div className="db-stat-delta delta-up">{s.delta}</div></div>
                  </div>
                ))}
              </div>

              <div className="db-card">
                <div className="db-card-body" style={{ padding:0 }}>
                  <table className="db-table">
                    <thead>
                      <tr><th>Item</th><th>Donor</th><th>NGO</th><th>Volunteer</th><th>Quantity</th><th>Date</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {deliveries.map(d => (
                        <tr key={d.id}>
                          <td style={{ fontWeight:500 }}>🍽️ {d.item}</td>
                          <td style={{ fontSize:'0.83rem' }}>{d.donor}</td>
                          <td style={{ fontSize:'0.83rem' }}>{d.ngo}</td>
                          <td style={{ fontSize:'0.83rem' }}>{d.volunteer}</td>
                          <td style={{ fontSize:'0.83rem' }}>{d.quantity}</td>
                          <td style={{ fontSize:'0.82rem', color:'var(--c-muted)' }}>{d.date}</td>
                          <td><span className={`db-badge ${DELIVERY_STATUS_BADGE[d.status]}`}>{d.status.replace('_',' ')}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ════ ANALYTICS ════ */}
          {tab==='analytics' && (
            <>
              <div className="db-page-header">
                <h2>Platform Analytics</h2>
                <p>In-depth insights into donations, deliveries, and community impact</p>
              </div>

              <div className="db-stats-row">
                {[
                  { ico:'fa-users',      bg:'rgba(16,185,129,0.1)', color:'var(--c-primary)',   num:users.length,    lbl:'Total Users',     delta:'+10 this month' },
                  { ico:'fa-box-open',   bg:'rgba(37,99,235,0.1)',  color:'var(--c-secondary)', num:totalDonations,  lbl:'All Donations',   delta:'Cumulative' },
                  { ico:'fa-truck-fast', bg:'rgba(249,115,22,0.1)', color:'var(--c-accent)',    num:totalDeliveries, lbl:'All Deliveries',  delta:completedDeliveries + ' completed' },
                  { ico:'fa-seedling',   bg:'rgba(139,92,246,0.1)', color:'#8B5CF6',            num:'532 kg',        lbl:'Food Rescued',    delta:'Prevented waste' },
                ].map((s,i) => (
                  <div className="db-stat-chip" key={i}>
                    <div className="db-stat-ico" style={{background:s.bg}}><i className={`fas ${s.ico}`} style={{color:s.color}}></i></div>
                    <div><div className="db-stat-num">{s.num}</div><div className="db-stat-lbl">{s.lbl}</div><div className="db-stat-delta delta-up">{s.delta}</div></div>
                  </div>
                ))}
              </div>

              <div className="db-card" style={{ marginBottom:24 }}>
                <div className="db-card-header"><div className="db-card-title"><i className="fas fa-chart-line"></i> Monthly Donations vs Meals Saved</div></div>
                <div className="db-card-body"><div style={{ height:280 }}><Line data={lineData} options={lineOpts} /></div></div>
              </div>

              <div className="db-chart-row">
                <div className="db-card db-chart-card">
                  <div className="db-card-header"><div className="db-card-title"><i className="fas fa-chart-bar"></i> New User Registrations</div></div>
                  <div className="db-card-body"><div style={{ height:240 }}><Bar data={userGrowthData} options={growthOpts} /></div></div>
                </div>
                <div className="db-card db-chart-card db-chart-card--sm">
                  <div className="db-card-header"><div className="db-card-title"><i className="fas fa-chart-pie"></i> Users by Role</div></div>
                  <div className="db-card-body"><div style={{ height:220 }}><Doughnut data={roleDoughnut} options={doughnutOpts} /></div></div>
                </div>
              </div>

              <div className="db-card" style={{ marginTop:24 }}>
                <div className="db-card-header"><div className="db-card-title"><i className="fas fa-trophy"></i> Top Donors by Contributions</div></div>
                <div className="db-card-body"><div style={{ height:240 }}><Bar data={barData} options={barOpts} /></div></div>
              </div>
            </>
          )}

          {/* ════ ALL USERS ════ */}
          {tab==='users' && (
            <>
              <div className="db-page-header" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
                <div>
                  <h2>All Users</h2>
                  <p>{users.length} total registered users</p>
                </div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
                  <div style={{ position:'relative' }}>
                    <i className="fas fa-search" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--c-muted)', fontSize:'0.8rem' }}></i>
                    <input
                      className="db-input" placeholder="Search users…"
                      style={{ paddingLeft:30, fontSize:'0.85rem' }}
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                  {(['all','donor','ngo','volunteer'] as const).map(r => (
                    <button key={r} className={`db-btn db-btn-sm${roleFilter===r?' db-btn-primary':' db-btn-ghost'}`} onClick={() => setRoleFilter(r)}>
                      {r.charAt(0).toUpperCase()+r.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <UserTable data={filteredUsers} />
            </>
          )}

        </div>
      </main>

      {toastMsg && <div className="db-toast"><i className="fas fa-circle-check"></i> {toastMsg}</div>}
    </div>
  );
};

export default AdminDashboard;
