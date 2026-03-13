import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AppRoutes from './routes/AppRoutes';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import { getMe } from './services/api';
import { setUser, setLoading } from './store/slices/authSlice';

const App: React.FC = () => {
  const dispatch = useDispatch();
  const { user, isLoading } = useSelector((state: any) => state.auth);

  useEffect(() => {
    let mounted = true;

    const bootstrapUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        if (mounted) dispatch(setLoading(false));
        return;
      }
      if (user) {
        if (mounted) dispatch(setLoading(false));
        return;
      }

      try {
        const res = await getMe();
        const me = res.data?.user;
        if (!mounted || !me) return;

        dispatch(setUser({
          id: me._id,
          name: me.name,
          role: me.role,
          verificationStatus: me.verificationStatus,
          email: me.email,
          phone: me.phone,
        }));
      } catch {
        localStorage.removeItem('token');
        if (mounted) dispatch(setUser(null));
      } finally {
        if (mounted) dispatch(setLoading(false));
      }
    };

    bootstrapUser();

    return () => {
      mounted = false;
    };
  }, [dispatch, user]);

  if (isLoading) {
    return <div className="loading-screen" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.2rem', color: '#64748b' }}>Loading FoodBridge...</div>;
  }

  return (
    <Router>
      <div className="app">
        <Navbar />
        <AppRoutes />
        <Footer />
      </div>
    </Router>
  );
};

export default App;