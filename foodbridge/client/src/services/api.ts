import axios from 'axios';

const api = axios.create({
  // Use Vite env variable (prefixed with VITE_) in the browser instead of process.env
  baseURL: (import.meta as any).env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Example API calls
export const fetchFoodListings = async () => {
  const response = await api.get('/listings');
  return response.data;
};

export const fetchPickupSchedules = async () => {
  const response = await api.get('/pickups');
  return response.data;
};

export const createFoodListing = async (data) => {
  const response = await api.post('/listings', data);
  return response.data;
};

export const fetchUserProfile = async (userId) => {
  const response = await api.get(`/users/${userId}`);
  return response.data;
};

export default api;