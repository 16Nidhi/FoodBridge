import React from 'react';
import { useSelector } from 'react-redux';
import DonorDashboard from '../components/donor/DonorDashboard';
import NgoDashboard from '../components/ngo/NgoDashboard';
import VolunteerDashboard from '../components/volunteer/VolunteerDashboard';
import AdminDashboard from '../components/admin/AdminDashboard';

const Dashboard: React.FC = () => {
    const userRole = useSelector((state: any) => state.auth.user?.role);

    return (
        <div>
            {userRole === 'donor'     && <DonorDashboard />}
            {userRole === 'ngo'       && <NgoDashboard />}
            {userRole === 'volunteer' && <VolunteerDashboard />}
            {userRole === 'admin'     && <AdminDashboard />}
            {!userRole && (
                <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',fontFamily:'Inter,sans-serif',color:'#64748B'}}>
                    <p>Please log in to view your dashboard.</p>
                </div>
            )}
        </div>
    );
};

export default Dashboard;