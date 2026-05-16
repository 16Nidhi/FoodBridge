import React, { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Donation } from '../../types';
import { getMyDonations } from '../../services/api';

import DashboardLayout from '../../components/common/DashboardLayout';
import EmptyState from '../../components/common/EmptyState';
import ListingCard from '../../components/common/ListingCard';
import Profile from '../Profile';
import '../../components/common/Dashboard.css';

type Tab = 'overview' | 'donate' | 'history' | 'profile';

const statusBadge = (status: string) => {
  if (status === 'completed') return 'badge-green';
  if (status === 'claimed') return 'badge-blue';
  return 'badge-orange';
};

const DonorDashboard: React.FC = () => {
  const user = useSelector((s: any) => s.auth?.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>('overview');
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchDonations = async () => {
      setLoading(true);
      setApiError(null);
      try {
        const res = await getMyDonations();
        if (!mounted) return;
        setDonations(Array.isArray(res) ? res : []);
      } catch (err: any) {
        console.error('Failed to load donations', err);
        if (!mounted) return;
        setApiError(err?.response?.data?.message || String(err) || 'Failed to load donations');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchDonations();
    return () => { mounted = false; };
  }, [dispatch]);

  const safeDonations = donations || [];
  const pendingDonations = safeDonations.filter((d) => d.status === 'pending').length;
  const claimedDonations = safeDonations.filter((d) => d.status === 'claimed').length;
  const completedDonations = safeDonations.filter((d) => d.status === 'completed').length;

  const handleCreateDonation = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await getMyDonations();
      const refreshed = await getMyDonations();
      setDonations(Array.isArray(refreshed) ? refreshed : []);
      setTab('history');
    } catch (err: any) {
      console.error(err);
      setApiError(err?.response?.data?.message || String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const fetchDonations = async () => {
    setLoading(true);
    try {
      const res = await getMyDonations();
      setDonations(Array.isArray(res) ? res : []);
    } catch (err: any) {
      setApiError(err?.response?.data?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const sidebarItems = [
    { tab: 'overview', icon: 'fa-house', label: 'Overview', notifCount: pendingDonations },
    { tab: 'donate', icon: 'fa-plus', label: 'Donate', notifCount: 0 },
    { tab: 'history', icon: 'fa-list', label: 'History', notifCount: donations.length },
    { tab: 'profile', icon: 'fa-user', label: 'Profile', notifCount: 0 },
  ];

  return (
    <DashboardLayout
      sidebarItems={sidebarItems}
      activeTab={tab}
      setActiveTab={(t) => setTab(t as Tab)}
      hideHeaderTitle={tab === 'profile'}
      user={user}
      handleLogout={() => { localStorage.removeItem('token'); navigate('/login'); }}
    >
      {loading && <div className="db-loading-bar">Loading your donations…</div>}
      {apiError && (
        <div className="db-alert db-alert--error" role="alert">
          We could not load your donations. Please try again shortly.
        </div>
      )}

      {tab === 'overview' && (
        <>
          <div className="db-welcome-banner">
            <div>
              <h1 className="db-welcome-title">Donor overview</h1>
              <p className="db-welcome-subtitle">
                {user?.name ? `${user.name} — ` : ''}Track donations, pickup status, and what needs attention.
              </p>
            </div>
            <button type="button" className="db-btn db-btn-primary" onClick={() => setTab('donate')}>
              <i className="fas fa-plus" /> New donation
            </button>
          </div>

          <div className="db-grid">
            <div className="db-stat-card">
              <div className="stat-icon"><i className="fas fa-box-open" /></div>
              <div>
                <div className="stat-value">{donations.length}</div>
                <div className="stat-label">Total donations</div>
              </div>
            </div>
            <div className="db-stat-card">
              <div className="stat-icon" style={{ background: 'var(--chip-success)' }}><i className="fas fa-check-circle" /></div>
              <div>
                <div className="stat-value">{completedDonations}</div>
                <div className="stat-label">Completed</div>
              </div>
            </div>
            <div className="db-stat-card">
              <div className="stat-icon" style={{ background: 'var(--chip-warning)' }}><i className="fas fa-hourglass-start" /></div>
              <div>
                <div className="stat-value">{pendingDonations}</div>
                <div className="stat-label">Awaiting pickup</div>
              </div>
            </div>
            <div className="db-stat-card">
              <div className="stat-icon" style={{ background: 'var(--chip-info)' }}><i className="fas fa-hand-holding-heart" /></div>
              <div>
                <div className="stat-value">{claimedDonations}</div>
                <div className="stat-label">In rescue</div>
              </div>
            </div>
          </div>

          <div className="db-card db-panel">
            <div className="db-card-header">
              <h3 className="db-card-title">Recent activity</h3>
              {safeDonations.length > 0 && (
                <button type="button" className="db-btn db-btn-secondary db-btn-sm" onClick={() => setTab('history')}>
                  View all
                </button>
              )}
            </div>
            <div className="db-card-body">
              {safeDonations.length === 0 ? (
                <EmptyState
                  title="No donations yet"
                  description="Post surplus food to start the rescue workflow."
                  actionText="Create donation"
                  onAction={() => setTab('donate')}
                />
              ) : (
                <ul className="db-ops-list">
                  {safeDonations.slice(0, 6).map((d) => (
                    <li key={d._id}>
                      <span>{d.foodItem || 'Donation'}</span>
                      <span className={`db-badge ${statusBadge(d.status)}`}>{d.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}

      {tab === 'donate' && (
        <>
          <h1 className="db-title">Create a new donation</h1>
          <div className="db-card">
            <div className="db-card-body">
              <form onSubmit={handleCreateDonation} className="auth-form">
                <div className="form-group">
                  <label htmlFor="foodItem">Food item</label>
                  <input type="text" id="foodItem" name="foodItem" />
                </div>
                <div className="form-group">
                  <label htmlFor="quantity">Quantity</label>
                  <input type="text" id="quantity" name="quantity" />
                </div>
                <div className="form-group">
                  <label htmlFor="pickupLocation">Pickup location</label>
                  <input type="text" id="pickupLocation" name="pickupLocation" />
                </div>
                <div className="form-group">
                  <label htmlFor="pickupTime">Best time for pickup</label>
                  <input type="datetime-local" id="pickupTime" name="pickupTime" />
                </div>
                <button type="submit" className="db-btn db-btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Create donation'}
                </button>
              </form>
            </div>
          </div>
        </>
      )}

      {tab === 'history' && (
        <>
          <h1 className="db-title">My donation history</h1>
          {safeDonations.length === 0 ? (
            <EmptyState
              title="No donations yet"
              description="Your posted donations will appear here."
              actionText="Donate now"
              onAction={() => setTab('donate')}
            />
          ) : (
            <div className="listings-grid">
              {safeDonations.map((d) => (
                <ListingCard key={d._id} listing={d as any} onEdit={() => {}} onUpdate={fetchDonations} />
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'profile' && <Profile />}
    </DashboardLayout>
  );
};

export default DonorDashboard;
