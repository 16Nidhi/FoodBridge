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
import DashboardLayout from '../../components/common/DashboardLayout';
import Profile from '../Profile';

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
  // Add full user object from API for details modal
  [key: string]: any;
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
  idNumber: string; // This will be the truncated one for the table
  idDocument: string; // This will be the full one for the modal
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

type Tab = 'overview' | 'donors' | 'volunteers' | 'ngos' | 'users' | 'deliveries' | 'analytics' | 'verifications' | 'profile';

/* ═══════════════════════════════════════════════════════════════
   ADMIN DASHBOARD PAGE
═══════════════════════════════════════════════════════════════ */
const AdminDashboard: React.FC = () => {
  const user     = useSelector((state: any) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [tab, setTab]             = useState<Tab>('overview');
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
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedVerification, setSelectedVerification] = useState<VolunteerVerification | null>(null);
  const [isVerifModalOpen, setIsVerifModalOpen] = useState(false);

  const displayName = user?.name || 'Admin';

  const showToast = (msg: string, type: 'success'|'error' = 'success') => {
    setToastMsg(msg); setToastType(type); setTimeout(() => setToastMsg(null), 3500);
  };
  const handleLogout = () => { localStorage.removeItem('token'); dispatch(logout()); navigate('/login'); };

  

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
          ...u, // Store the full user object
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
          idType: v.idType || 'aadhar',
          idNumber: v.idDocument?.slice(-8) || '—',
          idDocument: v.idDocument || '—', // Store full document
          location: v.userId?.location || '—',
          appliedDate: new Date(v.createdAt).toISOString().slice(0, 10),
          pickupsCompleted: 0,
          status: v.status === 'approved' ? 'verified' : v.status === 'rejected' ? 'rejected' : 'pending',
        })));
      })
      .catch((err: any) => setApiError(err.response?.data?.message || 'Failed to load dashboard data'))
      .finally(() => setLoading(false));
  }, []);

  const openUserDetailsModal = (user: AppUser) => {
    setSelectedUser(user);
    setIsUserModalOpen(true);
  };

  const openVerifDetailsModal = (verification: VolunteerVerification) => {
    setSelectedVerification(verification);
    setIsVerifModalOpen(true);
  };

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
      borderWidth:2, borderColor:'var(--card-bg)',
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

  const sidebarItems = [
    { tab: 'overview', icon: 'fa-chart-line', label: 'Dashboard', notifCount: 0 },
    { tab: 'users', icon: 'fa-users', label: 'All Users', notifCount: 0 },
    { tab: 'donors', icon: 'fa-box-open', label: 'Donors', notifCount: 0 },
    { tab: 'volunteers', icon: 'fa-motorcycle', label: 'Volunteers', notifCount: 0 },
    { tab: 'verifications', icon: 'fa-id-card', label: 'Volunteer Verifications', notifCount: pendingVerifs },
    { tab: 'ngos', icon: 'fa-building', label: 'NGOs', notifCount: pendingNgos },
    { tab: 'deliveries', icon: 'fa-truck-fast', label: 'Deliveries', notifCount: 0 },
    { tab: 'analytics', icon: 'fa-chart-bar', label: 'Analytics', notifCount: 0 },
    { tab: 'profile', icon: 'fa-user-cog', label: 'My Profile', notifCount: 0 },
  ];

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
                    <button className="db-btn db-btn-secondary db-btn-sm" onClick={() => openUserDetailsModal(u)}>
                      <i className="fas fa-eye"></i>
                    </button>
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
    <DashboardLayout
      sidebarItems={sidebarItems}
      activeTab={tab}
      setActiveTab={(t) => setTab(t as Tab)}
      user={user}
      handleLogout={handleLogout}
    >
      {loading && <div className="loading-spinner"><div></div></div>}
      {apiError && <div className="error-msg">{apiError}</div>}
      {toastMsg && <div className={`toast ${toastType}`}>{toastMsg}</div>}

      {/* ══════════ USER DETAILS MODAL ══════════ */}
      {isUserModalOpen && selectedUser && (
        <div className="modal-overlay" onClick={() => setIsUserModalOpen(false)}>
          <div className="modal-content">
            <h2>User Details</h2>
            <div className="user-details-grid">
              <p><strong>ID:</strong> {selectedUser.id}</p>
              <p><strong>Name:</strong> {selectedUser.name}</p>
              <p><strong>Email:</strong> {selectedUser.email}</p>
              <p><strong>Role:</strong> <span className={`db-badge ${ROLE_BADGE[selectedUser.role]}`}>{selectedUser.role}</span></p>
              <p><strong>Status:</strong> <span className={`db-badge ${STATUS_BADGE[selectedUser.status]}`}>{selectedUser.status}</span></p>
              <p><strong>Joined:</strong> {selectedUser.joinDate}</p>
              <p><strong>Location:</strong> {selectedUser.location}</p>
              {selectedUser.role === 'ngo' && (
                <p><strong>Verified:</strong> {selectedUser.verificationStatus || 'pending'}</p>
              )}
            </div>
            <div className="modal-actions">
              <button type="button" className="db-btn" onClick={() => setIsUserModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ VERIFICATION DETAILS MODAL ══════════ */}
      {isVerifModalOpen && selectedVerification && (
        <div className="modal-overlay" onClick={() => setIsVerifModalOpen(false)}>
          <div className="modal-content">
            <h2>Verification Details</h2>
            <div className="user-details-grid">
              <p><strong>Applicant:</strong> {selectedVerification.name}</p>
              <p><strong>Email:</strong> {selectedVerification.email}</p>
              <p><strong>Location:</strong> {selectedVerification.location}</p>
              <p><strong>Applied On:</strong> {selectedVerification.appliedDate}</p>
              <p><strong>ID Type:</strong> {selectedVerification.idType}</p>
              <p><strong>ID Document:</strong> {selectedVerification.idDocument}</p>
              <p><strong>Status:</strong> <span className={`db-badge ${selectedVerification.status === 'verified' ? 'badge-green' : selectedVerification.status === 'rejected' ? 'badge-red' : 'badge-orange'}`}>{selectedVerification.status}</span></p>
            </div>
            <div className="modal-actions">
              <button type="button" className="db-btn" onClick={() => setIsVerifModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ OVERVIEW TAB ══════════ */}
      {tab === 'overview' && (
        <>
          <h1 className="db-title">Admin Dashboard</h1>
          <div className="db-grid">
            <div className="db-stat-card">
              <div className="stat-icon" style={{background:'var(--chip-success)'}}><i className="fas fa-users"></i></div>
              <div>
                <div className="stat-value">{users.length}</div>
                <div className="stat-label">Total Users</div>
              </div>
            </div>
            <div className="db-stat-card">
              <div className="stat-icon" style={{background:'var(--chip-info)'}}><i className="fas fa-truck"></i></div>
              <div>
                <div className="stat-value">{totalDeliveries}</div>
                <div className="stat-label">Total Deliveries</div>
              </div>
            </div>
            <div className="db-stat-card">
              <div className="stat-icon" style={{background:'var(--chip-warning)'}}><i className="fas fa-hourglass-half"></i></div>
              <div>
                <div className="stat-value">{pendingNgos}</div>
                <div className="stat-label">Pending NGOs</div>
              </div>
            </div>
            <div className="db-stat-card">
              <div className="stat-icon" style={{background:'var(--chip-danger)'}}><i className="fas fa-id-badge"></i></div>
              <div>
                <div className="stat-value">{pendingVerifs}</div>
                <div className="stat-label">Pending Verifications</div>
              </div>
            </div>
          </div>

          <div className="db-grid">
            <div className="db-card" style={{ gridColumn: 'span 2' }}>
              <div className="db-card-header">
                <h3 className="db-card-title">Donation Trends</h3>
              </div>
              <div className="db-card-body" style={{ height: 300 }}>
                <Line data={lineData} options={lineOpts} />
              </div>
            </div>
            <div className="db-card">
              <div className="db-card-header">
                <h3 className="db-card-title">User Roles</h3>
              </div>
              <div className="db-card-body" style={{ height: 300 }}>
                <Doughnut data={roleDoughnut} options={doughnutOpts} />
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══════════ USERS TAB ══════════ */}
      {tab === 'users' && (
        <>
          <h1 className="db-title">Manage Users</h1>
          <div className="db-card">
            <div className="db-card-header">
              <h3 className="db-card-title">All Platform Users</h3>
              <div className="db-header-actions">
                <input type="text" placeholder="Search by name or email..." className="db-search-input" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                <select className="db-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value as any)}>
                  <option value="all">All Roles</option>
                  <option value="donor">Donors</option>
                  <option value="ngo">NGOs</option>
                  <option value="volunteer">Volunteers</option>
                  <option value="admin">Admins</option>
                </select>
              </div>
            </div>
            <UserTable data={filteredUsers} />
          </div>
        </>
      )}

      {/* ══════════ DONORS TAB ══════════ */}
      {tab === 'donors' && <UserTable data={donors} />}
      {tab === 'volunteers' && <UserTable data={volunteers} />}
      {tab === 'ngos' && (
        <>
          <h1 className="db-title">NGO Registrations</h1>
          <div className="db-card">
            <div className="db-card-body" style={{ padding: 0 }}>
              <table className="db-table">
                <thead>
                  <tr><th>Organization</th><th>Contact</th><th>Applied On</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {ngoRegistrations.map(r => (
                    <tr key={r.id}>
                      <td>{r.orgName}</td>
                      <td>{r.email}</td>
                      <td>{r.appliedDate}</td>
                      <td><span className={`db-badge ${NGO_APPROVAL_BADGE[r.approvalStatus]}`}>{r.approvalStatus}</span></td>
                      <td>
                        {r.approvalStatus === 'pending' && (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="db-btn db-btn-success db-btn-sm" disabled={!!actionLoading[r.id+':ngo']} onClick={() => handleNgoApproval(r.id, 'approved')}>
                              {actionLoading[r.id+':ngo'] ? <i className="fas fa-spinner fa-spin"></i> : 'Approve'}
                            </button>
                            <button className="db-btn db-btn-danger db-btn-sm" disabled={!!actionLoading[r.id+':ngo']} onClick={() => handleNgoApproval(r.id, 'rejected')}>
                              {actionLoading[r.id+':ngo'] ? <i className="fas fa-spinner fa-spin"></i> : 'Reject'}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ══════════ VERIFICATIONS TAB ══════════ */}
      {tab === 'verifications' && (
        <>
          <h1 className="db-title">Volunteer Verifications</h1>
          <div className="db-card">
            <div className="db-card-body" style={{ padding: 0 }}>
              <table className="db-table">
                <thead>
                  <tr><th>Name</th><th>ID Type</th><th>ID Number</th><th>Applied On</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {volunteerVerifications.map(v => (
                    <tr key={v.id}>
                      <td>{v.name}</td>
                      <td>{v.idType}</td>
                      <td>...{v.idNumber}</td>
                      <td>{v.appliedDate}</td>
                      <td><span className={`db-badge ${v.status === 'verified' ? 'badge-green' : v.status === 'rejected' ? 'badge-red' : 'badge-orange'}`}>{v.status}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="db-btn db-btn-secondary db-btn-sm" onClick={() => openVerifDetailsModal(v)}>
                            <i className="fas fa-eye"></i>
                          </button>
                          {v.status === 'pending' && (
                            <>
                              <button className="db-btn db-btn-success db-btn-sm" disabled={!!actionLoading[v.id+':verif']} onClick={() => handleVerifAction(v.id, 'verified')}>
                                {actionLoading[v.id+':verif'] ? <i className="fas fa-spinner fa-spin"></i> : 'Approve'}
                              </button>
                              <button className="db-btn db-btn-danger db-btn-sm" disabled={!!actionLoading[v.id+':verif']} onClick={() => handleVerifAction(v.id, 'rejected')}>
                                {actionLoading[v.id+':verif'] ? <i className="fas fa-spinner fa-spin"></i> : 'Reject'}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ══════════ DELIVERIES TAB ══════════ */}
      {tab === 'deliveries' && (
        <>
          <h1 className="db-title">Platform Deliveries</h1>
          <div className="db-card">
            <div className="db-card-body" style={{ padding: 0 }}>
              <table className="db-table">
                <thead>
                  <tr><th>Item</th><th>Donor</th><th>Volunteer</th><th>NGO</th><th>Date</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {deliveries.map(d => (
                    <tr key={d.id}>
                      <td>{d.item}</td>
                      <td>{d.donor}</td>
                      <td>{d.volunteer}</td>
                      <td>{d.ngo}</td>
                      <td>{d.date}</td>
                      <td><span className={`db-badge ${DELIVERY_STATUS_BADGE[d.status]}`}>{d.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ══════════ ANALYTICS TAB ══════════ */}
      {tab === 'analytics' && (
        <>
          <h1 className="db-title">Analytics</h1>
          <div className="db-grid">
            <div className="db-card" style={{ gridColumn: 'span 2' }}>
              <div className="db-card-header"><h3 className="db-card-title">Top Donors</h3></div>
              <div className="db-card-body" style={{ height: 350 }}><Bar data={barData} options={barOpts} /></div>
            </div>
            <div className="db-card">
              <div className="db-card-header"><h3 className="db-card-title">New User Growth</h3></div>
              <div className="db-card-body" style={{ height: 350 }}><Bar data={userGrowthData} options={growthOpts} /></div>
            </div>
          </div>
        </>
      )}

      {tab === 'profile' && (
        <Profile />
      )}

      {isUserModalOpen && selectedUser && (
        <div className="modal-overlay" onClick={() => setIsUserModalOpen(false)}>
          <div className="modal-content">
            <h2>User Details</h2>
            <div className="user-details-grid">
              <p><strong>ID:</strong> {selectedUser.id}</p>
              <p><strong>Name:</strong> {selectedUser.name}</p>
              <p><strong>Email:</strong> {selectedUser.email}</p>
              <p><strong>Role:</strong> <span className={`db-badge ${ROLE_BADGE[selectedUser.role]}`}>{selectedUser.role}</span></p>
              <p><strong>Status:</strong> <span className={`db-badge ${STATUS_BADGE[selectedUser.status]}`}>{selectedUser.status}</span></p>
              <p><strong>Joined:</strong> {selectedUser.joinDate}</p>
              <p><strong>Location:</strong> {selectedUser.location}</p>
              {selectedUser.role === 'ngo' && (
                <p><strong>Verified:</strong> {selectedUser.verificationStatus || 'pending'}</p>
              )}
            </div>
            <div className="modal-actions">
              <button type="button" className="db-btn" onClick={() => setIsUserModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ VERIFICATION DETAILS MODAL ══════════ */}
      {isVerifModalOpen && selectedVerification && (
        <div className="modal-overlay" onClick={() => setIsVerifModalOpen(false)}>
          <div className="modal-content">
            <h2>Verification Details</h2>
            <div className="user-details-grid">
              <p><strong>Applicant:</strong> {selectedVerification.name}</p>
              <p><strong>Email:</strong> {selectedVerification.email}</p>
              <p><strong>Location:</strong> {selectedVerification.location}</p>
              <p><strong>Applied On:</strong> {selectedVerification.appliedDate}</p>
              <p><strong>ID Type:</strong> {selectedVerification.idType}</p>
              <p><strong>ID Document:</strong> {selectedVerification.idDocument}</p>
              <p><strong>Status:</strong> <span className={`db-badge ${selectedVerification.status === 'verified' ? 'badge-green' : selectedVerification.status === 'rejected' ? 'badge-red' : 'badge-orange'}`}>{selectedVerification.status}</span></p>
            </div>
            <div className="modal-actions">
              <button type="button" className="db-btn" onClick={() => setIsVerifModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminDashboard;


