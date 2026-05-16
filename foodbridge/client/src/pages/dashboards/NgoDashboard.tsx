// Recharts temporarily disabled to avoid runtime hook/context issues
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';


import { logout } from '../../store/slices/authSlice';
import {
  getAllDonations,
  claimDonation as apiAcceptDonation,
  completeDonation as apiMarkDelivered,
  addRating as apiAddRating,
  getMyDonations,
} from '../../services/api';
import '../../components/common/Dashboard.css';
import DashboardLayout from '../../components/common/DashboardLayout';
import Profile from '../Profile';



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
  expiryTimestamp: number;   // epoch ms for countdown
  ngoWindowEnd: number;      // epoch ms when NGO-priority window ends
  category: string;
  status: DonationStatus;
  reservedBy?: string;
  assignedVolunteer?: string;
}

interface IncomingDelivery {
  id: string;
  item: string;
  donor: string;
  quantity: string;
  category: string;
  volunteer: string;
  volunteerId?: string;
  volunteerPhone: string;
  eta: string;
  pickedUpAt: string;
  status: DeliveryStatus;
}

/* ─── Map backend donation → Donation / IncomingDelivery ─────── */
const mapApiDonation = (d: any): Donation => {
  const statusMap: Record<string, DonationStatus> = {
    pending: 'available',
    claimed: 'reserved',
    completed: 'distributed',
    expired: 'distributed',
  };
  return {
    id: d._id,
    title: d.foodItem,
    donor: d.donorId?.name || 'Donor',
    quantity: d.quantity || '—',
    address: d.pickupLocation,
    expiryDate: d.pickupTime ? d.pickupTime.slice(0, 10) : '',
    expiryTimestamp: d.pickupTime ? new Date(d.pickupTime).getTime() : Date.now() + 2 * 3600000,
    ngoWindowEnd: d.createdAt ? new Date(d.createdAt).getTime() + 2 * 3600000 : Date.now() - 1,
    category: d.category || 'Other',
    status: statusMap[d.status] || 'available',
    reservedBy: d.claimedBy?.name,
    assignedVolunteer: d.assignedVolunteer?.name,
  };
};

const mapApiToDelivery = (d: any): IncomingDelivery => ({
    id: d._id,
    item: d.foodItem,
    donor: d.donorId?.name || '—',
    quantity: d.quantity,
    category: 'Food',
    volunteer: d.claimedBy?.name || 'Unassigned',
    volunteerId: d.claimedBy?._id,
    volunteerPhone: 'N/A',
    eta: new Date(d.pickupTime).toLocaleTimeString(),
    pickedUpAt: d.updatedAt,
    status: d.status === 'completed' ? 'confirmed' : 'en_route',
});

/* ─── Mock data ─────────────────────────────────────────────── */
const INIT_DONATIONS: Donation[] = [];
const INIT_DELIVERIES: IncomingDelivery[] = [];
const DISTRIBUTION_LOG = [
  { date:'2026-03-06', item:'Dal & Rice',      quantity:'30 servings', beneficiaries:45, volunteer:'Ananya Sharma' },
  { date:'2026-03-05', item:'Dairy Products',  quantity:'20 L',        beneficiaries:20, volunteer:'Raj Kumar' },
  { date:'2026-03-04', item:'Cooked Biryani',  quantity:'18 kg',       beneficiaries:60, volunteer:'Priya Singh' },
];

type Tab = 'overview' | 'donations' | 'deliveries' | 'distribution' | 'profile';

