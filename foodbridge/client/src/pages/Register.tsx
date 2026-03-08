import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { login } from '../store/slices/authSlice';
import './Login.css';

const Register: React.FC = () => {
  const [form, setForm] = useState({ name:'', email:'', password:'', confirmPassword:'', role:'donor' });
  const [error, setError] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    dispatch(login({ id: Date.now().toString(), name: form.name, role: form.role }));
    navigate('/dashboard');
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">🌿 FoodBridge</div>
        <h2 className="auth-title">Create account</h2>
        <p className="auth-subtitle">Join the food rescue movement</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label>Full Name</label>
            <input name="name" type="text" value={form.name} onChange={handle} placeholder="Your name" required />
          </div>
          <div className="auth-field">
            <label>Email address</label>
            <input name="email" type="email" value={form.email} onChange={handle} placeholder="you@example.com" required autoComplete="email" />
          </div>
          <div className="auth-field">
            <label>I am a…</label>
            <select name="role" value={form.role} onChange={handle}>
              <option value="donor">🍽️ Food Donor (Restaurant / Individual)</option>
              <option value="volunteer">🚴 Volunteer</option>
              <option value="ngo">🏢 NGO / Shelter</option>
            </select>
          </div>
          <div className="auth-field">
            <label>Password</label>
            <input name="password" type="password" value={form.password} onChange={handle} placeholder="••••••••" required autoComplete="new-password" />
          </div>
          <div className="auth-field">
            <label>Confirm Password</label>
            <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handle} placeholder="••••••••" required autoComplete="new-password" />
          </div>
          <button type="submit" className="auth-submit">🌱 Create Account</button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;