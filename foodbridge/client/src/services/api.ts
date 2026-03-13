import axios from 'axios';
import type { FoodListing } from '../types';

const api = axios.create({
  baseURL: (import.meta as any).env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Auth ────────────────────────────────────────────────────
export const authLogin = (email: string, password: string) =>
  api.post('/auth/login', { email, password });

export const authRegister = (data: Record<string, string>) =>
  api.post('/auth/register', data);

export const getMe = () => api.get('/auth/me');

// ─── Donations (Donor) ───────────────────────────────────────
export const createDonation = (data: {
  foodType: string; quantity: string; location: string; preparedTime: string;
}) => api.post('/donations', data);

export const getMyDonations = () => api.get('/donations/my-donations');

// ─── Donations (NGO / Volunteer / Admin) ─────────────────────
export const getAllDonations = () => api.get('/donations');

const mapDonationToFoodListing = (donation: any): FoodListing => ({
  id: donation._id || donation.id || '',
  donorId: donation.donorId?._id || donation.donorId || '',
  description: donation.description || donation.foodType || 'Food Listing',
  quantity: Number.parseFloat(String(donation.quantity)) || 0,
  pickupLocation: donation.location || donation.pickupLocation || '',
  expiryDate: donation.expiryTime
    ? new Date(donation.expiryTime)
    : donation.createdAt
      ? new Date(donation.createdAt)
      : new Date(),
});

export const fetchFoodListings = async (): Promise<FoodListing[]> => {
  const res = await getAllDonations();
  const donations = Array.isArray(res.data?.donations)
    ? res.data.donations
    : Array.isArray(res.data)
      ? res.data
      : [];

  return donations.map(mapDonationToFoodListing);
};

/** NGO accepts a donation and optionally assigns a volunteer */
export const acceptDonation = (donationId: string, volunteerId?: string) =>
  api.patch('/donations/accept', { donationId, ...(volunteerId ? { volunteerId } : {}) });

/** Volunteer self-accepts an open pickup */
export const volunteerAcceptPickup = (donationId: string) =>
  api.patch('/donations/volunteer-accept', { donationId });

/** Volunteer marks food as picked up from donor */
export const markPickedUp = (donationId: string) =>
  api.patch('/donations/picked-up', { donationId });

/** NGO confirms food was delivered */
export const markDelivered = (donationId: string) =>
  api.patch('/donations/delivered', { donationId });

// ─── Ratings ─────────────────────────────────────────────────
export const addRating = (volunteerId: string, rating: number, review?: string) =>
  api.post('/ratings', { volunteerId, rating, review });

export const getVolunteerRatings = (volunteerId: string) =>
  api.get(`/ratings/${volunteerId}`);

// ─── Admin ───────────────────────────────────────────────────
export const adminGetUsers = (role?: string) =>
  api.get('/admin/users', { params: role ? { role } : {} });

export const adminGetDonations = (status?: string) =>
  api.get('/admin/donations', { params: status ? { status } : {} });

export const adminGetStats = () => api.get('/admin/stats');

export const adminGetVerifications = (status?: string) =>
  api.get('/admin/verifications', { params: status ? { status } : {} });

export const adminReviewVerification = (id: string, status: 'approved' | 'rejected') =>
  api.patch(`/admin/verifications/${id}`, { status });

export const adminUpdateUserStatus = (id: string, status: 'active' | 'suspended') =>
  api.patch(`/admin/users/${id}/status`, { status });

export const adminUpdateUserVerification = (id: string, verificationStatus: 'approved' | 'rejected') =>
  api.patch(`/admin/users/${id}/verify`, { verificationStatus });

// ─── Verifications (Volunteer) ────────────────────────────────
export const submitVerification = (idDocument: string) =>
  api.post('/verifications', { idDocument });

export default api;