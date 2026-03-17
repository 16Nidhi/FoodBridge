import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  adminGetStats, adminGetUsers, adminGetDonations, adminGetVerifications,
  adminReviewVerification, adminUpdateUserStatus, adminUpdateUserVerification,
} from '../../services/api';
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
type VerifStatus = 'pending' | 'verified' | 'rejected';
type IdType = 'aadhar' | 'student_id' | 'driving_license';

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

interface VolunteerVerification {
  id: string;
  name: string;
  email: string;
  phone: string;
  idType: IdType;
  idNumber: string;
  location: string;
  appliedDate: string;
  pickupsCompleted: number;
  status: VerifStatus;
}

/* ─── Mock data ─────────────────────────────────────────────── */
const MOCK_USERS: AppUser[] = [];

const MOCK_NGO_REGISTRATIONS: NgoRegistration[] = [];

const MOCK_DELIVERIES: PlatformDelivery[] = [];

const MOCK_VERIFICATIONS: VolunteerVerification[] = [];

const MONTHS = ['Sep','Oct','Nov','Dec','Jan','Feb','Mar'];

const ROLE_BADGE: Record<UserRole,string>     = { donor:'badge-green', ngo:'badge-blue', volunteer:'badge-orange', admin:'badge-red' };
const STATUS_BADGE: Record<UserStatus,string> = { active:'badge-green', inactive:'badge-gray', suspended:'badge-red' };
const DELIVERY_STATUS_BADGE: Record<DeliveryStatus,string> = {
  assigned:'badge-gray', picked_up:'badge-orange', en_route:'badge-blue', delivered:'badge-green', cancelled:'badge-red',
};
const NGO_APPROVAL_BADGE: Record<NgoApprovalStatus,string> = {
  pending:'badge-orange', approved:'badge-green', rejected:'badge-red',
};

