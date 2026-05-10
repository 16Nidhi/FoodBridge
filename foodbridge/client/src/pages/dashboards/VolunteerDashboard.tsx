import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, Title, Tooltip, Legend,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { logout } from '../../store/slices/authSlice';
import { getAllDonations, claimDonation as volunteerAcceptPickup, completeDonation as apiMarkPickedUp, getMyDonations } from '../../services/api';
import '../../components/common/Dashboard.css';
import DashboardLayout from '../../components/common/DashboardLayout';
import Profile from '../Profile';

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
  assignedVolunteer?: string;
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
    pending: 'available',
    claimed: 'accepted',
    'picked-up': 'in-transit',
    completed: 'completed',
    expired: 'completed',
  };
  return {
    id: d._id,
    foodTitle: d.foodItem + (d.quantity ? ` (${d.quantity})` : ''),
    donor: d.donorId?.name || 'Donor',
    address: d.pickupLocation,
    distance: '—',
    weight: d.quantity || '—',
    expiryIn: '',
    expiryTimestamp: d.pickupTime ? new Date(d.pickupTime).getTime() : Date.now() + 4 * 3600000,
    ngoWindowEnd: d.createdAt ? new Date(d.createdAt).getTime() + 2 * 3600000 : Date.now() - 1,
    ngo: d.claimedBy?.name || '—',
    ngoAddress: d.claimedBy?.location || '—',
    status: statusMap[d.status] || 'available',
    assignedVolunteer: d.assignedVolunteer?.name,
    category: d.category || 'Other',
  };
};

/* ─── Mock data (used only in demo mode without token) ──────── */
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

type Tab = 'pickups' | 'active' | 'history' | 'stats' | 'profile';

