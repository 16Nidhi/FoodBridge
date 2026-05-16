import React from "react";
import "./ListingSkeleton.css";

interface ListingSkeletonProps {
  count?: number;
}

const ListingSkeleton: React.FC<ListingSkeletonProps> = ({ count = 6 }) => {
  return (
    <div
      className="listings-skeleton-grid"
      aria-busy="true"
      aria-label="Loading listings"
    >
      {Array.from({ length: count }, (_, i) => (
        <div className="listing-skeleton-card" key={i}>
          <div className="listing-skeleton-line listing-skeleton-line--title" />
          <div className="listing-skeleton-row">
            <div className="listing-skeleton-pill" />
            <div className="listing-skeleton-pill listing-skeleton-pill--sm" />
          </div>
          <div className="listing-skeleton-line" />
          <div className="listing-skeleton-line listing-skeleton-line--short" />
          <div className="listing-skeleton-line listing-skeleton-line--short" />
          <div className="listing-skeleton-actions">
            <div className="listing-skeleton-btn" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ListingSkeleton;
