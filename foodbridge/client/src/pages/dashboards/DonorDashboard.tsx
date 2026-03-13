import React, { useState, useRef, ChangeEvent, FormEvent, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, Title, Tooltip, Legend,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { logout } from '../../store/slices/authSlice';
import { getMyDonations, createDonation as apiCreateDonation } from '../../services/api';
import '../../components/common/Dashboard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

/* ─── Types ─────────────────────────────────────────────────── */
interface Donation {
  id: string;
  title: string;
  description: string;
  quantity: string;
  unit: string;
  category: string;
  expiryDate: string;
  pickupLocation: string;
  status: 'active' | 'claimed' | 'expired';
  imageURL: string | null;
  createdAt: string;
}

/* ─── Map backend donation → frontend Donation ────────────── */
const mapApiStatus = (s: string): Donation['status'] => {
  if (s === 'posted') return 'active';
  if (s === 'accepted' || s === 'picked_up' || s === 'delivered') return 'claimed';
  return 'expired';
};

const mapApiDonation = (d: any): Donation => ({
  id: d._id,
  title: d.foodType,
  description: d.description || '',
  quantity: d.quantity,
  unit: '',
  category: d.category || 'Other',
  expiryDate: d.expiryTime ? d.expiryTime.slice(0, 10) : (d.createdAt?.slice(0, 10) || ''),
  pickupLocation: d.location,
  status: mapApiStatus(d.status),
  imageURL: null,
  createdAt: d.createdAt?.slice(0, 10) || '',
});

const MONTHS = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
const DONATIONS_OVER_TIME = [3, 5, 4, 7, 6, 8, 9];
const CLAIMED_OVER_TIME   = [3, 4, 3, 6, 5, 7, 8];

const CATEGORY_COLORS: Record<string, string> = {
  'Cooked Food':'#10B981','Bakery':'#F97316','Produce':'#2563EB',
  'Fruits':'#8B5CF6','Dairy':'#EF4444','Packaged':'#F59E0B',
};

const EMOJI_MAP: Record<string,string> = {
  'Cooked Biryani':'🍛','Fresh Bread & Rolls':'🍞','Mixed Vegetables':'🥦',
  'Dal & Rice':'🥘','Fruit Platter':'🍎','Dairy Products':'🥛',
};
const getEmoji = (t: string) => EMOJI_MAP[t] || '🍽️';

/* ─── Badge helper ───────────────────────────────────────────── */
const statusBadge = (s: Donation['status']) =>
  s === 'active' ? 'badge-orange' : s === 'claimed' ? 'badge-green' : 'badge-gray';

/* ─── Sidebar nav items ──────────────────────────────────────── */
type Tab = 'overview' | 'donate' | 'history' | 'profile' | 'settings';

/* ═══════════════════════════════════════════════════════════════
   DONOR DASHBOARD PAGE
═══════════════════════════════════════════════════════════════ */
const DonorDashboard: React.FC = () => {
  const user       = useSelector((state: any) => state.auth.user);
  const dispatch   = useDispatch();
  const navigate   = useNavigate();

  const [tab, setTab]       = useState<Tab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [donations, setDonations]     = useState<Donation[]>([]);
  const [loading, setLoading]         = useState(false);
  const [apiError, setApiError]       = useState<string | null>(null);
  const [editId, setEditId]           = useState<string | null>(null);
  const [previewURL, setPreviewURL]   = useState<string | null>(null);
  const [dragOver, setDragOver]       = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [toastMsg, setToastMsg]       = useState<string | null>(null);
  const [toastType, setToastType]     = useState<'success' | 'error'>('success');
  const fileRef = useRef<HTMLInputElement>(null);

  const blank = { title:'', description:'', quantity:'', unit:'kg', category:'Cooked Food', expiryDate:'', pickupLocation:'' };
  const [form, setForm] = useState(blank);

  const initials    = user?.name ? user.name.split(' ').map((n:string)=>n[0]).join('').toUpperCase().slice(0,2) : 'DN';
  const displayName = user?.name || 'Donor';
  const userEmail   = user?.email || 'Not provided';
  const userPhone   = user?.phone || 'Not provided';

  /* ── Fetch donations from backend ─────────────────────────── */
  useEffect(() => {
    const fetchDonations = async () => {
      setLoading(true);
      setApiError(null);
      try {
        const res = await getMyDonations();
        setDonations((res.data.donations || []).map(mapApiDonation));
      } catch (err: any) {
        setApiError(err.response?.data?.message || 'Failed to load donations.');
      } finally {
        setLoading(false);
      }
    };
    fetchDonations();
  }, []);

  /* toast helper */
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(null), 3500);
  };

  /* handle form field changes */
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  /* image file handler */
  const handleFile = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewURL(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  /* submit — add or update */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (editId) {
      // Local edit (no backend edit endpoint)
      setDonations(prev => prev.map(d => d.id === editId ? { ...d, ...form, imageURL: previewURL } : d));
      showToast('Donation updated locally.');
      setEditId(null);
      setForm(blank);
      setPreviewURL(null);
      setSubmitting(false);
      setTab('history');
      return;
    }

    try {
      const payload = {
        foodType: form.title,
        quantity: `${form.quantity} ${form.unit}`,
        location: form.pickupLocation,
        preparedTime: new Date().toISOString(),
        description: form.description,
        category: form.category,
      };

      const res = await apiCreateDonation(payload);
      setDonations(prev => [mapApiDonation(res.data.donation), ...prev]);
      showToast('Donation submitted successfully!');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to submit donation.', 'error');
      setSubmitting(false);
      return;
    }

    setForm(blank);
    setPreviewURL(null);
    setSubmitting(false);
    setTab('history');
  };

  /* edit button */
  const startEdit = (d: Donation) => {
    setEditId(d.id);
    setForm({ title:d.title, description:d.description, quantity:d.quantity, unit:d.unit, category:d.category, expiryDate:d.expiryDate, pickupLocation:d.pickupLocation });
    setPreviewURL(d.imageURL);
    setTab('donate');
  };

  /* delete — local only */
  const deleteDonation = (id: string) => {
    setDonations(prev => prev.filter(d => d.id !== id));
    showToast('Donation removed from view.');
  };

  /* stats */
  const stats = {
    total:   donations.length,
    active:  donations.filter(d => d.status === 'active').length,
    claimed: donations.filter(d => d.status === 'claimed').length,
    units:   donations.reduce((a, d) => a + (parseFloat(d.quantity) || 0), 0),
  };

  /* chart: donations over time */
  const lineData = {
    labels: MONTHS,
    datasets: [
      { label:'Donations', data: DONATIONS_OVER_TIME, borderColor:'#10B981', backgroundColor:'rgba(16,185,129,0.12)', tension:0.4, fill:true, pointRadius:4, pointBackgroundColor:'#10B981' },
      { label:'Claimed',   data: CLAIMED_OVER_TIME,   borderColor:'#2563EB', backgroundColor:'rgba(37,99,235,0.08)',  tension:0.4, fill:true, pointRadius:4, pointBackgroundColor:'#2563EB' },
    ],
  };
  const lineOpts: any = {
    responsive:true, maintainAspectRatio:false,
    plugins:{ legend:{ position:'top' as const } },
    scales:{ x:{ grid:{display:false}, ticks:{color:'#64748B'} }, y:{ grid:{color:'rgba(0,0,0,0.04)'}, ticks:{color:'#64748B'} } },
  };

  /* chart: category doughnut */
  const catCounts: Record<string, number> = {};
  donations.forEach(d => { catCounts[d.category] = (catCounts[d.category]||0) + 1; });
  const doughnutData = {
    labels: Object.keys(catCounts),
    datasets:[{ data: Object.values(catCounts), backgroundColor: Object.keys(catCounts).map(c => CATEGORY_COLORS[c]||'#94A3B8'), borderWidth:2, borderColor:'#fff' }],
  };
  const doughnutOpts: any = {
    responsive:true, maintainAspectRatio:false,
    plugins:{ legend:{ position:'right' as const, labels:{ font:{size:11}, boxWidth:12 } } },
    cutout:'68%',
  };

  /* chart: monthly bar */
  const barData = {
    labels: MONTHS,
    datasets:[{ label:'Food Rescued (kg)', data:[74,92,68,115,88,136,151], backgroundColor:'rgba(16,185,129,0.75)', borderRadius:6, borderSkipped:false }],
  };
  const barOpts: any = {
    responsive:true, maintainAspectRatio:false,
    plugins:{ legend:{display:false} },
    scales:{ x:{ grid:{display:false}, ticks:{color:'#64748B'} }, y:{ grid:{color:'rgba(0,0,0,0.04)'}, ticks:{color:'#64748B'} } },
  };

  /* handle logout */
  const handleLogout = () => { localStorage.removeItem('token'); dispatch(logout()); navigate('/login'); };

  return (
    <div className="db-layout">
      {/* ── Mobile overlay ── */}
      {sidebarOpen && <div className="db-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* ══════════ SIDEBAR ══════════ */}
      <aside className={`db-sidebar${sidebarOpen ? ' open' : ''}`}>
        <Link to="/" className="db-logo"><i className="fas fa-leaf"></i> FoodBridge</Link>

        <nav className="db-nav">
          <div className="db-nav-section">
            <div className="db-nav-label">Donor Menu</div>
            {([
              ['overview', 'fa-chart-pie',    'Overview'],
              ['donate',   'fa-plus-circle',  'Log Donation'],
              ['history',  'fa-history',      'Donation History'],
            ] as [Tab, string, string][]).map(([t, icon, label]) => (
              <button key={t} className={`db-nav-item${tab===t?' active':''}`}
                onClick={() => { setTab(t); setSidebarOpen(false); }}>
                <i className={`fas ${icon}`}></i> {label}
                {t === 'history' && stats.active > 0 && <span className="notif-badge"></span>}
              </button>
            ))}
          </div>

          <div className="db-nav-section">
            <div className="db-nav-label">Account</div>
            <button className={`db-nav-item${tab==='profile'?' active':''}`}
              onClick={() => { setTab('profile'); setSidebarOpen(false); }}>
              <i className="fas fa-user"></i> Profile
            </button>
            <button className={`db-nav-item${tab==='settings'?' active':''}`}
              onClick={() => { setTab('settings'); setSidebarOpen(false); }}>
              <i className="fas fa-gear"></i> Settings
            </button>
            <button className="db-nav-item" style={{color:'#EF4444'}} onClick={handleLogout}>
              <i className="fas fa-right-from-bracket"></i> Logout
            </button>
          </div>
        </nav>

        <div className="db-user-block">
          <div className="db-avatar">{initials}</div>
          <div>
            <div className="db-user-name">{displayName}</div>
            <div className="db-user-role">Food Donor</div>
          </div>
        </div>
      </aside>

      {/* ══════════ MAIN ══════════ */}
      <main className="db-main">
        {/* ── Topbar ── */}
        <div className="db-topbar">
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button className="db-hamburger" onClick={() => setSidebarOpen(o => !o)} aria-label="Menu">
              <i className="fas fa-bars"></i>
            </button>
            <div className="db-topbar-title">
              {tab === 'overview' && '📊 Donor Overview'}
              {tab === 'donate'   && (editId ? '✏️ Edit Donation' : '➕ Log Surplus Food')}
              {tab === 'history'  && '📋 Donation History'}
              {tab === 'profile'  && '👤 Profile'}
              {tab === 'settings' && '⚙️ Settings'}
            </div>
          </div>
          <div className="db-topbar-right">
            <button className="db-btn db-btn-ghost db-btn-sm"><i className="fas fa-bell"></i></button>
            {tab !== 'settings' && tab !== 'profile' && (
              <button className="db-btn db-btn-primary db-btn-sm" onClick={() => { setEditId(null); setForm(blank); setPreviewURL(null); setTab('donate'); }}>
                <i className="fas fa-plus"></i> Quick Donate
              </button>
            )}
          </div>
        </div>

        {/* ── Content ── */}
        <div className="db-content">

          {/* Loading / error banner */}
          {loading && (
            <div style={{ textAlign:'center', padding:'40px 0', color:'var(--c-muted)' }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize:'2rem', marginBottom:12, display:'block' }}></i>
              Loading your donations…
            </div>
          )}
          {apiError && !loading && (
            <div style={{ background:'#FEE2E2', border:'1px solid #FCA5A5', borderRadius:'var(--r-md)', padding:'14px 20px', marginBottom:20, color:'#991B1B', display:'flex', alignItems:'center', gap:10 }}>
              <i className="fas fa-circle-exclamation"></i>
              <span>{apiError}</span>
              <button className="db-btn db-btn-ghost db-btn-sm" style={{ marginLeft:'auto' }} onClick={() => setApiError(null)}>
                <i className="fas fa-xmark"></i>
              </button>
            </div>
          )}

          {!loading && (
            <>
          {/* ════ OVERVIEW ════ */}
          {tab === 'overview' && (
            <>
              <div className="db-page-header">
                <h2>Welcome back, {displayName}! 👋</h2>
                <p>Here's a summary of your food rescue contributions.</p>
              </div>

              {/* Stat chips */}
              <div className="db-stats-row">
                {[
                  { ico:'fa-box-open',       bg:'rgba(16,185,129,0.1)', color:'var(--c-primary)',   num:stats.total,              lbl:'Total Donations',      delta:'All time' },
                  { ico:'fa-circle-check',   bg:'rgba(37,99,235,0.1)', color:'var(--c-secondary)', num:stats.claimed,            lbl:'Successfully Claimed', delta:'Delivered to NGOs' },
                  { ico:'fa-hourglass-half', bg:'rgba(249,115,22,0.1)',color:'var(--c-accent)',    num:stats.active,             lbl:'Active Listings',      delta:'Awaiting pickup' },
                  { ico:'fa-weight-hanging', bg:'rgba(139,92,246,0.1)',color:'#8B5CF6',            num:stats.units.toFixed(0),   lbl:'Units Donated',        delta:'Estimated meals: ' + (stats.units * 2).toFixed(0) },
                ].map((s, i) => (
                  <div className="db-stat-chip" key={i}>
                    <div className="db-stat-ico" style={{ background:s.bg }}>
                      <i className={`fas ${s.ico}`} style={{ color:s.color }}></i>
                    </div>
                    <div>
                      <div className="db-stat-num">{s.num}</div>
                      <div className="db-stat-lbl">{s.lbl}</div>
                      <div className="db-stat-delta delta-up">{s.delta}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts row */}
              <div className="db-chart-row">
                <div className="db-card db-chart-card">
                  <div className="db-card-header">
                    <div className="db-card-title"><i className="fas fa-chart-line"></i> Donations Over Time</div>
                  </div>
                  <div className="db-card-body">
                    <div style={{ height:240 }}><Line data={lineData} options={lineOpts} /></div>
                  </div>
                </div>

                <div className="db-card db-chart-card db-chart-card--sm">
                  <div className="db-card-header">
                    <div className="db-card-title"><i className="fas fa-chart-pie"></i> Food Categories</div>
                  </div>
                  <div className="db-card-body">
                    <div style={{ height:220 }}>{Object.keys(catCounts).length > 0 ? <Doughnut data={doughnutData} options={doughnutOpts} /> : <p style={{ textAlign:'center', color:'var(--c-muted)', paddingTop:80 }}>No data yet</p>}</div>
                  </div>
                </div>
              </div>

              {/* Monthly rescue bar */}
              <div className="db-card" style={{ marginBottom:24 }}>
                <div className="db-card-header">
                  <div className="db-card-title"><i className="fas fa-chart-bar"></i> Monthly Food Rescued (kg)</div>
                </div>
                <div className="db-card-body">
                  <div style={{ height:200 }}><Bar data={barData} options={barOpts} /></div>
                </div>
              </div>

              {/* Recent table */}
              <div className="db-card">
                <div className="db-card-header">
                  <div className="db-card-title"><i className="fas fa-clock"></i> Recent Donations</div>
                  <button className="db-btn db-btn-ghost db-btn-sm" onClick={() => setTab('history')}>
                    View all <i className="fas fa-arrow-right"></i>
                  </button>
                </div>
                <div className="db-card-body" style={{ paddingTop:0 }}>
                  {donations.length === 0
                    ? <div className="db-empty-state"><i className="fas fa-box-open"></i><p>No donations yet. <button className="db-btn db-btn-primary db-btn-sm" onClick={() => setTab('donate')}>Log your first donation</button></p></div>
                    : (
                      <table className="db-table">
                        <thead><tr><th>Food Item</th><th>Qty</th><th>Category</th><th>Expiry</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>
                          {donations.slice(0,4).map(d => (
                            <tr key={d.id}>
                              <td><span style={{ marginRight:8 }}>{getEmoji(d.title)}</span>{d.title}</td>
                              <td>{d.quantity}</td>
                              <td><span className="db-badge badge-blue">{d.category}</span></td>
                              <td style={{ fontSize:'0.82rem' }}>{d.expiryDate}</td>
                              <td><span className={`db-badge ${statusBadge(d.status)}`}>{d.status}</span></td>
                              <td>
                                <div style={{ display:'flex', gap:6 }}>
                                  <button className="db-btn db-btn-ghost db-btn-sm" onClick={() => startEdit(d)}><i className="fas fa-pen"></i></button>
                                  <button className="db-btn db-btn-danger db-btn-sm" onClick={() => deleteDonation(d.id)}><i className="fas fa-trash"></i></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )
                  }
                </div>
              </div>
            </>
          )}

          {/* ════ LOG DONATION ════ */}
          {tab === 'donate' && (
            <div className="db-card">
              <div className="db-card-header">
                <div className="db-card-title">
                  <i className={`fas ${editId ? 'fa-pen' : 'fa-plus-circle'}`}></i>
                  {editId ? ' Edit Donation' : ' Log Surplus Food'}
                </div>
                {editId && (
                  <button className="db-btn db-btn-ghost db-btn-sm" onClick={() => { setEditId(null); setForm(blank); setPreviewURL(null); }}>
                    <i className="fas fa-xmark"></i> Cancel Edit
                  </button>
                )}
              </div>
              <div className="db-card-body">
                <form onSubmit={handleSubmit}>
                  {/* Image upload */}
                  <div className="db-form-group full" style={{ marginBottom:24 }}>
                    <label className="db-label">Food Photo (optional)</label>
                    <div
                      className={`db-upload-zone${dragOver ? ' drag-over' : ''}`}
                      onClick={() => fileRef.current?.click()}
                      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
                    >
                      {previewURL
                        ? <img src={previewURL} alt="preview" style={{ maxHeight:180, borderRadius:'var(--r-md)', margin:'0 auto', display:'block' }} />
                        : (<>
                            <i className="fas fa-cloud-arrow-up" style={{ fontSize:'2.5rem', color:'var(--c-subtle)', display:'block', marginBottom:10 }}></i>
                            <p><span>Click to upload</span> or drag &amp; drop a photo</p>
                            <p style={{ fontSize:'0.78rem', marginTop:4, color:'var(--c-subtle)' }}>PNG, JPG, WEBP up to 10 MB</p>
                          </>)
                      }
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }}
                      onChange={e => handleFile(e.target.files?.[0] ?? null)} />
                  </div>

                  <div className="db-form-grid">
                    <div className="db-form-group">
                      <label className="db-label">Food Title *</label>
                      <input className="db-input" name="title" value={form.title} onChange={handleChange} required placeholder="e.g. Cooked Biryani" />
                    </div>
                    <div className="db-form-group">
                      <label className="db-label">Category *</label>
                      <select className="db-select" name="category" value={form.category} onChange={handleChange}>
                        {['Cooked Food','Bakery','Produce','Fruits','Dairy','Packaged','Other'].map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="db-form-group">
                      <label className="db-label">Quantity *</label>
                      <input className="db-input" name="quantity" value={form.quantity} onChange={handleChange} required type="number" min="0" placeholder="25" />
                    </div>
                    <div className="db-form-group">
                      <label className="db-label">Unit</label>
                      <select className="db-select" name="unit" value={form.unit} onChange={handleChange}>
                        {['kg','g','litres','servings','pieces','boxes'].map(u => <option key={u}>{u}</option>)}
                      </select>
                    </div>
                    <div className="db-form-group">
                      <label className="db-label">Expiry Date *</label>
                      <input className="db-input" name="expiryDate" value={form.expiryDate} onChange={handleChange} required type="date" />
                    </div>
                    <div className="db-form-group">
                      <label className="db-label">Pickup Location *</label>
                      <input className="db-input" name="pickupLocation" value={form.pickupLocation} onChange={handleChange} required placeholder="e.g. 12 MG Road, Bengaluru" />
                    </div>
                    <div className="db-form-group full">
                      <label className="db-label">Description</label>
                      <textarea className="db-textarea" name="description" value={form.description} onChange={handleChange} placeholder="Any additional details about the food item..." rows={3} />
                    </div>
                  </div>

                  <div style={{ marginTop:24, display:'flex', gap:12 }}>
                    <button type="submit" className="db-btn db-btn-primary" disabled={submitting}>
                      {submitting ? <><i className="fas fa-spinner fa-spin"></i> Saving…</> : <><i className={`fas ${editId ? 'fa-floppy-disk' : 'fa-paper-plane'}`}></i> {editId ? 'Save Changes' : 'Submit Donation'}</>}
                    </button>
                    <button type="button" className="db-btn db-btn-ghost" onClick={() => setTab('overview')}>Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ════ HISTORY ════ */}
          {tab === 'history' && (
            <>
              <div className="db-page-header" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
                <div>
                  <h2>Donation History</h2>
                  <p>{donations.length} total donations logged</p>
                </div>
                <button className="db-btn db-btn-primary" onClick={() => { setEditId(null); setForm(blank); setPreviewURL(null); setTab('donate'); }}>
                  <i className="fas fa-plus"></i> New Donation
                </button>
              </div>

              {donations.length === 0
                ? <div className="db-empty-state"><i className="fas fa-box-open"></i><p>No donations yet.</p></div>
                : (
                  <div className="donation-cards-grid">
                    {donations.map(d => (
                      <div className="donation-card" key={d.id}>
                        <div className="donation-card-img">
                          {d.imageURL
                            ? <img src={d.imageURL} alt={d.title} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                            : <span style={{ fontSize:'3.5rem' }}>{getEmoji(d.title)}</span>
                          }
                        </div>
                        <div className="donation-card-body">
                          <div className="donation-card-title">{d.title}</div>
                          <div className="donation-card-meta">
                            <span className="donation-meta-item"><i className="fas fa-weight-hanging"></i>{d.quantity}</span>
                            <span className="donation-meta-item"><i className="fas fa-location-dot"></i>{d.pickupLocation.split(',')[0]}</span>
                            <span className="donation-meta-item"><i className="fas fa-tag"></i>{d.category}</span>
                            {d.expiryDate && <span className="donation-meta-item"><i className="fas fa-calendar"></i>{d.expiryDate}</span>}
                          </div>
                          {d.description && <p style={{ fontSize:'0.8rem', color:'var(--c-muted)', marginBottom:10 }}>{d.description}</p>}
                        </div>
                        <div className="donation-card-footer">
                          <span className={`db-badge ${statusBadge(d.status)}`}>{d.status}</span>
                          <div style={{ display:'flex', gap:8 }}>
                            <button className="db-btn db-btn-ghost db-btn-sm" onClick={() => startEdit(d)} disabled={d.status !== 'active'}><i className="fas fa-pen"></i> Edit</button>
                            <button className="db-btn db-btn-danger db-btn-sm" onClick={() => deleteDonation(d.id)}><i className="fas fa-trash"></i></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
            </>
          )}

          {/* ════ PROFILE ════ */}
          {tab === 'profile' && (
            <>
              <div className="db-page-header">
                <h2>Your Profile</h2>
                <p>Review your donor account details.</p>
              </div>

              <div className="db-card" style={{ marginBottom: 20 }}>
                <div className="db-card-body" style={{ display:'grid', gridTemplateColumns:'120px 1fr', gap:20, alignItems:'center' }}>
                  <div className="db-avatar" style={{ width:84, height:84, fontSize:'1.35rem' }}>{initials}</div>
                  <div>
                    <h3 style={{ margin:'0 0 8px 0' }}>{displayName}</h3>
                    <p style={{ margin:'0 0 4px 0', color:'var(--c-muted)' }}><i className="fas fa-envelope" style={{ marginRight:8 }}></i>{userEmail}</p>
                    <p style={{ margin:0, color:'var(--c-muted)' }}><i className="fas fa-phone" style={{ marginRight:8 }}></i>{userPhone}</p>
                  </div>
                </div>
              </div>

              <div className="db-card">
                <div className="db-card-header">
                  <div className="db-card-title"><i className="fas fa-chart-simple"></i> Contribution Snapshot</div>
                </div>
                <div className="db-card-body">
                  <div className="db-stats-row">
                    <div className="db-stat-chip">
                      <div className="db-stat-ico" style={{ background:'rgba(16,185,129,0.1)' }}><i className="fas fa-box-open" style={{ color:'var(--c-primary)' }}></i></div>
                      <div><div className="db-stat-num">{stats.total}</div><div className="db-stat-lbl">Total Donations</div></div>
                    </div>
                    <div className="db-stat-chip">
                      <div className="db-stat-ico" style={{ background:'rgba(37,99,235,0.1)' }}><i className="fas fa-circle-check" style={{ color:'var(--c-secondary)' }}></i></div>
                      <div><div className="db-stat-num">{stats.claimed}</div><div className="db-stat-lbl">Claimed Donations</div></div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ════ SETTINGS ════ */}
          {tab === 'settings' && (
            <>
              <div className="db-page-header">
                <h2>Settings</h2>
                <p>Manage your donor dashboard preferences.</p>
              </div>

              <div className="db-card" style={{ marginBottom: 20 }}>
                <div className="db-card-header">
                  <div className="db-card-title"><i className="fas fa-bell"></i> Notification Preferences</div>
                </div>
                <div className="db-card-body" style={{ display:'grid', gap:14 }}>
                  <label style={{ display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px solid var(--c-border)', borderRadius:'var(--r-md)', padding:'10px 14px' }}>
                    <span>Email updates for claimed donations</span>
                    <input type="checkbox" defaultChecked />
                  </label>
                  <label style={{ display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px solid var(--c-border)', borderRadius:'var(--r-md)', padding:'10px 14px' }}>
                    <span>Reminders for expiring listings</span>
                    <input type="checkbox" defaultChecked />
                  </label>
                </div>
              </div>

              <div className="db-card">
                <div className="db-card-header">
                  <div className="db-card-title"><i className="fas fa-shield"></i> Account</div>
                </div>
                <div className="db-card-body" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
                  <p style={{ margin:0, color:'var(--c-muted)' }}>You can sign out safely from this device.</p>
                  <button className="db-btn db-btn-danger" onClick={handleLogout}><i className="fas fa-right-from-bracket"></i> Logout</button>
                </div>
              </div>
            </>
          )}
          </>
          )}
        </div>
      </main>

      {/* ── Toast ── */}
      {toastMsg && (
        <div className={`db-toast${toastType === 'error' ? ' db-toast-error' : ''}`}>
          <i className={`fas ${toastType === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'}`}></i> {toastMsg}
        </div>
      )}
    </div>
  );
};

export default DonorDashboard;
