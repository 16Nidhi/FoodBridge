import React, { useState } from 'react';
import './RatingModal.css';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, review: string) => void;
  userNameToRate?: string;
}

const RatingModal: React.FC<RatingModalProps> = ({ isOpen, onClose, onSubmit, userNameToRate }) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [hoverRating, setHoverRating] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      alert('Please select a rating.');
      return;
    }
    onSubmit(rating, review);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button onClick={onClose} className="modal-close-btn">&times;</button>
        <h2>Rate {userNameToRate || 'the transaction'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="star-rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`star ${star <= (hoverRating || rating) ? 'filled' : ''}`}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
              >
                &#9733;
              </span>
            ))}
          </div>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Leave a review (optional)"
            className="review-textarea"
          />
          <button type="submit" className="submit-rating-btn">Submit Rating</button>
        </form>
      </div>
    </div>
  );
};

export default RatingModal;
