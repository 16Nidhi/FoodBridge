import React, { useState, FormEvent, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, Title, Tooltip, Legend,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { logout } from '../../store/slices/authSlice';
import { getMyDonations, createDonation as apiCreateDonation, updateDonation, deleteDonation } from '../../services/api';
import { Donation } from '../../types';
import ListingCard from '../../components/common/ListingCard';
import '../../components/common/Dashboard.css';
import DashboardLayout from '../../components/common/DashboardLayout';
import Profile from '../Profile';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

type Tab = 'overview' | 'donate' | 'history' | 'profile';

const DonorDashboard: React.FC = () => {
  const user = useSelector((state: any) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>('overview');
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [editDonation, setEditDonation] = useState<Donation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const blank = { foodItem: '', quantity: '', pickupLocation: '', pickupTime: '' };
  const [form, setForm] = useState(blank);

  const fetchDonations = useCallback(async () => {
    setLoading(true);
    try {
      const userDonations = await getMyDonations();
      setDonations(userDonations);
    } catch (error) {
      setApiError('Failed to fetch donations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'history' || tab === 'overview') {
      fetchDonations();
    }
  }, [tab, fetchDonations]);

  const handleLogout = () => { localStorage.removeItem('token'); dispatch(logout()); navigate('/login'); };

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(null), 5000);
  };

  const handleCreateDonation = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiCreateDonation({
        ...form,
        pickupTime: new Date(form.pickupTime).toISOString(),
      });
      setForm(blank);
      showToast('Donation created successfully!', 'success');
      setTab('history');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to submit donation.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateDonation = async (e: FormEvent) => {
    e.preventDefault();
    if (!editDonation) return;
    setSubmitting(true);
    try {
      await updateDonation(editDonation._id, {
        ...form,
        pickupTime: new Date(form.pickupTime).toISOString(),
      });
      setIsModalOpen(false);
      setEditDonation(null);
      showToast('Donation updated successfully!', 'success');
      fetchDonations();
    } catch (error) {
      showToast('Failed to update donation.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (donation: Donation) => {
    setEditDonation(donation);
    setForm({
      foodItem: donation.foodItem,
      quantity: donation.quantity,
      pickupLocation: donation.pickupLocation,
      pickupTime: new Date(donation.pickupTime).toISOString().slice(0, 16),
    });
    setIsModalOpen(true);
  };

  const handleDeleteDonation = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this donation?')) {
      try {
        await deleteDonation(id);
        showToast('Donation deleted successfully.', 'success');
        fetchDonations();
      } catch (error) {
        showToast('Failed to delete donation.', 'error');
      }
    }
  };

  const sidebarItems = [
    { tab: 'overview', icon: 'fa-chart-pie', label: 'Overview' },
    { tab: 'donate', icon: 'fa-plus-circle', label: 'New Donation' },
    { tab: 'history', icon: 'fa-history', label: 'Donation History' },
    { tab: 'profile', icon: 'fa-user-edit', label: 'My Profile' },
  ];

  const pendingDonations = donations.filter(d => d.status === 'pending').length;
  const claimedDonations = donations.filter(d => d.status === 'claimed').length;
  const completedDonations = donations.filter(d => d.status === 'completed').length;

  const doughnutData = {
    labels: ['Pending', 'Claimed', 'Completed'],
    datasets: [{
      data: [pendingDonations, claimedDonations, completedDonations],
      backgroundColor: ['#ffc107', '#17a2b8', '#28a745'],
      borderColor: '#ffffff',
      borderWidth: 2,
    }],
  };

  return (
    <DashboardLayout
      sidebarItems={sidebarItems}
      activeTab={tab}
      setActiveTab={(t) => setTab(t as Tab)}
      hideHeaderTitle={tab === 'profile'}
      user={user}
      handleLogout={handleLogout}
    >
      {loading && <div className="loading-spinner"><div></div></div>}
      {apiError && <div className="error-msg">{apiError}</div>}
      {toastMsg && <div className={`toast ${toastType}`}>{toastMsg}</div>}

      {tab === 'overview' && (
        <>
          <h1 className="db-title">Donor Dashboard</h1>
          <div className="db-grid">
            <div className="db-stat-card">
              <div className="stat-icon"><i className="fas fa-box-open"></i></div>
              <div>
                <div className="stat-value">{donations.length}</div>
                <div className="stat-label">Total Donations</div>
              </div>
            </div>
            <div className="db-stat-card">
              <div className="stat-icon" style={{ background: 'var(--chip-success)' }}><i className="fas fa-check-circle"></i></div>
              <div>
                <div className="stat-value">{completedDonations}</div>
                <div className="stat-label">Completed</div>
              </div>
            </div>
            <div className="db-stat-card">
              <div className="stat-icon" style={{ background: 'var(--chip-warning)' }}><i className="fas fa-hourglass-start"></i></div>
              <div>
                <div className="stat-value">{pendingDonations}</div>
                <div className="stat-label">Pending</div>
              </div>
            </div>
            <div className="db-stat-card">
              <div className="stat-icon" style={{ background: 'var(--chip-info)' }}><i className="fas fa-hand-holding-heart"></i></div>
              <div>
                <div className="stat-value">{claimedDonations}</div>
                <div className="stat-label">Claimed</div>
              </div>
            </div>
          </div>
          <div className="db-card">
            <div className="db-card-header">
              <h3 className="db-card-title">Donation Status</h3>
            </div>
            <div className="db-card-body" style={{ height: '300px', display: 'flex', justifyContent: 'center' }}>
              <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
        </>
      )}

      {tab === 'donate' && (
        <>
          <h1 className="db-title">Create a New Donation</h1>
          <div className="db-card">
            <div className="db-card-body">
              <form onSubmit={handleCreateDonation} className="auth-form">
                <div className="form-group">
                  <label htmlFor="foodItem">Food Item</label>
                  <input type="text" id="foodItem" value={form.foodItem} onChange={e => setForm({ ...form, foodItem: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label htmlFor="quantity">Quantity (e.g., 10 meals, 5 kg)</label>
                  <input type="text" id="quantity" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label htmlFor="pickupLocation">Pickup Location</label>
                  <input type="text" id="pickupLocation" value={form.pickupLocation} onChange={e => setForm({ ...form, pickupLocation: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label htmlFor="pickupTime">Best Time for Pickup</label>
                  <input type="datetime-local" id="pickupTime" value={form.pickupTime} onChange={e => setForm({ ...form, pickupTime: e.target.value })} required />
                </div>
                <button type="submit" className="db-btn db-btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Create Donation'}
                </button>
              </form>
            </div>
          </div>
        </>
      )}

      {tab === 'history' && (
        <>
          <h1 className="db-title">My Donation History</h1>
          <div className="listings-grid">
            {donations.map(donation => (
              <ListingCard
                key={donation._id}
                listing={donation}
                onEdit={() => openEditModal(donation)}
                onUpdate={fetchDonations}
              />
            ))}
          </div>
        </>
      )}

      {tab === 'profile' && (
        <Profile />
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Edit Donation</h2>
            <form onSubmit={handleUpdateDonation}>
              <div className="form-group">
                <label htmlFor="editFoodItem">Food Item</label>
                <input type="text" id="editFoodItem" value={form.foodItem} onChange={e => setForm({ ...form, foodItem: e.target.value })} required />
              </div>
              <div className="form-group">
                <label htmlFor="editQuantity">Quantity</label>
                <input type="text" id="editQuantity" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required />
              </div>
              <div className="form-group">
                <label htmlFor="editPickupLocation">Pickup Location</label>
                <input type="text" id="editPickupLocation" value={form.pickupLocation} onChange={e => setForm({ ...form, pickupLocation: e.target.value })} required />
              </div>
              <div className="form-group">
                <label htmlFor="editPickupTime">Pickup Time</label>
                <input type="datetime-local" id="editPickupTime" value={form.pickupTime} onChange={e => setForm({ ...form, pickupTime: e.target.value })} required />
              </div>
              <div className="modal-actions">
                <button type="submit" className="db-btn db-btn-primary" disabled={submitting}>
                  {submitting ? 'Updating...' : 'Update Donation'}
                </button>
                <button type="button" className="db-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default DonorDashboard;
