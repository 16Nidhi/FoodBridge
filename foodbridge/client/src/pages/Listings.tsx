import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getAllDonations } from '../services/api';
import ListingCard from '../components/common/ListingCard';
import ListingSkeleton from '../components/listings/ListingSkeleton';
import {
  filterListings,
  getListingsFetchNotice,
  MOCK_LISTINGS,
  normalizeDonation,
  shouldUseDemoFallback,
} from '../components/listings/listingUtils';
import { Donation } from '../types';
import './Listings.css';

const Listings: React.FC = () => {
  const [listings, setListings] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingDemo, setUsingDemo] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [foodTypeFilter, setFoodTypeFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setNotice(null);

    try {
      const data = await getAllDonations({
        search: searchQuery,
        foodType: foodTypeFilter,
        location: locationFilter,
      });
      const normalized = (data ?? []).map((d) =>
        normalizeDonation(d as Donation & Record<string, unknown>)
      );
      setListings(normalized);
      setUsingDemo(false);
    } catch (err: unknown) {
      if (shouldUseDemoFallback(err)) {
        const filtered = filterListings(MOCK_LISTINGS, {
          search: searchQuery,
          foodType: foodTypeFilter,
          location: locationFilter,
        });
        setListings(filtered);
        setUsingDemo(true);
        setNotice(getListingsFetchNotice(err));
      } else {
        setListings([]);
        setUsingDemo(false);
        setNotice(
          'Listings could not be loaded. Try again in a moment or adjust your filters.'
        );
      }
    } finally {
      setLoading(false);
    }
  }, [searchQuery, foodTypeFilter, locationFilter]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchListings();
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setFoodTypeFilter('');
    setLocationFilter('');
  };

  const displayCount = listings.length;
  const hasActiveFilters = Boolean(
    searchQuery.trim() || foodTypeFilter || locationFilter.trim()
  );

  const subtitle = useMemo(() => {
    if (loading) return 'Loading surplus food available for pickup near you…';
    if (usingDemo) return 'Browsing sample listings — connect to the server for live rescues.';
    return 'Browse nearby surplus food available for pickup.';
  }, [loading, usingDemo]);

  return (
    <main className="listings-page">
      <header className="listings-header">
        <p className="listings-eyebrow">Rescue network</p>
        <h1>Available food listings</h1>
        <p className="listings-subtitle">{subtitle}</p>
      </header>

      {notice && (
        <div className="listings-notice" role="status">
          <span className="listings-notice__icon" aria-hidden="true">
            ℹ️
          </span>
          <p>{notice}</p>
          <button
            type="button"
            className="listings-notice__retry"
            onClick={fetchListings}
            disabled={loading}
          >
            Retry
          </button>
        </div>
      )}

      <div className="filters-container">
        <form onSubmit={handleSearch} className="search-form">
          <label className="visually-hidden" htmlFor="listings-search">
            Search listings
          </label>
          <input
            id="listings-search"
            type="search"
            placeholder="Search food, donor, or description…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-button" disabled={loading}>
            Search
          </button>
        </form>
        <div className="filter-dropdowns">
          <label className="visually-hidden" htmlFor="food-type-filter">
            Food type
          </label>
          <select
            id="food-type-filter"
            value={foodTypeFilter}
            onChange={(e) => setFoodTypeFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All food types</option>
            <option value="Fruits">Fruits</option>
            <option value="Vegetables">Vegetables</option>
            <option value="Dairy">Dairy</option>
            <option value="Bakery">Bakery</option>
            <option value="Canned Goods">Canned Goods</option>
            <option value="Meals">Meals</option>
            <option value="Other">Other</option>
          </select>
          <label className="visually-hidden" htmlFor="location-filter">
            Location
          </label>
          <input
            id="location-filter"
            type="text"
            placeholder="Filter by area or address…"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="filter-input"
          />
          {hasActiveFilters && (
            <button
              type="button"
              className="filter-clear-btn"
              onClick={handleClearFilters}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="listings-toolbar">
        <p className="listings-count" aria-live="polite">
          {loading
            ? 'Loading…'
            : `${displayCount} listing${displayCount === 1 ? '' : 's'} found`}
        </p>
      </div>

      {loading ? (
        <ListingSkeleton count={6} />
      ) : displayCount === 0 ? (
        <div className="listings-empty">
          <div className="listings-empty__icon" aria-hidden="true">
            🍽️
          </div>
          <h2>No listings match</h2>
          <p>
            {hasActiveFilters
              ? 'Try broadening your search or clearing filters to see more surplus food.'
              : usingDemo
                ? 'Sample data has no matches for these filters.'
                : 'There is no surplus food posted right now. Check back soon or post a donation.'}
          </p>
          <div className="listings-empty__actions">
            {hasActiveFilters && (
              <button
                type="button"
                className="listings-btn listings-btn--secondary"
                onClick={handleClearFilters}
              >
                Clear filters
              </button>
            )}
            <Link to="/register" className="listings-btn listings-btn--primary">
              Donate food
            </Link>
          </div>
        </div>
      ) : (
        <div className="listings-container">
          {listings.map((listing) => (
            <ListingCard
              key={listing._id}
              listing={listing}
              onUpdate={fetchListings}
              isDemo={usingDemo}
            />
          ))}
        </div>
      )}
    </main>
  );
};

export default Listings;