/* ═══════════════════════════════════════════════════════════════
   VOLUNTEER DASHBOARD PAGE
═══════════════════════════════════════════════════════════════ */
const VolunteerDashboard: React.FC = () => {
  const user     = useSelector((state: any) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [tab, setTab]           = useState<Tab>('pickups');
  const [now, setNow]           = useState(Date.now());
  const [pickups, setPickups]   = useState<PickupRequest[]>(INIT_PICKUPS);
  const [myPickups, setMyPickups] = useState<PickupRequest[]>([]);
  const [loading, setLoading]   = useState(false);
  const [apiError, setApiError] = useState<string|null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string,boolean>>({});
  const [toastMsg, setToastMsg] = useState<string|null>(null);
  const [toastType, setToastType] = useState<'success'|'error'>('success');

  const handleLogout = () => { localStorage.removeItem('token'); dispatch(logout()); navigate('/login'); };
  const showToast = (msg: string, type: 'success'|'error' = 'success') => {
    setToastMsg(msg); setToastType(type); setTimeout(() => setToastMsg(null), 3500);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [allDonationsRes, myDonationsRes] = await Promise.all([
        getAllDonations(),
        getMyDonations()
      ]);
      // filter claimed items client-side and map
      setPickups(allDonationsRes.filter((d: any) => d.status === 'claimed').map(mapApiDonationToPickup));
      setMyPickups(myDonationsRes.map(mapApiDonationToPickup));
    } catch (err: any) {
      setApiError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleAccept = async (id: string) => {
    setActionLoading(prev => ({ ...prev, [id]: true }));
    try {
      await volunteerAcceptPickup(id);
      showToast('Pickup accepted! See it in your Active Pickups.');
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to accept pickup', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleMarkPickedUp = async (id: string) => {
    setActionLoading(prev => ({ ...prev, [id]: true }));
    try {
      await apiMarkPickedUp(id);
      showToast('Marked as picked up. Happy delivering!');
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update status', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const availablePickups = useMemo(() => pickups.filter(p => p.status === 'accepted' && !p.assignedVolunteer), [pickups]);
  const activePickups = useMemo(() => myPickups.filter(p => p.status === 'in-transit'), [myPickups]);
  const pickupHistory = useMemo(() => myPickups.filter(p => p.status === 'completed'), [myPickups]);

  const sidebarItems = [
    { tab: 'available', icon: 'fa-hand-sparkles', label: 'Available Pickups' },
    { tab: 'active', icon: 'fa-truck-pickup', label: 'Active Pickups' },
    { tab: 'history', icon: 'fa-history', label: 'Pickup History' },
    { tab: 'stats', icon: 'fa-chart-line', label: 'My Stats' },
    { tab: 'profile', icon: 'fa-user-shield', label: 'My Profile' },
  ];

  const lineData = {
    labels: WEEKS,
    datasets: [{
      label: 'Pickups Completed',
      data: [3, 5, 4, 7, 6, 8, 5],
      borderColor: 'var(--c-primary)',
      tension: 0.4,
    }],
  };

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

      {tab === 'pickups' && (
        <>
          <h1 className="db-title">Available Pickups</h1>
          <div className="db-card-grid">
            {availablePickups.map(p => {
              const expiry = calcExpiry(p.expiryTimestamp, now);
              return (
                <div key={p.id} className="db-card pickup-card">
                  <div className="db-card-header">
                    <h4>{p.foodTitle}</h4>
                    <span className="pickup-expiry" style={{ color: expiry.color, backgroundColor: expiry.bg }}>
                      <i className="fas fa-clock"></i> {expiry.label}
                    </span>
                  </div>
                  <div className="db-card-body">
                    <p><strong>From:</strong> {p.donor} ({p.address})</p>
                    <p><strong>To:</strong> {p.ngo} ({p.ngoAddress})</p>
                  </div>
                  <div className="db-card-footer">
                    <button
                      className="db-btn db-btn-primary"
                      onClick={() => handleAccept(p.id)}
                      disabled={actionLoading[p.id]}
                    >
                      {actionLoading[p.id] ? <i className="fas fa-spinner fa-spin"></i> : 'Accept Pickup'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === 'active' && (
        <>
          <h1 className="db-title">My Active Pickups</h1>
          <div className="db-card">
            <div className="db-card-body" style={{ padding: 0 }}>
              <table className="db-table">
                <thead>
                  <tr><th>Item</th><th>From (Donor)</th><th>To (NGO)</th><th>Status</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {activePickups.map(p => (
                    <tr key={p.id}>
                      <td>{p.foodTitle}</td>
                      <td>{p.donor} <br/><small>{p.address}</small></td>
                      <td>{p.ngo} <br/><small>{p.ngoAddress}</small></td>
                      <td><span className={`db-badge ${STATUS_COLORS[p.status]}`}>{p.status}</span></td>
                      <td>
                        <button
                          className="db-btn db-btn-success"
                          onClick={() => handleMarkPickedUp(p.id)}
                          disabled={actionLoading[p.id]}
                        >
                          {actionLoading[p.id] ? <i className="fas fa-spinner fa-spin"></i> : 'Mark as Picked Up'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'history' && (
        <>
          <h1 className="db-title">My Pickup History</h1>
          <div className="db-card">
            <div className="db-card-body" style={{ padding: 0 }}>
              <table className="db-table">
                <thead>
                  <tr><th>Date</th><th>Item</th><th>From</th><th>To</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {pickupHistory.map(p => (
                    <tr key={p.id}>
                      <td>{new Date(p.expiryTimestamp).toLocaleDateString()}</td>
                      <td>{p.foodTitle}</td>
                      <td>{p.donor}</td>
                      <td>{p.ngo}</td>
                      <td><span className={`db-badge ${STATUS_COLORS[p.status]}`}>{p.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'stats' && (
        <>
          <h1 className="db-title">My Stats</h1>
          <div className="db-grid">
            <div className="db-stat-card">
              <div className="stat-icon"><i className="fas fa-truck"></i></div>
              <div>
                <div className="stat-value">{pickupHistory.length}</div>
                <div className="stat-label">Total Pickups</div>
              </div>
            </div>
            <div className="db-stat-card">
              <div className="stat-icon"><i className="fas fa-star"></i></div>
              <div>
                <div className="stat-value">4.8</div>
                <div className="stat-label">Average Rating</div>
              </div>
            </div>
            <div className="db-stat-card">
              <div className="stat-icon"><i className="fas fa-trophy"></i></div>
              <div>
                <div className="stat-value">Gold</div>
                <div className="stat-label">Volunteer Tier</div>
              </div>
            </div>
          </div>
          <div className="db-card">
            <div className="db-card-header">
              <h3 className="db-card-title">Weekly Pickup Activity</h3>
            </div>
            <div className="db-card-body" style={{ height: '300px' }}>
              <Line data={lineData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
        </>
      )}

      {tab === 'profile' && (
        <Profile />
      )}
    </DashboardLayout>
  );
};

export default VolunteerDashboard;



