import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute: React.FC = () => {
    const { isAuthenticated, isLoading } = useSelector((state: any) => state.auth);

    if (isLoading) return null; // App.tsx handles global loading

    // If no authenticated user, redirect to login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;