type Tab = 'overview' | 'donors' | 'volunteers' | 'ngos' | 'users' | 'deliveries' | 'analytics' | 'verifications';

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
  const [deliveries, setDeliveries] = useState<PlatformDelivery[]>(MOCK_DELIVERIES);
  const [volunteerVerifications, setVolunteerVerifications] = useState<VolunteerVerification[]>(MOCK_VERIFICATIONS);
  const [roleFilter, setRoleFilter] = useState<'all'|UserRole>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg]       = useState<string | null>(null);
  const [toastType, setToastType]     = useState<'success'|'error'>('success');
  const [loading, setLoading]         = useState(false);
  const [apiError, setApiError]       = useState<string|null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string,boolean>>({});
  const [apiStats, setApiStats]       = useState<any>(null);
  const [theme, setTheme]             = useState(localStorage.getItem('theme') || 'light');

  const displayName = user?.name || 'Admin';
  const initials    = user?.name ? user.name.split(' ').map((n:string)=>n[0]).join('').toUpperCase().slice(0,2) : 'AD';

  const showToast = (msg: string, type: 'success'|'error' = 'success') => {
    setToastMsg(msg); setToastType(type); setTimeout(() => setToastMsg(null), 3500);
  };
  const handleLogout = () => { localStorage.removeItem('token'); dispatch(logout()); navigate('/login'); };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  /* ── API fetch on mount ── */
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setLoading(true);
    Promise.all([
      adminGetStats(),
      adminGetUsers(),
      adminGetDonations(),
      adminGetVerifications(),
    ])
      .then(([statsRes, usersRes, donationsRes, verifsRes]) => {
        setApiStats(statsRes.data.stats);
        setUsers(usersRes.data.users.map((u: any): AppUser => ({
          id: u._id,
          name: u.name,
          email: u.email,
          role: u.role,
          joinDate: new Date(u.createdAt).toISOString().slice(0, 10),
          status: u.status || 'active',
          location: u.location || '—',
        })));
        setNgoRegistrations(
          usersRes.data.users
            .filter((u: any) => u.role === 'ngo')
            .map((u: any): NgoRegistration => ({
              id: u._id,
              orgName: u.name,
              contactName: u.name,
              email: u.email,
              phone: '—',
              location: u.location || '—',
              description: '—',
              appliedDate: new Date(u.createdAt).toISOString().slice(0, 10),
              approvalStatus: u.verificationStatus === 'approved' ? 'approved'
                : u.verificationStatus === 'rejected' ? 'rejected' : 'pending',
            }))
        );
        setDeliveries(donationsRes.data.donations.map((d: any): PlatformDelivery => ({
          id: d._id,
          item: d.foodType,
          donor: d.donorId?.name || '—',
          ngo: d.assignedNGO?.name || '—',
          volunteer: d.assignedVolunteer?.name || '—',
          quantity: d.quantity,
          date: new Date(d.updatedAt || d.createdAt).toISOString().slice(0, 10),
          status: d.status === 'picked_up' ? 'picked_up'
            : d.status === 'delivered' ? 'delivered'
            : d.status === 'expired' ? 'cancelled'
            : d.status === 'accepted' ? 'assigned'
            : 'assigned',
        })));
        setVolunteerVerifications(verifsRes.data.verifications.map((v: any): VolunteerVerification => ({
          id: v._id,
          name: v.userId?.name || 'Unknown',
          email: v.userId?.email || '',
          phone: '—',
          idType: 'aadhar',
          idNumber: v.idDocument?.slice(-8) || '—',
          location: v.userId?.location || '—',
          appliedDate: new Date(v.createdAt).toISOString().slice(0, 10),
          pickupsCompleted: 0,
          status: v.status === 'approved' ? 'verified' : v.status === 'rejected' ? 'rejected' : 'pending',
        })));
      })
      .catch((err: any) => setApiError(err.response?.data?.message || 'Failed to load dashboard data'))
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (id: string, status: UserStatus) => {
    const key = id + ':status';
    setActionLoading(prev => ({ ...prev, [key]: true }));
    try {
      await adminUpdateUserStatus(id, status === 'active' ? 'active' : 'suspended');
      setUsers(prev => prev.map(u => u.id === id ? { ...u, status } : u));
      showToast(`User status updated to ${status}`);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update status', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleNgoApproval = async (id: string, status: NgoApprovalStatus) => {
    const key = id + ':ngo';
    setActionLoading(prev => ({ ...prev, [key]: true }));
    try {
      await adminUpdateUserVerification(id, status === 'approved' ? 'approved' : 'rejected');
      setNgoRegistrations(prev => prev.map(r => r.id === id ? { ...r, approvalStatus: status } : r));
      showToast(status === 'approved' ? 'NGO registration approved!' : 'NGO registration rejected.');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update NGO status', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleVerifAction = async (id: string, status: VerifStatus) => {
    const key = id + ':verif';
    setActionLoading(prev => ({ ...prev, [key]: true }));
    try {
      await adminReviewVerification(id, status === 'verified' ? 'approved' : 'rejected');
      setVolunteerVerifications(prev => prev.map(v => v.id === id ? { ...v, status } : v));
      const v = volunteerVerifications.find(v => v.id === id);
      showToast(status === 'verified'
        ? `${v?.name} is now a verified volunteer!`
        : `${v?.name}'s verification rejected.`);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update verification', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  /* Computed */
  const donors     = users.filter(u => u.role==='donor');
  const volunteers = users.filter(u => u.role==='volunteer');
  const ngos       = users.filter(u => u.role==='ngo');
  const activeCount= users.filter(u => u.status==='active').length;

  const totalDonations      = apiStats?.totalDonations     ?? donors.reduce((a,u) => a + (u.donations||0), 0);
  const totalPickups        = volunteers.reduce((a,u) => a + (u.pickups||0), 0);
  const pendingNgos         = ngoRegistrations.filter(r => r.approvalStatus === 'pending').length;
  const pendingVerifs       = (apiStats?.pendingVerifications) ?? volunteerVerifications.filter(v => v.status === 'pending').length;
  const totalDeliveries     = apiStats?.totalDonations     ?? deliveries.length;
  const completedDeliveries = apiStats?.deliveredDonations ?? deliveries.filter(d => d.status === 'delivered').length;
  const activePickups       = deliveries.filter(d => ['assigned', 'en_route', 'picked_up'].includes(d.status)).length;
  const mealsSaved          = Math.floor(totalDonations * 2.5); // Example calculation


  const filteredUsers = users
    .filter(u => roleFilter==='all' || u.role===roleFilter)
    .filter(u => !searchQuery || u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()));

  /* ── Charts ── */
  const lineData = {
    labels: MONTHS,
    datasets:[
      { label:'Donations',  data:[42,65,78,91,110,136,158], borderColor:'var(--c-primary)', backgroundColor:'var(--chip-success)', tension:0.4, fill:true, pointRadius:4, pointBackgroundColor:'var(--c-primary)' },
      { label:'Meals Saved',data:[380,590,760,840,990,1240,1430], borderColor:'var(--c-secondary)', backgroundColor:'var(--chip-info)', tension:0.4, fill:true, pointRadius:4, pointBackgroundColor:'var(--c-secondary)', yAxisID:'y2' },
    ],
  };
  const lineOpts: any = {
    responsive:true, maintainAspectRatio:false,
    plugins:{ legend:{ position:'top' as const } },
    scales:{
      y:  { grid:{color:'rgba(0,0,0,0.04)'}, ticks:{color:'var(--c-muted)'}, title:{display:true,text:'Donations',color:'var(--c-primary)'} },
      y2: { position:'right', grid:{drawOnChartArea:false}, ticks:{color:'var(--c-muted)'}, title:{display:true,text:'Meals',color:'var(--c-secondary)'} },
      x:  { grid:{display:false}, ticks:{color:'var(--c-muted)'} },
    },
  };

  const barData = {
    labels:['Hotel Grandeur','Sunshine Hotel','Fresh Mart','City Bakery','Rajesh Sharma','Grand Catering'],
    datasets:[{
      label:'Donations Made',
      data:[51,38,14,8,23,19],
      backgroundColor:['var(--c-primary)','var(--c-secondary)','var(--c-accent)','var(--c-purple)','var(--c-danger)','var(--c-warning)'],
      borderRadius:6, borderSkipped:false,
    }],
  };
  const barOpts: any = {
    responsive:true, maintainAspectRatio:false, indexAxis:'y' as const,
    plugins:{ legend:{display:false} },
    scales:{ x:{grid:{color:'rgba(0,0,0,0.04)'},ticks:{color:'var(--c-muted)'}}, y:{grid:{display:false},ticks:{color:'var(--c-muted)'}} },
  };

  const roleDoughnut = {
    labels:['Donors','Volunteers','NGOs','Admins'],
    datasets:[{
      data:[donors.length, volunteers.length, ngos.length, 1],
      backgroundColor:['var(--c-primary)','var(--c-accent)','var(--c-secondary)','var(--c-purple)'],
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
      backgroundColor:'var(--c-purple)',
      borderRadius:6, borderSkipped:false,
    }],
  };
  const growthOpts: any = {
    responsive:true, maintainAspectRatio:false,
    plugins:{ legend:{display:false} },
    scales:{ x:{grid:{display:false},ticks:{color:'var(--c-muted)'}}, y:{grid:{color:'rgba(0,0,0,0.04)'},ticks:{color:'var(--c-muted)'}} },
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
                    <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,var(--c-primary),var(--c-secondary))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.72rem', fontWeight:700, color:'var(--on-primary)', flexShrink:0 }}>
                      {u.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)}
                    </div>
                    <span style={{ fontWeight:500 }}>{u.name}</span>
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
                      <button className="db-btn db-btn-success db-btn-sm" disabled={!!actionLoading[u.id+':status']} onClick={() => handleStatusChange(u.id,'active')}>
                        {actionLoading[u.id+':status'] ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check"></i>}
                      </button>
                    )}
                    {u.status !== 'suspended' && (
                      <button className="db-btn db-btn-danger db-btn-sm" disabled={!!actionLoading[u.id+':status']} onClick={() => handleStatusChange(u.id,'suspended')}>
                        {actionLoading[u.id+':status'] ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-ban"></i>}
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
              ['overview',       'fa-chart-line',   'Dashboard'],
              ['users',          'fa-users',        'All Users'],
              ['donors',         'fa-box-open',     'Donors'],
              ['volunteers',     'fa-motorcycle',   'Volunteers'],
              ['verifications',  'fa-id-card',      'Volunteer Verifications'],
              ['ngos',           'fa-building',     'NGOs'],
              ['deliveries',     'fa-truck-fast',   'Deliveries'],
              ['analytics',      'fa-chart-bar',    'Analytics'],
            ] as [Tab,string,string][]).map(([t,icon,label]) => (
              <button key={t} className={`db-nav-item${tab===t?' active':''}`}
                onClick={() => { setTab(t); setSidebarOpen(false); }}>
                <i className={`fas ${icon}`}></i> {label}
                {t==='ngos'          && pendingNgos>0   && <span className="notif-badge"></span>}
                {t==='verifications' && pendingVerifs>0 && <span className="notif-badge"></span>}
              </button>
            ))}
          </div>
          <div className="db-nav-section">
            <div className="db-nav-label">System</div>
            <Link to="/settings" className="db-nav-item"><i className="fas fa-gear"></i> Settings</Link>
            <Link to="/"         className="db-nav-item"><i className="fas fa-earth-asia"></i> View Site</Link>
            <button className="db-nav-item" style={{color:'var(--c-danger)'}} onClick={handleLogout}>
              <i className="fas fa-right-from-bracket"></i> Logout
            </button>
          </div>
        </nav>
        <div className="db-user-block">
          <div className="db-avatar" style={{ background:'linear-gradient(135deg,var(--c-purple),var(--c-secondary))' }}>{initials}</div>
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
              {tab==='overview'       && '📊 Admin Dashboard'}
              {tab==='users'          && '👥 All Users'}
              {tab==='donors'         && '🍽️ Donor Management'}
              {tab==='volunteers'     && '🚴 Volunteer Management'}
              {tab==='verifications'  && '🪪 Volunteer Verifications'}
              {tab==='ngos'           && '🏢 NGO Management'}
              {tab==='deliveries'     && '🚚 Delivery Monitoring'}
              {tab==='analytics'      && '📈 Platform Analytics'}
            </div>
          </div>
          <div className="db-topbar-right">
              <button className="db-btn db-btn-ghost db-btn-sm" onClick={toggleTheme} aria-label="Toggle theme">
                {theme === 'light' ? '☀️' : '🌙'}
              </button>
            <button className="db-btn db-btn-ghost db-btn-sm"><i className="fas fa-bell"></i></button>
            <span className="db-badge badge-green" style={{ fontSize:'0.8rem', padding:'5px 12px' }}>
              <i className="fas fa-circle" style={{ fontSize:'7px', marginRight:5 }}></i>{activeCount} Active
            </span>
          </div>
        </div>

        <div className="db-content">

          {/* Loading / error banners */}
          {loading && (
            <div style={{ textAlign:'center', padding:'40px 0', color:'var(--c-muted)' }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize:'1.6rem', marginBottom:10 }}></i>
              <p>Loading dashboard data…</p>
            </div>
          )}
          {apiError && (
            <div className="db-card" style={{ marginBottom:20, border:'1px solid var(--c-danger)', background:'var(--chip-danger)' }}>
              <div className="db-card-body" style={{ display:'flex', alignItems:'center', gap:10 }}>
                <i className="fas fa-circle-exclamation" style={{ color:'var(--c-danger)', fontSize:'1.1rem' }}></i>
                <span style={{ color:'var(--c-danger)', fontSize:'0.9rem', fontWeight: 600 }}>{apiError}</span>
                <button className="db-btn db-btn-sm" style={{ marginLeft:'auto', background:'var(--c-danger)', color:'var(--on-primary)' }} onClick={() => setApiError(null)}>Dismiss</button>
              </div>
            </div>
          )}

          {/* ════ OVERVIEW ════ */}
          {tab==='overview' && (
            <>
              <div className="db-page-header">
                <h2>Platform Overview 🚀</h2>
                <p>Real-time analytics across all FoodBridge users and donations.</p>
              </div>

              <div className="db-stats-row">
                {[
                  { ico:'fa-box-open',     bg:'var(--chip-success)', color:'var(--c-primary)',   num: totalDonations,       lbl:'Total Donations',   delta:'+12% this week' },
                  { ico:'fa-utensils',     bg:'var(--chip-info)',    color:'var(--c-secondary)', num: mealsSaved,          lbl:'Meals Saved',       delta:'+8% this week' },
                  { ico:'fa-truck-fast',   bg:'var(--chip-warning)', color:'var(--c-accent)',    num: activePickups,        lbl:'Active Pickups',    delta:'in progress' },
                  { ico:'fa-users',        bg:'var(--chip-info)',    color:'var(--c-purple)',   num: apiStats?.totalUsers ?? users.length, lbl:'Total Users', delta:activeCount + ' active' },
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

              {/* Pending Alerts */}
              {pendingVerifs > 0 && (
                <div className="db-card" style={{ marginBottom:24, border:'1px solid var(--c-border)', background:'var(--chip-info)' }}>
                  <div className="db-card-body" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{ width:42, height:42, borderRadius:'50%', background:'var(--chip-info)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <i className="fas fa-id-card" style={{ color:'var(--c-secondary)', fontSize:'1.1rem' }}></i>
                      </div>
                      <div>
                        <div style={{ fontWeight:700, fontSize:'0.95rem', color:'var(--c-text)' }}>{pendingVerifs} Pending Volunteer Verification{pendingVerifs>1?'s':''}</div>
                        <div style={{ fontSize:'0.82rem', color:'var(--c-muted)' }}>Review submitted ID documents and verify volunteers</div>
                      </div>
                    </div>
                    <button className="db-btn db-btn-secondary db-btn-sm" onClick={() => setTab('verifications')}>
                      Review Now <i className="fas fa-arrow-right"></i>
                    </button>
                  </div>
                </div>
              )}

              {/* Recent Activity Panel */}
              <div className="db-card" style={{ marginBottom: 32 }}>
                <div className="db-card-header">
                  <h3 className="db-card-title"><i className="fas fa-history"></i> Recent Activity</h3>
                  <button className="db-btn db-btn-ghost db-btn-sm" onClick={() => setTab('deliveries')}>View All</button>
                </div>
                <div className="db-card-body" style={{ padding: 0 }}>
                  <table className="db-table">
                     <thead>
                       <tr>
                         <th>Date</th>
                         <th>Activity</th>
                         <th>User</th>
                         <th>Status</th>
                       </tr>
                     </thead>
                     <tbody>
                       {deliveries.slice(0, 5).map((d, i) => (
                          <tr key={i}>
                            <td style={{ fontSize: '0.85rem', color: 'var(--c-muted)' }}>{d.date}</td>
                            <td style={{ fontWeight: 500 }}>Donation: {d.item}</td>
                            <td>{d.donor}</td>
                            <td><span className={`db-badge ${DELIVERY_STATUS_BADGE[d.status] || 'badge-gray'}`}>{d.status.replace('_', ' ')}</span></td>
                          </tr>
                       ))}
                       {deliveries.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 20 }}>No recent activity found.</td></tr>}
                     </tbody>
                  </table>
                </div>
              </div>

              {/* Pending NGO registrations alert */}
              {pendingNgos > 0 && (
                <div className="db-card" style={{ marginBottom:24, border:'1px solid var(--c-border)', background:'var(--chip-warning)' }}>
                  <div className="db-card-body" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{ width:42, height:42, borderRadius:'50%', background:'var(--chip-warning)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <i className="fas fa-clock" style={{ color:'var(--c-accent)', fontSize:'1.1rem' }}></i>
                      </div>
                      <div>
                        <div style={{ fontWeight:700, fontSize:'0.95rem', color:'var(--c-text)' }}>{pendingNgos} Pending NGO Registration{pendingNgos>1?'s':''}</div>
                        <div style={{ fontSize:'0.82rem', color:'var(--c-muted)' }}>Review and approve/reject NGO applications</div>
                      </div>
                    </div>
                    <button className="db-btn db-btn-sm" style={{ background:'var(--c-accent)', color:'#fff' }} onClick={() => setTab('ngos')}>
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
                  { ico:'fa-users',    bg:'var(--chip-success)',  color:'var(--c-primary)',   num:donors.length,                    lbl:'Total Donors',     delta:'' },
                  { ico:'fa-box-open', bg:'var(--chip-info)',     color:'var(--c-secondary)', num:totalDonations,                   lbl:'Total Donations',  delta:'Combined' },
                  { ico:'fa-circle-check',bg:'var(--chip-warning)',color:'var(--c-accent)',   num:donors.filter(d=>d.status==='active').length, lbl:'Active', delta:'Online now' },
                  { ico:'fa-star',     bg:'var(--chip-info)',  color:'var(--c-purple)',            num:donors.sort((a,b)=>(b.donations||0)-(a.donations||0))[0]?.name.split(' ')[0]||'—', lbl:'Top Donor', delta:'Most donations' },
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
                  { ico:'fa-users',        bg:'var(--chip-info)', color:'var(--c-secondary)', num:volunteers.length,                      lbl:'Total Volunteers', delta:'' },
                  { ico:'fa-motorcycle',   bg:'var(--chip-warning)',color:'var(--c-accent)',    num:totalPickups,                           lbl:'Total Pickups',    delta:'Combined' },
                  { ico:'fa-circle-check', bg:'var(--chip-success)',color:'var(--c-primary)',   num:volunteers.filter(v=>v.status==='active').length, lbl:'Active',  delta:'Available now' },
                  { ico:'fa-star',         bg:'var(--chip-info)',color:'var(--c-purple)',            num:volunteers.sort((a,b)=>(b.pickups||0)-(a.pickups||0))[0]?.name.split(' ')[0]||'—', lbl:'Top Volunteer', delta:'Most pickups' },
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
                <div className="db-card" style={{ marginBottom:24, border:'1.5px solid var(--c-border)' }}>
                  <div className="db-card-header">
                    <div className="db-card-title" style={{ color:'var(--c-accent)' }}>
                      <i className="fas fa-clock"></i> Pending NGO Registrations
                      <span className="db-badge badge-orange" style={{ marginLeft:10, fontSize:'0.75rem' }}>{pendingNgos}</span>
                    </div>
                  </div>
                  <div className="db-card-body" style={{ paddingTop:0 }}>
                    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                      {ngoRegistrations.filter(r => r.approvalStatus === 'pending').map(reg => (
                        <div key={reg.id} style={{ background:'var(--chip-warning)', border:'1px solid var(--c-border)', borderRadius:'var(--r-sm)', padding:'16px 20px', display:'flex', flexWrap:'wrap', gap:16, alignItems:'center' }}>
                          <div style={{ flex:1, minWidth:220 }}>
                            <div style={{ fontWeight:700, fontSize:'0.95rem', marginBottom:4 }}>{reg.orgName}</div>
                            <div style={{ fontSize:'0.82rem', color:'var(--c-muted)', display:'flex', flexWrap:'wrap', gap:12 }}>
                              <span><i className="fas fa-user" style={{ marginRight:4 }}></i>{reg.contactName}</span>
                              <span><i className="fas fa-envelope" style={{ marginRight:4 }}></i>{reg.email}</span>
                              <span><i className="fas fa-location-dot" style={{ marginRight:4 }}></i>{reg.location}</span>
                              <span><i className="fas fa-calendar" style={{ marginRight:4 }}></i>{reg.appliedDate}</span>
                            </div>
                            <div style={{ fontSize:'0.82rem', color:'var(--c-muted)', marginTop:8, fontStyle:'italic' }}>"{reg.description}"</div>
                          </div>
                          <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                            <button className="db-btn db-btn-success db-btn-sm" disabled={!!actionLoading[reg.id+':ngo']} onClick={() => handleNgoApproval(reg.id,'approved')}>
                              {actionLoading[reg.id+':ngo'] ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-check"></i> Approve</>}
                            </button>
                            <button className="db-btn db-btn-danger db-btn-sm" disabled={!!actionLoading[reg.id+':ngo']} onClick={() => handleNgoApproval(reg.id,'rejected')}>
                              {actionLoading[reg.id+':ngo'] ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-times"></i> Reject</>}
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
                  { ico:'fa-truck-fast',   bg:'var(--chip-success)',  color:'var(--c-primary)',   num:totalDeliveries,                                               lbl:'Total Deliveries',  delta:'All time' },
                  { ico:'fa-circle-check', bg:'var(--chip-info)',   color:'var(--c-secondary)', num:completedDeliveries,                                           lbl:'Completed',         delta:'Successfully delivered' },
                  { ico:'fa-spinner',      bg:'var(--chip-warning)',  color:'var(--c-accent)',    num:deliveries.filter(d=>d.status==='en_route'||d.status==='picked_up').length, lbl:'In Progress', delta:'Currently moving' },
                  { ico:'fa-circle-xmark', bg:'var(--chip-danger)',   color:'var(--c-danger)',            num:deliveries.filter(d=>d.status==='cancelled').length,           lbl:'Cancelled',         delta:'This period' },
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
                  { ico:'fa-users',      bg:'var(--chip-success)', color:'var(--c-primary)',   num:users.length,    lbl:'Total Users',     delta:'+10 this month' },
                  { ico:'fa-box-open',   bg:'var(--chip-info)',  color:'var(--c-secondary)', num:totalDonations,  lbl:'All Donations',   delta:'Cumulative' },
                  { ico:'fa-truck-fast', bg:'var(--chip-warning)', color:'var(--c-accent)',    num:totalDeliveries, lbl:'All Deliveries',  delta:completedDeliveries + ' completed' },
                  { ico:'fa-seedling',   bg:'var(--chip-info)', color:'var(--c-purple)',            num:'532 kg',        lbl:'Food Rescued',    delta:'Prevented waste' },
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

          {/* ════ VOLUNTEER VERIFICATIONS ════ */}
          {tab==='verifications' && (
            <>
              <div className="db-page-header">
                <h2>Volunteer Verifications 🪪</h2>
                <p>{pendingVerifs} pending · {volunteerVerifications.length} total submissions</p>
              </div>

              {/* Stats row */}
              <div className="db-stats-row" style={{ marginBottom:24 }}>
                {[
                  { ico:'fa-hourglass-half', bg:'var(--chip-warning)', color:'var(--c-accent)',    num:pendingVerifs,    lbl:'Pending Review' },
                  { ico:'fa-circle-check',   bg:'var(--chip-success)', color:'var(--c-primary)',   num:volunteerVerifications.filter(v=>v.status==='verified').length,  lbl:'Verified' },
                  { ico:'fa-circle-xmark',   bg:'var(--chip-danger)',  color:'var(--c-danger)',           num:volunteerVerifications.filter(v=>v.status==='rejected').length,  lbl:'Rejected' },
                ].map((s,i) => (
                  <div className="db-stat-chip" key={i}>
                    <div className="db-stat-ico" style={{ background:s.bg }}>
                      <i className={`fas ${s.ico}`} style={{ color:s.color }}></i>
                    </div>
                    <div>
                      <div className="db-stat-num">{s.num}</div>
                      <div className="db-stat-lbl">{s.lbl}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pending verifications */}
              {volunteerVerifications.filter(v => v.status==='pending').length > 0 && (
                <div className="db-card" style={{ marginBottom:24 }}>
                  <div className="db-card-header">
                    <div className="db-card-title"><i className="fas fa-hourglass-half"></i> Awaiting Review</div>
                  </div>
                  <div className="db-card-body" style={{ display:'flex', flexDirection:'column', gap:16 }}>
                    {volunteerVerifications.filter(v => v.status==='pending').map(v => (
                      <div key={v.id} style={{ border:'1px solid var(--c-border)', borderRadius:12, padding:20, background:'var(--c-surface)', display:'grid', gridTemplateColumns:'1fr auto', gap:16, alignItems:'start' }}>
                        <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
                          {/* ID preview */}
                          <div style={{ width:110, height:80, borderRadius:8, background:'var(--chip-info)', border:'1.5px dashed var(--c-secondary)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
                            <i className="fas fa-id-card" style={{ fontSize:'2rem', color:'var(--c-secondary)' }}></i>
                          </div>
                          <div style={{ flex:1, minWidth:200 }}>
                            <div style={{ fontWeight:700, fontSize:'1.05rem', marginBottom:4 }}>{v.name}</div>
                            <div style={{ fontSize:'0.83rem', color:'var(--c-muted)', marginBottom:6 }}>{v.email} · {v.phone}</div>
                            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                              <span className="db-badge badge-orange" style={{ fontSize:'0.75rem' }}>
                                <i className="fas fa-id-card" style={{ marginRight:4 }}></i>{v.idType.charAt(0).toUpperCase()+v.idType.slice(1)} ID
                              </span>
                              <span className="db-badge badge-gray" style={{ fontSize:'0.75rem' }}>
                                <i className="fas fa-location-dot" style={{ marginRight:4 }}></i>{v.location}
                              </span>
                              <span className="db-badge badge-blue" style={{ fontSize:'0.75rem' }}>
                                <i className="fas fa-truck-fast" style={{ marginRight:4 }}></i>{v.pickupsCompleted} pickups done
                              </span>
                            </div>
                            <div style={{ fontSize:'0.78rem', color:'var(--c-muted)', marginTop:6 }}>Applied: {v.appliedDate}</div>
                          </div>
                        </div>
                        <div style={{ display:'flex', flexDirection:'column', gap:8, minWidth:130 }}>
                          <button
                            className="db-btn db-btn-sm"
                            style={{ background:'var(--c-primary)', color:'var(--on-primary)', width:'100%' }}
                            disabled={!!actionLoading[v.id+':verif']}
                            onClick={() => handleVerifAction(v.id, 'verified')}
                          >
                            {actionLoading[v.id+':verif'] ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-circle-check"></i> Approve</>}
                          </button>
                          <button
                            className="db-btn db-btn-sm"
                            style={{ background:'var(--c-danger)', color:'var(--on-primary)', width:'100%' }}
                            disabled={!!actionLoading[v.id+':verif']}
                            onClick={() => handleVerifAction(v.id, 'rejected')}
                          >
                            {actionLoading[v.id+':verif'] ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-circle-xmark"></i> Reject</>}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* History table */}
              <div className="db-card">
                <div className="db-card-header">
                  <div className="db-card-title"><i className="fas fa-clock-rotate-left"></i> Verification History</div>
                </div>
                <div className="db-card-body">
                  <table className="db-table">
                    <thead>
                      <tr>
                        <th>Volunteer</th>
                        <th>Contact</th>
                        <th>ID Type</th>
                        <th>Location</th>
                        <th>Applied</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {volunteerVerifications.filter(v => v.status !== 'pending').map(v => (
                        <tr key={v.id}>
                          <td style={{ fontWeight:600 }}>{v.name}</td>
                          <td style={{ fontSize:'0.82rem', color:'var(--c-muted)' }}>{v.email}</td>
                          <td>{v.idType.charAt(0).toUpperCase()+v.idType.slice(1)}</td>
                          <td>{v.location}</td>
                          <td style={{ fontSize:'0.82rem' }}>{v.appliedDate}</td>
                          <td>
                            {v.status==='verified'
                              ? <span className="db-badge badge-green"><i className="fas fa-circle-check" style={{ marginRight:4 }}></i>Verified</span>
                              : <span className="db-badge badge-red"><i className="fas fa-circle-xmark" style={{ marginRight:4 }}></i>Rejected</span>
                            }
                          </td>
                        </tr>
                      ))}
                      {volunteerVerifications.filter(v => v.status !== 'pending').length === 0 && (
                        <tr><td colSpan={6} style={{ textAlign:'center', color:'var(--c-muted)', padding:'24px 0' }}>No processed verifications yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
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

      {toastMsg && <div className={`db-toast${toastType === 'error' ? ' db-toast-error' : ''}`}><i className={`fas ${toastType === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'}`}></i> {toastMsg}</div>}
    </div>
  );
};

export default AdminDashboard;


