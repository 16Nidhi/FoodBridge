import axios from 'axios';
import { Donation } from '../types';

const BASE_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${BASE_URL}/api/`,
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
  api.post('auth/login', { email, password });

export const authRegister = (data: Record<string, string>) =>
  api.post('auth/register', data);

export const getMe = () => api.get('auth/me');

export const updateUserProfile = (data: { name?: string; location?: string }) =>
  api.patch('auth/me', data);

// ─── Donations ───────────────────────────────────────
export const createDonation = (data: {
  foodItem: string;
  quantity: string;
  pickupLocation: string;
  pickupTime: string;
}) => api.post('donations', data);

export const getAllDonations = async (params: { search?: string; foodType?: string; location?: string } = {}): Promise<Donation[]> => {
  const res = await api.get('donations', { params });
  return res.data.donations;
};

export const getMyDonations = async (): Promise<Donation[]> => {
  const res = await api.get('donations/my');
  return res.data.donations;
};

export const getDonationById = async (id: string): Promise<Donation> => {
  const res = await api.get(`donations/${id}`);
  return res.data.donation;
};

export const claimDonation = (id: string) => api.patch(`donations/${id}/claim`);

export const completeDonation = (id: string) => api.patch(`donations/${id}/complete`);

export const updateDonation = (id: string, data: Partial<Donation>) => api.put(`donations/${id}`, data);

export const deleteDonation = (id: string) => api.delete(`donations/${id}`);


// ─── Ratings ─────────────────────────────────────────────────
export const addRating = (data: { ratedUserId: string; donationId: string; rating: number; review?: string }) =>
  api.post('ratings', data);

export const getUserRatings = (userId: string) =>
  api.get(`ratings/${userId}`);

// ─── Admin ───────────────────────────────────────────────────
export const adminGetUsers = (role?: string) =>
  api.get('admin/users', { params: role ? { role } : {} });

export const adminGetDonations = (status?: string) =>
  api.get('admin/donations', { params: status ? { status } : {} });

export const adminGetStats = () => api.get('admin/stats');

export const adminGetVerifications = (status?: string) =>
  api.get('admin/verifications', { params: status ? { status } : {} });

export const adminReviewVerification = (id: string, status: 'approved' | 'rejected') =>
  api.patch(`admin/verifications/${id}`, { status });

export const adminUpdateUserStatus = (id: string, status: 'active' | 'suspended') =>
  api.patch(`admin/users/${id}/status`, { status });


export const adminUpdateUserVerification = (id: string, verificationStatus: 'approved' | 'rejected') =>
  api.patch(`admin/users/${id}/verify`, { verificationStatus });

// ─── Verifications (Volunteer) ────────────────────────────────
export const submitVerification = (idDocument: string) =>
  api.post('verifications', { idDocument });

// ─── Notifications ──────────────────────────────────────────
export const getMyNotifications = () => api.get('notifications');

export const markNotificationAsRead = (id: string) => api.patch(`notifications/${id}/read`);

export const markAllNotificationsAsRead = () => api.patch('notifications/read-all');

export default api;