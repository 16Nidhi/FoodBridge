import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

interface RoleBasedRouteProps {
    allowedRoles: string[];
}

const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({ allowedRoles }) => {
    const { user, isAuthenticated, isLoading } = useSelector((state: any) => state.auth);

    if (isLoading) return null;

    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }

    if (!allowedRoles.includes(user.role)) {
        // Redirect unauthorized users to their actual dashboard or home
        const baseDashboard = user.role ? `/${user.role}-dashboard` : '/';
        return <Navigate to={baseDashboard} replace />;
    }

    return <Outlet />;
};

export default RoleBasedRoute;