import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ProtectedRoute from './ProtectedRoute';
import RoleBasedRoute from './RoleBasedRoute';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Listings from '../pages/Listings';
import DonorDashboard     from '../pages/dashboards/DonorDashboard';
import VolunteerDashboard from '../pages/dashboards/VolunteerDashboard';
import NgoDashboard       from '../pages/dashboards/NgoDashboard';
import AdminDashboard     from '../pages/dashboards/AdminDashboard';

/* Redirects /dashboard → /<role>-dashboard based on logged-in user */
const DashboardRouter: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useSelector((state: any) => state.auth);
  
  if (isLoading) return null;
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  
  const roleMap: Record<string, string> = {
    donor: '/donor-dashboard', 
    volunteer: '/volunteer-dashboard',
    ngo: '/ngo-dashboard', 
    admin: '/admin-dashboard',
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
      
      {/* Protected & Role-Based Routes */}
      <Route element={<ProtectedRoute />}>
        {/* Donor */}
        <Route element={<RoleBasedRoute allowedRoles={['donor']} />}>
          <Route path="/donor-dashboard" element={<DonorDashboard />} />
        </Route>
        
        {/* Volunteer */}
        <Route element={<RoleBasedRoute allowedRoles={['volunteer']} />}>
          <Route path="/volunteer-dashboard" element={<VolunteerDashboard />} />
        </Route>
        
        {/* NGO */}
        <Route element={<RoleBasedRoute allowedRoles={['ngo']} />}>
          <Route path="/ngo-dashboard" element={<NgoDashboard />} />
        </Route>
        
        {/* Admin */}
        <Route element={<RoleBasedRoute allowedRoles={['admin']} />}>
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
        </Route>
        
        {/* /dashboard → redirects to role page */}
        <Route path="/dashboard"           element={<DashboardRouter />} />
        <Route path="/dashboard/*"         element={<DashboardRouter />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;