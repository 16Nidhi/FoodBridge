import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { login } from '../store/slices/authSlice';
import './Login.css';
import api from '../services/api';

const ID_TYPES = [
  { value: 'aadhar',          label: '🪪 Aadhar Card' },
  { value: 'student_id',      label: '🎓 Student ID' },
  { value: 'driving_license', label: '🚗 Driving License' },
];

/* Helpers */
const genOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const Register: React.FC = () => {
  const [step, setStep]   = useState<1 | 2 | 3>(1);
  const [form, setForm]   = useState({
    name: '', email: '', password: '', confirmPassword: '', role: 'donor',
    phone: '', otp: '', idType: 'aadhar', idNumber: '',
  });
  const [generatedOTP, setGeneratedOTP] = useState('');
  const [otpSent, setOtpSent]           = useState(false);
  const [otpVerified, setOtpVerified]   = useState(false);
  const [idFile, setIdFile]             = useState<File | null>(null);
  const [idPreview, setIdPreview]       = useState<string | null>(null);
  const [dragOver, setDragOver]         = useState(false);
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const dispatch  = useDispatch();
  const navigate  = useNavigate();

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  /* ── Step 1: basic info ── */
  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (form.role === 'volunteer') { setStep(2); }
    else {
      setLoading(true);
      try {
        const res = await api.post('/auth/register', {
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          phone: form.phone,
        });
        const { token, user } = res.data;
        localStorage.setItem('token', token);
        dispatch(login({
          _id: user._id,
          name: user.name,
          role: user.role,
          verificationStatus: user.verificationStatus,
          email: user.email,
          phone: user.phone,
        }));
        navigate(`/${user.role}-dashboard`);
      } catch (err: any) {
        console.error('Register error (step1)', err);
        setError((err.response && err.response.data && err.response.data.message) || err.message || 'Registration failed');
      } finally {
        setLoading(false);
      }
    }
  };

  /* ── Step 2: phone + OTP ── */
  const handleSendOTP = () => {
    if (!/^\+?[0-9]{10,13}$/.test(form.phone.replace(/[\s-]/g, ''))) {
      setError('Enter a valid phone number.'); return;
    }
    setError('');
    const otp = genOTP();
    setGeneratedOTP(otp);
    setOtpSent(true);
    // In production this would send an SMS; here we display for demo purposes
  };

  const handleVerifyOTP = () => {
    if (form.otp === generatedOTP) { setOtpVerified(true); setError(''); }
    else { setError('Incorrect OTP. Please try again.'); }
  };

  const handleStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!otpVerified) { setError('Please verify your phone number first.'); return; }
    setStep(3);
  };

  /* ── Step 3: ID upload ── */
  const handleIdFile = (file: File | null) => {
    if (!file) return;
    setIdFile(file);
    const reader = new FileReader();
    reader.onload = ev => setIdPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleStep3 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!idFile) { setError('Please upload a valid ID document.'); return; }
    if (!form.idNumber.trim()) { setError('Please enter your ID number.'); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        phone: form.phone,
        idType: form.idType,
        idNumber: form.idNumber,
      });
      const { token, user } = res.data;
      localStorage.setItem('token', token);
        dispatch(login({
          _id: user._id,
          name: user.name,
          role: user.role,
          verificationStatus: user.verificationStatus,
          email: user.email,
          phone: user.phone || form.phone,
        }));
      navigate(`/${user.role}-dashboard`);
    } catch (err: any) {
      console.error('Register error (step3)', err);
      setError((err.response && err.response.data && err.response.data.message) || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const STEPS = ['Basic Info', 'Phone Verify', 'ID Upload'];

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: form.role === 'volunteer' && step > 1 ? 520 : 440 }}>
        <div className="auth-brand">🌿 FoodBridge</div>
        <h2 className="auth-title">Create account</h2>
        <p className="auth-subtitle">Join the food rescue movement</p>

        {form.role === 'volunteer' && (
          <div className="register-steps">
            {STEPS.map((label, i) => {
              const idx = i + 1;
              const done = step > idx;
              const active = step === idx;
              return (
                <React.Fragment key={label}>
                  <div className={`step-item ${active ? 'active' : ''} ${done ? 'done' : ''}`}>
                    <div className="step-circle">
                      {done ? '✓' : idx}
                    </div>
                    <span className="step-label">
                      {label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="step-connector" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {error && <div className="auth-error">{error}</div>}

        {step === 1 && (
          <form onSubmit={handleStep1}>
            <div className="auth-field">
              <label htmlFor="name">Full name</label>
              <input id="name" name="name" value={form.name} onChange={handle} placeholder="Your full name" required />
            </div>
            <div className="auth-field">
              <label htmlFor="email">Email address</label>
              <input id="email" name="email" type="email" value={form.email} onChange={handle} placeholder="you@example.com" required />
            </div>
            <div className="auth-field">
              <label htmlFor="password">Password</label>
              <input id="password" name="password" type="password" value={form.password} onChange={handle} placeholder="Choose a password" required />
            </div>
            <div className="auth-field">
              <label htmlFor="confirmPassword">Confirm password</label>
              <input id="confirmPassword" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handle} placeholder="Repeat password" required />
            </div>
            <div className="auth-field">
              <label htmlFor="role">Register as</label>
              <select id="role" name="role" value={form.role} onChange={handle}>
                <option value="donor">Donor</option>
                <option value="ngo">NGO</option>
                <option value="volunteer">Volunteer</option>
              </select>
            </div>
            <div className="auth-field">
              <label htmlFor="phone">Phone (optional)</label>
              <input id="phone" name="phone" type="tel" value={form.phone} onChange={handle} placeholder="+919876543210" />
            </div>
            <button type="submit" className="auth-submit" disabled={loading}>{loading ? 'Creating...' : 'Create account'}</button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleStep2}>
            <div className="auth-field">
              <label htmlFor="phone-verify">Phone number</label>
              <input id="phone-verify" name="phone" type="tel" value={form.phone} onChange={handle} placeholder="+919876543210" required />
            </div>
            {!otpSent ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="auth-submit" onClick={handleSendOTP}>Send OTP</button>
                <button type="button" className="auth-submit" onClick={() => setStep(1)} style={{ background: 'var(--border-color)', color: 'var(--text-primary)' }}>Back</button>
              </div>
            ) : (
              <>
                <div className="auth-field">
                  <label htmlFor="otp">Enter OTP</label>
                  <input id="otp" name="otp" value={form.otp} onChange={handle} placeholder={generatedOTP ? `Demo OTP: ${generatedOTP}` : 'Enter OTP'} required />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="submit" className="auth-submit">Verify & Continue</button>
                  <button type="button" className="auth-submit" onClick={() => { setOtpSent(false); setGeneratedOTP(''); }} style={{ background: 'var(--border-color)', color: 'var(--text-primary)' }}>Resend</button>
                </div>
              </>
            )}
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleStep3}>
            <div className="auth-field">
              <label htmlFor="idType">ID Type</label>
              <select id="idType" name="idType" value={form.idType} onChange={handle}>
                {ID_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="auth-field">
              <label htmlFor="idNumber">ID Number</label>
              <input id="idNumber" name="idNumber" value={form.idNumber} onChange={handle} placeholder="ID number" required />
            </div>
            <div className={`id-upload-area ${dragOver ? 'drag-over' : ''}`} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer?.files?.[0]; if (f) handleIdFile(f); }} onClick={() => fileRef.current?.click()}>
              <input ref={fileRef} type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={e => handleIdFile(e.target.files ? e.target.files[0] : null)} />
              <div>Click or drag an ID document here to upload</div>
              {idPreview && <img src={idPreview} alt="ID preview" className="id-preview" />}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button type="submit" className="auth-submit">Finish & Register</button>
              <button type="button" className="auth-submit" onClick={() => setStep(2)} style={{ background: 'var(--border-color)', color: 'var(--text-primary)' }}>Back</button>
            </div>
          </form>
        )}

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
