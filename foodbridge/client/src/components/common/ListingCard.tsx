import React, { useState } from 'react';
import { Donation } from '../../types';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { claimDonationThunk, optimisticClaim, clearOptimisticUpdate } from '../../store/slices/listingSlice';
import { completeDonation, deleteDonation, addRating } from '../../services/api';
import RatingModal from './RatingModal';

interface ListingCardProps {
  listing: Donation;
  onUpdate: () => void;
  onEdit?: () => void;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing: initialListing, onUpdate, onEdit }) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch<AppDispatch>();
  const optimisticUpdates = useSelector((state: RootState) => state.listings.optimisticUpdates);
  const loading = useSelector((state: RootState) => state.listings.loading);

  const [isRatingModalOpen, setRatingModalOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Apply optimistic updates
  const listing = optimisticUpdates[initialListing._id]
    ? { ...initialListing, ...optimisticUpdates[initialListing._id] }
    : initialListing;

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleClaim = async () => {
    setShowConfirmModal(false);
    
    // Instant UI update
    dispatch(optimisticClaim({ id: listing._id, user }));

    try {
      // @ts-ignore: Next-gen Redux thunk typings
      await dispatch(claimDonationThunk(listing._id)).unwrap();
      showToast('Donation claimed successfully!', 'success');
      onUpdate();
    } catch (error: any) {
      dispatch(clearOptimisticUpdate(listing._id));
      showToast(error.message || 'Failed to claim donation', 'error');
    }
  };

  const handleComplete = async () => {
    if (window.confirm('Are you sure you want to mark this donation as completed?')) {
      await completeDonation(listing._id);
      onUpdate();
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this donation?')) {
      await deleteDonation(listing._id);
      onUpdate();
    }
  };

  const handleRate = async (rating: number, review: string) => {
    try {
      const ratedUserId = user?._id === listing.donor._id ? listing.claimedBy?._id : listing.donor._id;
      if (!ratedUserId) {
        alert('Error: The other user could not be identified for rating.');
        return;
      }
      await addRating({
        ratedUserId,
        donationId: listing._id,
        rating,
        review,
      });
      alert('Thank you for your feedback!');
      setRatingModalOpen(false);
      onUpdate(); // Refresh listings to potentially hide the rate button
    } catch (error: any) {
      alert(`Failed to submit rating: ${error.response?.data?.message || error.message}`);
    }
  };

  const canClaim = user && (user.role === 'ngo' || user.role === 'volunteer') && listing.status === 'pending';
  const canComplete = user && listing.claimedBy && user._id === listing.claimedBy._id && listing.status === 'claimed';
  const canEditOrDelete = user && user._id === listing.donor._id && listing.status === 'pending';
  
  const isDonationCompleted = listing.status === 'completed';
  const isUserDonor = user && user._id === listing.donor._id;
  const isUserClaimer = user && listing.claimedBy && user._id === listing.claimedBy._id;
  const canRate = isDonationCompleted && (isUserDonor || isUserClaimer);

  const getStatusBadgeColor = () => {
    switch (listing.status) {
      case 'pending':
        return '#f97316'; // Orange
      case 'claimed':
        return '#3b82f6'; // Blue
      case 'completed':
        return '#22c55e'; // Green
      default:
        return '#6b7280'; // Gray
    }
  };

  return (
    <div style={{ border: '1px solid var(--border-color)', borderRadius: 8, padding: 16, marginBottom: 12, background: 'var(--card-bg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontWeight: 600 }}>{listing.foodItem}</p>
        <span style={{
          backgroundColor: getStatusBadgeColor(),
          color: 'white',
          padding: '2px 8px',
          borderRadius: '12px',
          fontSize: '0.75rem',
          fontWeight: 500,
          textTransform: 'capitalize'
        }}>
          {listing.status}
        </span>
      </div>
      <p style={{ fontSize: '0.85rem', color: '#64748B' }}>Qty: {listing.quantity} · {listing.pickupLocation}</p>
      <p style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
        Pickup Time: {new Date(listing.pickupTime).toLocaleString()}
      </p>
      {listing.claimedBy && (
        <p style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
          Claimed by: {listing.claimedBy.name}
        </p>
      )}
      <div style={{ marginTop: '1rem', position: 'relative' }}>
        {canClaim && (
          <button 
            onClick={() => setShowConfirmModal(true)}
            disabled={loading}
            style={{ 
              opacity: loading ? 0.7 : 1, 
              cursor: loading ? 'not-allowed' : 'pointer' 
            }}
          >
            {loading ? 'Claiming...' : 'Claim Donation'}
          </button>
        )}
        {canComplete && <button onClick={handleComplete}>Mark as Completed</button>}
        {canEditOrDelete && (
          <>
            <button style={{ marginRight: '0.5rem' }} onClick={onEdit}>Edit</button>
            <button onClick={handleDelete}>Delete</button>
          </>
        )}
        {canRate && <button onClick={() => setRatingModalOpen(true)}>Rate Transaction</button>}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center',
          alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'var(--card-bg)', padding: '2rem', borderRadius: 'var(--r-sm)',
            maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: 'var(--sh-sm)'
          }}>
            <h3 style={{ marginTop: 0, color: 'var(--text-primary)' }}>Confirm Claim</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Are you sure you want to claim this donation?
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              <button 
                onClick={() => setShowConfirmModal(false)}
                style={{ background: 'var(--border-color)', color: 'var(--text-primary)' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleClaim}
                style={{ background: 'var(--c-primary)', color: 'var(--on-primary)' }}
              >
                Confirm Claim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '20px', right: '20px',
          background: toast.type === 'success' ? 'var(--c-primary)' : 'var(--c-danger)',
          color: 'var(--on-primary)', padding: '14px 24px', borderRadius: 'var(--r-sm)',
          boxShadow: 'var(--sh-sm)', zIndex: 1001,
          fontWeight: 500, animation: 'fadeIn 0.3s ease-in-out'
        }}>
          {toast.message}
        </div>
      )}

      {isRatingModalOpen && (
        <RatingModal
          isOpen={isRatingModalOpen}
          onClose={() => setRatingModalOpen(false)}
          onSubmit={handleRate}
          userNameToRate={user?._id === listing.donor._id ? listing.claimedBy?.name : listing.donor.name}
        />
      )}
    </div>
  );
};

export default ListingCard;
