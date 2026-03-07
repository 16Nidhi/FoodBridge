import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import Listings from '../pages/Listings';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';

const AppRoutes = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<><Navbar /><Home /><Footer /></>} />
                <Route path="/login" element={<><Navbar /><Login /><Footer /></>} />
                <Route path="/register" element={<><Navbar /><Register /><Footer /></>} />
                <Route path="/listings" element={<><Navbar /><Listings /><Footer /></>} />
                {/* Dashboard renders its own full-page layout (sidebar + topbar) */}
                <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
        </Router>
    );
};

export default AppRoutes;