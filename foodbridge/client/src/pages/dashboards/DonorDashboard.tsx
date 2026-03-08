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

/* ─── Mock data ─────────────────────────────────────────────── */
const INIT_DONATIONS: Donation[] = [
  { id:'1', title:'Cooked Biryani',       description:'Large batch leftover from event.',        quantity:'25', unit:'kg',       category:'Cooked Food', expiryDate:'2026-03-08', pickupLocation:'12 MG Road, Bengaluru',    status:'claimed',  imageURL:null, createdAt:'2026-03-06' },
  { id:'2', title:'Fresh Bread & Rolls',  description:'End-of-day bakery surplus.',              quantity:'10', unit:'kg',       category:'Bakery',      expiryDate:'2026-03-07', pickupLocation:'5 Park Street, Kolkata',   status:'claimed',  imageURL:null, createdAt:'2026-03-05' },
  { id:'3', title:'Mixed Vegetables',     description:'Fresh produce, no pesticides used.',      quantity:'15', unit:'kg',       category:'Produce',     expiryDate:'2026-03-09', pickupLocation:'88 Anna Salai, Chennai',   status:'active',   imageURL:null, createdAt:'2026-03-07' },
  { id:'4', title:'Dal & Rice',           description:'Cafeteria lunch surplus.',                quantity:'30', unit:'servings', category:'Cooked Food', expiryDate:'2026-03-06', pickupLocation:'4 Connaught Place, Delhi', status:'expired',  imageURL:null, createdAt:'2026-03-04' },
  { id:'5', title:'Fruit Platter',        description:'Event decoration fruits, fully edible.', quantity:'8',  unit:'kg',       category:'Fruits',      expiryDate:'2026-03-08', pickupLocation:'22 Bandra West, Mumbai',   status:'active',   imageURL:null, createdAt:'2026-03-07' },
  { id:'6', title:'Dairy Products',       description:'Excess from catering event.',             quantity:'12', unit:'litres',   category:'Dairy',       expiryDate:'2026-03-08', pickupLocation:'7 Linking Road, Mumbai',   status:'claimed',  imageURL:null, createdAt:'2026-03-06' },
];

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
type Tab = 'overview' | 'donate' | 'history';

/* ═══════════════════════════════════════════════════════════════
   DONOR DASHBOARD PAGE
═══════════════════════════════════════════════════════════════ */
const DonorDashboard: React.FC = () => {
  const user       = useSelector((state: any) => state.auth.user);
  const dispatch   = useDispatch();
  const navigate   = useNavigate();

  const [tab, setTab]       = useState<Tab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [donations, setDonations]     = useState<Donation[]>(INIT_DONATIONS);
  const [editId, setEditId]           = useState<string | null>(null);
  const [previewURL, setPreviewURL]   = useState<string | null>(null);
  const [dragOver, setDragOver]       = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [toastMsg, setToastMsg]       = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const blank = { title:'', description:'', quantity:'', unit:'kg', category:'Cooked Food', expiryDate:'', pickupLocation:'' };
  const [form, setForm] = useState(blank);

  const initials    = user?.name ? user.name.split(' ').map((n:string)=>n[0]).join('').toUpperCase().slice(0,2) : 'DN';
  const displayName = user?.name || 'Donor';

  /* toast helper */
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
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
    await new Promise(r => setTimeout(r, 700));
    if (editId) {
      setDonations(prev => prev.map(d => d.id === editId ? { ...d, ...form, imageURL: previewURL } : d));
      showToast('Donation updated successfully!');
      setEditId(null);
    } else {
      setDonations(prev => [{ id: Date.now().toString(), ...form, status:'active', imageURL: previewURL, createdAt: new Date().toISOString().slice(0,10) }, ...prev]);
      showToast('Donation logged successfully!');
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

  /* delete */
  const deleteDonation = (id: string) => {
    setDonations(prev => prev.filter(d => d.id !== id));
    showToast('Donation deleted.');
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
  const handleLogout = () => { dispatch(logout()); navigate('/login'); };

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
            <Link to="/profile"  className="db-nav-item"><i className="fas fa-user"></i> Profile</Link>
            <Link to="/settings" className="db-nav-item"><i className="fas fa-gear"></i> Settings</Link>
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
            </div>
          </div>
          <div className="db-topbar-right">
            <button className="db-btn db-btn-ghost db-btn-sm"><i className="fas fa-bell"></i></button>
            <button className="db-btn db-btn-primary db-btn-sm" onClick={() => { setEditId(null); setForm(blank); setPreviewURL(null); setTab('donate'); }}>
              <i className="fas fa-plus"></i> Quick Donate
            </button>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="db-content">

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
                    <div style={{ height:220 }}><Doughnut data={doughnutData} options={doughnutOpts} /></div>
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
                  <table className="db-table">
                    <thead><tr><th>Food Item</th><th>Qty</th><th>Category</th><th>Expiry</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                      {donations.slice(0,4).map(d => (
                        <tr key={d.id}>
                          <td><span style={{ marginRight:8 }}>{getEmoji(d.title)}</span>{d.title}</td>
                          <td>{d.quantity} {d.unit}</td>
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
                        <span className="donation-meta-item"><i className="fas fa-weight-hanging"></i>{d.quantity} {d.unit}</span>
                        <span className="donation-meta-item"><i className="fas fa-location-dot"></i>{d.pickupLocation.split(',')[0]}</span>
                        <span className="donation-meta-item"><i className="fas fa-tag"></i>{d.category}</span>
                        <span className="donation-meta-item"><i className="fas fa-calendar"></i>{d.expiryDate}</span>
                      </div>
                      {d.description && <p style={{ fontSize:'0.8rem', color:'var(--c-muted)', marginBottom:10 }}>{d.description}</p>}
                    </div>
                    <div className="donation-card-footer">
                      <span className={`db-badge ${statusBadge(d.status)}`}>{d.status}</span>
                      <div style={{ display:'flex', gap:8 }}>
                        <button className="db-btn db-btn-ghost db-btn-sm" onClick={() => startEdit(d)}><i className="fas fa-pen"></i> Edit</button>
                        <button className="db-btn db-btn-danger db-btn-sm" onClick={() => deleteDonation(d.id)}><i className="fas fa-trash"></i></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {/* ── Toast ── */}
      {toastMsg && (
        <div className="db-toast">
          <i className="fas fa-circle-check"></i> {toastMsg}
        </div>
      )}
    </div>
  );
};

export default DonorDashboard;
