import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { login } from '../store/slices/authSlice';
import './Login.css';

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
  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (form.role === 'volunteer') { setStep(2); }
    else {
      dispatch(login({ id: Date.now().toString(), name: form.name, role: form.role }));
      navigate('/dashboard');
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
    await new Promise(r => setTimeout(r, 800)); // simulate API
    dispatch(login({
      id: Date.now().toString(),
      name: form.name,
      role: 'volunteer',
      verificationStatus: 'pending',
      phone: form.phone,
    }));
    setLoading(false);
    navigate('/dashboard');
  };

  /* ── Step indicators ── */
  const STEPS = ['Basic Info', 'Phone Verify', 'ID Upload'];

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: form.role === 'volunteer' && step > 1 ? 520 : 440 }}>
        <div className="auth-brand">🌿 FoodBridge</div>
        <h2 className="auth-title">Create account</h2>
        <p className="auth-subtitle">Join the food rescue movement</p>

        {/* Step indicator (volunteers only) */}
        {form.role === 'volunteer' && (
          <div style={{ display:'flex', alignItems:'center', gap:0, marginBottom:24, marginTop:4 }}>
            {STEPS.map((label, i) => {
              const idx = i + 1;
              const done   = step > idx;
              const active = step === idx;
              return (
                <React.Fragment key={label}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, flex:1 }}>
                    <div style={{
                      width:30, height:30, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:'0.8rem', fontWeight:700,
                      background: done ? '#10B981' : active ? '#2563EB' : '#E2E8F0',
                      color: done || active ? '#fff' : '#94A3B8',
                      transition: 'all 0.3s',
                    }}>
                      {done ? '✓' : idx}
                    </div>
                    <span style={{ fontSize:'0.65rem', fontWeight:600, color: active ? '#2563EB' : done ? '#10B981' : '#94A3B8', whiteSpace:'nowrap' }}>
                      {label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div style={{ height:2, flex:1, background: step > idx ? '#10B981' : '#E2E8F0', transition:'background 0.3s', marginBottom:20 }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {error && <div className="auth-error">{error}</div>}

        {/* ═══ STEP 1 ═══ */}
        {step === 1 && (
          <form onSubmit={handleStep1}>
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
            {form.role === 'volunteer' && (
              <div style={{ background:'rgba(37,99,235,0.06)', border:'1px solid rgba(37,99,235,0.2)', borderRadius:12, padding:'12px 16px', marginBottom:8, fontSize:'0.82rem', color:'#1E3A8A' }}>
                <strong>ℹ️ Volunteer Registration</strong> — you'll complete phone OTP verification and upload a valid ID. You can accept up to 3 pickups before your account is verified by an admin.
              </div>
            )}
            <button type="submit" className="auth-submit">
              {form.role === 'volunteer' ? '→ Next: Phone Verification' : '🌱 Create Account'}
            </button>
          </form>
        )}

        {/* ═══ STEP 2 — Phone OTP ═══ */}
        {step === 2 && (
          <form onSubmit={handleStep2}>
            <div className="auth-field">
              <label>Phone Number</label>
              <div style={{ display:'flex', gap:8 }}>
                <input name="phone" type="tel" value={form.phone} onChange={handle}
                  placeholder="+91 98765 43210" style={{ flex:1 }} required />
                <button type="button" className="auth-submit"
                  style={{ padding:'10px 16px', width:'auto', marginTop:0, fontSize:'0.82rem', whiteSpace:'nowrap' }}
                  onClick={handleSendOTP}>
                  {otpSent ? 'Resend' : 'Send OTP'}
                </button>
              </div>
            </div>

            {otpSent && !otpVerified && (
              <>
                {/* Dev-only OTP display */}
                <div style={{ background:'#FEF3C7', border:'1px solid #F59E0B', borderRadius:10, padding:'10px 14px', marginBottom:12, fontSize:'0.82rem', color:'#92400E' }}>
                  <strong>📱 Demo OTP:</strong> <span style={{ fontFamily:'monospace', fontSize:'1rem', fontWeight:700, letterSpacing:4 }}>{generatedOTP}</span>
                  <div style={{ fontSize:'0.72rem', marginTop:4 }}>(In production, this would be sent via SMS)</div>
                </div>
                <div className="auth-field">
                  <label>Enter 6-digit OTP</label>
                  <div style={{ display:'flex', gap:8 }}>
                    <input name="otp" type="text" value={form.otp} onChange={handle}
                      placeholder="------" maxLength={6} style={{ flex:1, letterSpacing:6, textAlign:'center', fontSize:'1.1rem', fontFamily:'monospace' }} />
                    <button type="button" className="auth-submit"
                      style={{ padding:'10px 16px', width:'auto', marginTop:0, fontSize:'0.82rem', background:'#059669', whiteSpace:'nowrap' }}
                      onClick={handleVerifyOTP}>
                      Verify
                    </button>
                  </div>
                </div>
              </>
            )}

            {otpVerified && (
              <div style={{ background:'#D1FAE5', border:'1px solid #10B981', borderRadius:10, padding:'10px 14px', marginBottom:12, fontSize:'0.85rem', color:'#065F46', display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:'1.2rem' }}>✅</span> Phone number verified!
              </div>
            )}

            <div style={{ display:'flex', gap:10, marginTop:8 }}>
              <button type="button" className="auth-submit"
                style={{ background:'#F1F5F9', color:'#475569', flex:1 }}
                onClick={() => { setStep(1); setError(''); }}>
                ← Back
              </button>
              <button type="submit" className="auth-submit" style={{ flex:2 }}
                disabled={!otpVerified}>
                → Next: Upload ID
              </button>
            </div>
          </form>
        )}

        {/* ═══ STEP 3 — ID Upload ═══ */}
        {step === 3 && (
          <form onSubmit={handleStep3}>
            <div className="auth-field">
              <label>ID Document Type</label>
              <select name="idType" value={form.idType} onChange={handle}>
                {ID_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="auth-field">
              <label>ID Number</label>
              <input name="idNumber" type="text" value={form.idNumber} onChange={handle}
                placeholder="e.g. 1234-5678-9012" required />
            </div>
            <div className="auth-field">
              <label>Upload ID Document</label>
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); handleIdFile(e.dataTransfer.files[0]); }}
                style={{
                  border: `2px dashed ${dragOver ? '#10B981' : idFile ? '#10B981' : '#E2E8F0'}`,
                  borderRadius: 12, padding:'20px 16px', textAlign:'center', cursor:'pointer',
                  background: dragOver ? 'rgba(16,185,129,0.04)' : idFile ? 'rgba(16,185,129,0.04)' : '#FAFBFF',
                  transition:'all 0.25s',
                }}
              >
                {idPreview ? (
                  <img src={idPreview} alt="ID preview"
                    style={{ maxHeight:120, maxWidth:'100%', borderRadius:8, objectFit:'contain' }} />
                ) : (
                  <>
                    <div style={{ fontSize:'2rem', marginBottom:6 }}>📄</div>
                    <p style={{ fontSize:'0.85rem', color:'#64748B' }}>
                      <span style={{ color:'#2563EB', fontWeight:600 }}>Click to upload</span> or drag & drop
                    </p>
                    <p style={{ fontSize:'0.72rem', color:'#94A3B8', marginTop:4 }}>PNG, JPG, PDF up to 10 MB</p>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display:'none' }}
                onChange={e => handleIdFile(e.target.files?.[0] ?? null)} />
              {idFile && (
                <div style={{ fontSize:'0.78rem', color:'#059669', marginTop:6 }}>
                  ✅ {idFile.name}
                </div>
              )}
            </div>

            <div style={{ background:'rgba(249,115,22,0.06)', border:'1px solid rgba(249,115,22,0.2)', borderRadius:10, padding:'10px 14px', marginBottom:12, fontSize:'0.78rem', color:'#92400E' }}>
              🔍 Your ID will be reviewed by an admin. Until verified, you can accept up to <strong>3 pickups</strong>. Verified volunteers have no limit.
            </div>

            <div style={{ display:'flex', gap:10, marginTop:8 }}>
              <button type="button" className="auth-submit"
                style={{ background:'#F1F5F9', color:'#475569', flex:1 }}
                onClick={() => { setStep(2); setError(''); }}>
                ← Back
              </button>
              <button type="submit" className="auth-submit" style={{ flex:2 }} disabled={loading}>
                {loading ? '⏳ Submitting…' : '🌱 Complete Registration'}
              </button>
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
