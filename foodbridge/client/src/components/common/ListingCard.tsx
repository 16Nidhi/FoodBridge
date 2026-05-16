import React, { useState } from 'react';
import { Donation } from '../../types';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { claimDonationThunk, optimisticClaim, clearOptimisticUpdate } from '../../store/slices/listingSlice';
import { completeDonation, deleteDonation, addRating } from '../../services/api';
import RatingModal from './RatingModal';
import {
  formatExpiryTiming,
  formatListedAgo,
  formatPickupEta,
  parseDate,
  getDonorTypeLabel,
  getRescuePartnerLabel,
  getRescueUrgency,
  getStatusLabel,
  isDemoListingId,
  normalizeDonation,
} from '../listings/listingUtils';
import './ListingCard.css';

interface ListingCardProps {
  listing: Donation;
  onUpdate: () => void;
  onEdit?: () => void;
  isDemo?: boolean;
}

const URGENCY_LABELS = {
  high: 'Urgent',
  medium: 'Soon',
  low: 'Flexible',
} as const;

const ListingCard: React.FC<ListingCardProps> = ({
  listing: initialListing,
  onUpdate,
  onEdit,
  isDemo: isDemoProp,
}) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch<AppDispatch>();
  const optimisticUpdates = useSelector((state: RootState) => state.listings.optimisticUpdates);
  const claimLoading = useSelector((state: RootState) => state.listings.loading);

  const [isRatingModalOpen, setRatingModalOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const rawListing = optimisticUpdates[initialListing._id]
    ? { ...initialListing, ...optimisticUpdates[initialListing._id] }
    : initialListing;

  const listing = normalizeDonation(
    rawListing as Donation & Record<string, unknown>
  );
  const isDemo = isDemoProp ?? isDemoListingId(listing._id);
  const urgency = getRescueUrgency(listing);
  const rescuePartner = getRescuePartnerLabel(listing);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleClaim = async () => {
    if (isDemo) return;
    setShowConfirmModal(false);
    dispatch(optimisticClaim({ id: listing._id, user }));

    try {
      // @ts-ignore: Next-gen Redux thunk typings
      await dispatch(claimDonationThunk(listing._id)).unwrap();
      showToast('Donation claimed successfully!', 'success');
      onUpdate();
    } catch (error: unknown) {
      dispatch(clearOptimisticUpdate(listing._id));
      const msg =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message: string }).message)
          : 'Could not claim this donation. Please try again.';
      showToast(
        /network error/i.test(msg)
          ? 'Connection issue — please check your network and try again.'
          : msg,
        'error'
      );
    }
  };

  const handleComplete = async () => {
    if (isDemo) return;
    if (window.confirm('Mark this donation as completed?')) {
      await completeDonation(listing._id);
      onUpdate();
    }
  };

  const handleDelete = async () => {
    if (isDemo) return;
    if (window.confirm('Delete this donation listing?')) {
      await deleteDonation(listing._id);
      onUpdate();
    }
  };

  const handleRate = async (rating: number, review: string) => {
    if (isDemo) return;
    try {
      const ratedUserId =
        user?._id === listing.donor._id
          ? listing.claimedBy?._id
          : listing.donor._id;
      if (!ratedUserId) {
        showToast('Unable to identify who to rate for this donation.', 'error');
        return;
      }
      await addRating({
        ratedUserId,
        donationId: listing._id,
        rating,
        review,
      });
      showToast('Thank you for your feedback!', 'success');
      setRatingModalOpen(false);
      onUpdate();
    } catch (error: unknown) {
      const msg =
        error &&
        typeof error === 'object' &&
        'response' in error &&
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message
          ? String(
              (error as { response?: { data?: { message?: string } } }).response
                ?.data?.message
            )
          : 'Could not submit your rating. Please try again.';
      showToast(msg, 'error');
    }
  };

  const canClaim =
    !isDemo &&
    user &&
    (user.role === 'ngo' || user.role === 'volunteer') &&
    listing.status === 'pending';
  const canComplete =
    !isDemo &&
    user &&
    listing.claimedBy &&
    user._id === listing.claimedBy._id &&
    listing.status === 'claimed';
  const canEditOrDelete =
    !isDemo &&
    user &&
    user._id === listing.donor._id &&
    listing.status === 'pending';

  const isDonationCompleted = listing.status === 'completed';
  const isUserDonor = user && user._id === listing.donor._id;
  const isUserClaimer =
    user && listing.claimedBy && user._id === listing.claimedBy._id;
  const canRate = !isDemo && isDonationCompleted && (isUserDonor || isUserClaimer);

  const pickupDisplay = formatPickupEta(listing.pickupTime);
  const expiryDisplay = formatExpiryTiming(listing);
  const listedDisplay = formatListedAgo(listing.createdAt);
  const pickupWindow = parseDate(listing.pickupTime);
  const pickupWindowLabel = pickupWindow
    ? pickupWindow.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : 'TBD';

  return (
    <article
      className={`listing-card${isDemo ? ' listing-card--demo' : ''}`}
    >
      <header className="listing-card__header">
        <div className="listing-card__title-block">
          <h3 className="listing-card__title">{listing.foodItem}</h3>
          {listing.category && (
            <span className="listing-card__category">{listing.category}</span>
          )}
        </div>
        <div className="listing-card__badges">
          {isDemo && <span className="listing-card__demo-tag">Sample</span>}
          <span
            className={`listing-card__status listing-card__status--${listing.status}`}
          >
            {getStatusLabel(listing.status)}
          </span>
          {urgency !== 'none' && (
            <span className={`listing-card__urgency listing-card__urgency--${urgency}`}>
              {URGENCY_LABELS[urgency]}
            </span>
          )}
        </div>
      </header>

      <div className="listing-card__meta-grid">
        <div className="listing-card__meta-row listing-card__donor-line">
          <span className="listing-card__meta-icon" aria-hidden="true">
            👤
          </span>
          <span>
            <strong>{listing.donor.name}</strong>
            <br />
            {getDonorTypeLabel(listing.donor)}
          </span>
        </div>

        {rescuePartner && (
          <div className="listing-card__meta-row">
            <span className="listing-card__meta-icon" aria-hidden="true">
              🏢
            </span>
            <span>
              Rescue partner: <strong>{rescuePartner}</strong>
            </span>
          </div>
        )}

        <div className="listing-card__meta-row">
          <span className="listing-card__meta-icon" aria-hidden="true">
            📦
          </span>
          <span>
            Quantity: <strong>{listing.quantity}</strong>
          </span>
        </div>

        <div className="listing-card__meta-row">
          <span className="listing-card__meta-icon" aria-hidden="true">
            📍
          </span>
          <span>{listing.pickupLocation}</span>
        </div>

        <div className="listing-card__meta-row">
          <span className="listing-card__meta-icon" aria-hidden="true">
            🕐
          </span>
          <span>
            Pickup ETA: <strong>{pickupDisplay}</strong>
          </span>
        </div>

        <div className="listing-card__meta-row">
          <span className="listing-card__meta-icon" aria-hidden="true">
            ⏳
          </span>
          <span>{expiryDisplay}</span>
        </div>

        {listing.description && (
          <div className="listing-card__meta-row">
            <span className="listing-card__meta-icon" aria-hidden="true">
              📝
            </span>
            <span>{listing.description}</span>
          </div>
        )}
      </div>

      <div className="listing-card__timestamps">
        <span>{listedDisplay}</span>
        <span>Pickup window: {pickupWindowLabel}</span>
      </div>

      {(canClaim || canComplete || canEditOrDelete || canRate) && (
        <div className="listing-card__actions">
          {canClaim && (
            <button
              type="button"
              className="listing-card__btn listing-card__btn--primary"
              onClick={() => setShowConfirmModal(true)}
              disabled={claimLoading}
            >
              {claimLoading ? 'Claiming…' : 'Claim donation'}
            </button>
          )}
          {canComplete && (
            <button
              type="button"
              className="listing-card__btn listing-card__btn--primary"
              onClick={handleComplete}
            >
              Mark completed
            </button>
          )}
          {canEditOrDelete && (
            <>
              {onEdit && (
                <button
                  type="button"
                  className="listing-card__btn listing-card__btn--secondary"
                  onClick={onEdit}
                >
                  Edit
                </button>
              )}
              <button
                type="button"
                className="listing-card__btn listing-card__btn--danger"
                onClick={handleDelete}
              >
                Delete
              </button>
            </>
          )}
          {canRate && (
            <button
              type="button"
              className="listing-card__btn listing-card__btn--secondary"
              onClick={() => setRatingModalOpen(true)}
            >
              Rate transaction
            </button>
          )}
        </div>
      )}

      {showConfirmModal && (
        <div
          className="listing-card__modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="claim-modal-title"
        >
          <div className="listing-card__modal">
            <h3 id="claim-modal-title">Confirm claim</h3>
            <p>
              You are claiming <strong>{listing.foodItem}</strong> from{' '}
              {listing.donor.name}. Pickup: {pickupDisplay}.
            </p>
            <div className="listing-card__modal-actions">
              <button
                type="button"
                className="listing-card__btn listing-card__btn--secondary"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="listing-card__btn listing-card__btn--primary"
                onClick={handleClaim}
              >
                Confirm claim
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          className={`listing-card__toast listing-card__toast--${toast.type}`}
          role="status"
        >
          {toast.message}
        </div>
      )}

      {isRatingModalOpen && (
        <RatingModal
          isOpen={isRatingModalOpen}
          onClose={() => setRatingModalOpen(false)}
          onSubmit={handleRate}
          userNameToRate={
            user?._id === listing.donor._id
              ? listing.claimedBy?.name
              : listing.donor.name
          }
        />
      )}
    </article>
  );
};

export default ListingCard;
