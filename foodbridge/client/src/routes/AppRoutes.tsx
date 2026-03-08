import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Listings from '../pages/Listings';
import DonorDashboard     from '../pages/dashboards/DonorDashboard';
import VolunteerDashboard from '../pages/dashboards/VolunteerDashboard';
import NgoDashboard       from '../pages/dashboards/NgoDashboard';
import AdminDashboard     from '../pages/dashboards/AdminDashboard';

/* Redirects /dashboard → /dashboard/<role> based on logged-in user */
const DashboardRouter: React.FC = () => {
  const user = useSelector((state: any) => state.auth.user);
  if (!user) return <Navigate to="/login" replace />;
  const roleMap: Record<string, string> = {
    donor: '/dashboard/donor', volunteer: '/dashboard/volunteer',
    ngo: '/dashboard/ngo', admin: '/dashboard/admin',
  };
  return <Navigate to={roleMap[user.role] ?? '/login'} replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/"                    element={<Home />} />
      <Route path="/login"               element={<Login />} />
      <Route path="/register"            element={<Register />} />
      <Route path="/listings"            element={<Listings />} />
      {/* Role-specific dashboard pages */}
      <Route path="/dashboard/donor"     element={<DonorDashboard />} />
      <Route path="/dashboard/volunteer" element={<VolunteerDashboard />} />
      <Route path="/dashboard/ngo"       element={<NgoDashboard />} />
      <Route path="/dashboard/admin"     element={<AdminDashboard />} />
      {/* /dashboard → redirects to role page */}
      <Route path="/dashboard"           element={<DashboardRouter />} />
      <Route path="/dashboard/*"         element={<DashboardRouter />} />
    </Routes>
  );
};

export default AppRoutes;