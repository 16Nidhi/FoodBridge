import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { login } from '../store/slices/authSlice';
import './Login.css';
import api from '../services/api';

// Demo role credentials so reviewers can jump straight to each dashboard
const DEMO_CREDENTIALS: Record<string, { id: string; name: string; role: string }> = {
  'donor@demo.com':     { id: '1', name: 'Arjun Sharma',  role: 'donor' },
  'volunteer@demo.com': { id: '2', name: 'Priya Patel',   role: 'volunteer' },
  'ngo@demo.com':       { id: '3', name: 'Help Foundation', role: 'ngo' },
  'admin@demo.com':     { id: '4', name: 'Site Admin',    role: 'admin' },
};

const Login: React.FC = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const dispatch   = useDispatch();
  const navigate   = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      dispatch(login({
        id: user._id,
        name: user.name,
        role: user.role,
        verificationStatus: user.verificationStatus,
        email: user.email,
        phone: user.phone,
      }));
      navigate(`/${user.role}-dashboard`);
    } catch (err: any) {
      // Fallback to demo credentials for quick previews
      const match = DEMO_CREDENTIALS[email.toLowerCase()];
      if (match) {
        dispatch(login(match));
        navigate(`/${match.role}-dashboard`);
        return;
      }
      setError(err.response?.data?.message || 'Login failed.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">🌿 FoodBridge</div>
        <h2 className="auth-title">Welcome back</h2>
        <p className="auth-subtitle">Sign in to your account</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="email">Email address</label>
            <input
              id="email" type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" required autoComplete="email"
            />
          </div>
          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <input
              id="password" type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required autoComplete="current-password"
            />
          </div>
          <button type="submit" className="auth-submit">🔓 Sign In</button>
        </form>

        <p className="auth-footer">
          Don’t have an account? <Link to="/register">Register</Link>
        </p>
        <p className="auth-footer" style={{marginTop:10,fontSize:'0.78rem',color:'#94a3b8'}}>
          Demo: donor@demo.com · volunteer@demo.com · ngo@demo.com · admin@demo.com
        </p>
      </div>
    </div>
  );
};

export default Login;