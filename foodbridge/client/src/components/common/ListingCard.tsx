import React from 'react';

interface ListingCardProps {
  listing: {
    id: string;
    description?: string;
    quantity?: number;
    pickupLocation?: string;
    expiryDate?: string | Date;
  };
}

const ListingCard: React.FC<ListingCardProps> = ({ listing }) => (
  <div style={{border:'1px solid #E2E8F0',borderRadius:8,padding:16,marginBottom:12,background:'#fff'}}>
    <p style={{fontWeight:600}}>{listing.description || 'Food Listing'}</p>
    <p style={{fontSize:'0.85rem',color:'#64748B'}}>Qty: {listing.quantity} · {listing.pickupLocation}</p>
    <p style={{fontSize:'0.8rem',color:'#94A3B8'}}>
      Expires: {listing.expiryDate ? (typeof listing.expiryDate === 'string' ? listing.expiryDate : new Date(listing.expiryDate).toLocaleDateString()) : ''}
    </p>
  </div>
);

export default ListingCard;