/* ═══════════════════════════════════════════════════════════════
   NGO DASHBOARD PAGE
═══════════════════════════════════════════════════════════════ */
const NgoDashboard: React.FC = () => {
  const user = useSelector((state: any) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>('overview');
  const [now, setNow] = useState(Date.now());
  const [donations, setDonations] = useState<Donation[]>(INIT_DONATIONS);
  const [deliveries, setDeliveries] = useState<IncomingDelivery[]>(INIT_DELIVERIES);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [ratingModal, setRatingModal] = useState<{ open: boolean; deliveryId: string; volunteerId: string }>({ open: false, deliveryId: '', volunteerId: '' });
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const handleLogout = () => { localStorage.removeItem('token'); dispatch(logout()); navigate('/login'); };
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMsg(msg); setToastType(type); setTimeout(() => setToastMsg(null), 3500);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [allDonationsRes, myDonationsRes] = await Promise.all([getAllDonations(), getMyDonations()]);
      setDonations(allDonationsRes.map(mapApiDonation));
      setDeliveries(myDonationsRes.map(mapApiToDelivery));
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
      await apiAcceptDonation(id);
      showToast('Donation claimed successfully!');
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to claim donation', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleMarkDelivered = async (id: string) => {
    setActionLoading(prev => ({ ...prev, [id]: true }));
    try {
      await apiMarkDelivered(id);
      showToast('Delivery confirmed!');
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to confirm delivery', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingModal.volunteerId) return;
    setActionLoading(prev => ({ ...prev, [`rate-${ratingModal.deliveryId}`]: true }));
    try {
      await apiAddRating({
        ratedUserId: ratingModal.volunteerId,
        donationId: ratingModal.deliveryId,
        rating,
        review: comment,
      });
      showToast('Thank you for your feedback!');
      setRatingModal({ open: false, deliveryId: '', volunteerId: '' });
      setRating(5);
      setComment('');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to submit rating', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [`rate-${ratingModal.deliveryId}`]: false }));
    }
  };

  const availableDonations = useMemo(() => donations.filter(d => d.status === 'available'), [donations]);
  const myDeliveries = useMemo(() => deliveries.filter(d => d.status !== 'confirmed'), [deliveries]);
  const completedDeliveries = useMemo(() => deliveries.filter(d => d.status === 'confirmed'), [deliveries]);

  const sidebarItems = [
    { tab: 'overview', icon: 'fa-chart-pie', label: 'Overview' },
    { tab: 'donations', icon: 'fa-bullhorn', label: 'Available Donations' },
    { tab: 'deliveries', icon: 'fa-truck', label: 'Incoming Deliveries' },
    { tab: 'distribution', icon: 'fa-clipboard-check', label: 'Distribution Log' },
    { tab: 'profile', icon: 'fa-user-edit', label: 'My Profile' },
  ];

  return (
    <DashboardLayout
      sidebarItems={sidebarItems}
      activeTab={tab}
      setActiveTab={(t) => setTab(t as Tab)}
      user={user}
      handleLogout={handleLogout}
    >
      {loading && <div className="db-loading-bar">Loading rescue data…</div>}
      {apiError && (
        <div className="db-alert db-alert--error" role="alert">
          We could not load NGO data. Please try again shortly.
        </div>
      )}
      {toastMsg && <div className={`toast ${toastType}`}>{toastMsg}</div>}

      {tab === 'overview' && (
        <>
          <div className="db-welcome-banner">
            <div>
              <h1 className="db-welcome-title">NGO overview</h1>
              <p className="db-welcome-subtitle">{user?.name ? `${user.name} — ` : ''}Monitor claims, incoming deliveries, and distribution.</p>
            </div>
            <button className="db-btn db-btn-primary" onClick={() => setTab('donations')}>
              <i className="fas fa-bullhorn"></i> Browse donations
            </button>
          </div>
          <div className="db-grid">
            <div className="db-stat-card">
              <div className="stat-icon"><i className="fas fa-hand-holding-heart"></i></div>
              <div>
                <div className="stat-value">{completedDeliveries.length}</div>
                <div className="stat-label">Donations Received</div>
              </div>
            </div>
            <div className="db-stat-card">
              <div className="stat-icon"><i className="fas fa-users"></i></div>
              <div>
                <div className="stat-value">{availableDonations.length}</div>
                <div className="stat-label">Available now</div>
              </div>
            </div>
            <div className="db-stat-card">
              <div className="stat-icon"><i className="fas fa-leaf"></i></div>
              <div>
                <div className="stat-value">~{Math.round(completedDeliveries.length * 1.5)} kg</div>
                <div className="stat-label">Food Waste Reduced</div>
              </div>
            </div>
          </div>
          <div className="db-card db-panel">
            <div className="db-card-header"><h3 className="db-card-title">Operations</h3></div>
            <div className="db-card-body"><ul className="db-ops-list">
                <li><span>Available to claim</span><strong>{availableDonations.length}</strong></li>
                <li><span>Incoming deliveries</span><strong>{myDeliveries.length}</strong></li>
                <li><span>Completed distributions</span><strong>{completedDeliveries.length}</strong></li>
              </ul></div></div>
        </>
      )}

      {tab === 'donations' && (
        <>
          <h1 className="db-title">Available Donations</h1>
          <div className="db-card-grid">
            {availableDonations.map(d => {
              const expiry = calcExpiry(d.expiryTimestamp, now);
              return (
                <div key={d.id} className="db-card donation-card">
                  <div className="db-card-header">
                    <h4 className="donation-title">{d.title}</h4>
                    <span className="donation-expiry" style={{ color: expiry.color, backgroundColor: expiry.bg }}>
                      <i className="fas fa-clock"></i> {expiry.label}
                    </span>
                  </div>
                  <div className="db-card-body">
                    <p><i className="fas fa-user"></i> {d.donor}</p>
                    <p><i className="fas fa-box"></i> {d.quantity}</p>
                    <p><i className="fas fa-map-marker-alt"></i> {d.address}</p>
                  </div>
                  <div className="db-card-footer">
                    <button
                      className="db-btn db-btn-primary"
                      onClick={() => handleAccept(d.id)}
                      disabled={actionLoading[d.id]}
                    >
                      {actionLoading[d.id] ? <i className="fas fa-spinner fa-spin"></i> : 'Claim Donation'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === 'deliveries' && (
        <>
          <h1 className="db-title">Incoming Deliveries</h1>
          <div className="db-card">
            <div className="db-table-wrap"><table className="db-table">
                <thead>
                  <tr><th>Item</th><th>Volunteer</th><th>ETA</th><th>Status</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {myDeliveries.map(d => (
                    <tr key={d.id}>
                      <td>{d.item} ({d.quantity})</td>
                      <td>{d.volunteer}</td>
                      <td>{d.eta}</td>
                      <td><span className="db-badge badge-blue">{d.status}</span></td>
                      <td>
                        <button
                          className="db-btn db-btn-success db-btn-sm"
                          onClick={() => handleMarkDelivered(d.id)}
                          disabled={actionLoading[d.id]}
                        >
                          {actionLoading[d.id] ? <i className="fas fa-spinner fa-spin"></i> : 'Confirm Delivery'}
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

      {tab === 'distribution' && (
        <>
          <h1 className="db-title">Distribution Log</h1>
          <div className="db-card">
            <div className="db-table-wrap"><table className="db-table">
                <thead>
                  <tr><th>Date</th><th>Item</th><th>Quantity</th><th>Volunteer</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {completedDeliveries.map(d => (
                    <tr key={d.id}>
                      <td>{new Date(d.pickedUpAt).toLocaleDateString()}</td>
                      <td>{d.item}</td>
                      <td>{d.quantity}</td>
                      <td>{d.volunteer}</td>
                      <td>
                        <button
                          className="db-btn db-btn-secondary db-btn-sm"
                          onClick={() => setRatingModal({ open: true, deliveryId: d.id, volunteerId: d.volunteerId! })}
                        >
                          Rate Volunteer
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

      {tab === 'profile' && (
        <Profile />
      )}

      {ratingModal.open && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Rate Volunteer</h2>
            <form onSubmit={handleRatingSubmit}>
              <div className="form-group">
                <label>Rating</label>
                <div className="star-rating">
                  {[5, 4, 3, 2, 1].map(star => (
                    <React.Fragment key={star}>
                      <input type="radio" id={`star${star}`} name="rating" value={star} checked={rating === star} onChange={() => setRating(star)} />
                      <label htmlFor={`star${star}`}><i className="fas fa-star"></i></label>
                    </React.Fragment>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="comment">Comment</label>
                <textarea id="comment" value={comment} onChange={e => setComment(e.target.value)} rows={3}></textarea>
              </div>
              <div className="modal-actions">
                <button type="submit" className="db-btn db-btn-primary" disabled={actionLoading[`rate-${ratingModal.deliveryId}`]}>
                  {actionLoading[`rate-${ratingModal.deliveryId}`] ? 'Submitting...' : 'Submit Review'}
                </button>
                <button type="button" className="db-btn" onClick={() => setRatingModal({ open: false, deliveryId: '', volunteerId: '' })}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default NgoDashboard;



