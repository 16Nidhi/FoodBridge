import React, { useState, useRef, ChangeEvent, FormEvent } from 'react';
import { useSelector } from 'react-redux';
import '../common/Dashboard.css';

/* ── Types ── */
interface DonationEntry {
  id: string;
  title: string;
  description: string;
  quantity: string;
  unit: string;
  expiryDate: string;
  pickupLocation: string;
  status: 'active' | 'claimed' | 'expired';
  imageURL: string | null;
  createdAt: string;
}

const MOCK_HISTORY: DonationEntry[] = [
  { id:'1', title:'Cooked Biryani',      description:'Large batch leftover from event.',  quantity:'25', unit:'kg',       expiryDate:'2026-03-08', pickupLocation:'12 MG Road, Bengaluru',        status:'claimed',  imageURL:null, createdAt:'2026-03-06' },
  { id:'2', title:'Fresh Bread & Rolls', description:'End of day bakery surplus.',         quantity:'10', unit:'kg',       expiryDate:'2026-03-07', pickupLocation:'5 Park Street, Kolkata',       status:'claimed',  imageURL:null, createdAt:'2026-03-05' },
  { id:'3', title:'Mixed Vegetables',    description:'Fresh produce, no pesticides.',      quantity:'15', unit:'kg',       expiryDate:'2026-03-09', pickupLocation:'88 Anna Salai, Chennai',       status:'active',   imageURL:null, createdAt:'2026-03-07' },
  { id:'4', title:'Dal & Rice',          description:'Cafeteria surplus lunch batch.',     quantity:'30', unit:'servings', expiryDate:'2026-03-07', pickupLocation:'4 Connaught Place, Delhi',     status:'expired',  imageURL:null, createdAt:'2026-03-04' },
  { id:'5', title:'Fruit Platter',       description:'Event decoration fruits, fully edible.', quantity:'8', unit:'kg',   expiryDate:'2026-03-08', pickupLocation:'22 Bandra West, Mumbai',       status:'active',   imageURL:null, createdAt:'2026-03-07' },
];

const EMOJI_MAP: Record<string, string> = {
  'Cooked Biryani':'🍛','Fresh Bread & Rolls':'🍞','Mixed Vegetables':'🥦',
  'Dal & Rice':'🥘','Fruit Platter':'🍎',
};
const getEmoji = (title: string) => EMOJI_MAP[title] || '🍽️';

const DonorDashboard: React.FC = () => {
  const user = useSelector((state: any) => state.auth.user);
  const [activeTab, setActiveTab] = useState<'overview'|'donate'|'history'>('overview');
  const [donations, setDonations] = useState<DonationEntry[]>(MOCK_HISTORY);
  const [previewURL, setPreviewURL] = useState<string|null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ title:'', description:'', quantity:'', unit:'kg', expiryDate:'', expiryTime:'', pickupLocation:'' });

  const handleChange = (e: ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleFile = (file: File|null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewURL(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 900));
    setDonations(prev => [{
      id: Date.now().toString(), ...form,
      expiryDate: form.expiryDate,
      pickupLocation: form.pickupLocation,
      status: 'active' as const,
      imageURL: previewURL,
      createdAt: new Date().toISOString().slice(0,10),
    }, ...prev]);
    setForm({ title:'', description:'', quantity:'', unit:'kg', expiryDate:'', expiryTime:'', pickupLocation:'' });
    setPreviewURL(null);
    setSubmitting(false);
    setSuccess(true);
    setTimeout(() => { setSuccess(false); setActiveTab('history'); }, 1800);
  };

  const stats = {
    total:   donations.length,
    active:  donations.filter(d => d.status === 'active').length,
    claimed: donations.filter(d => d.status === 'claimed').length,
    units:   donations.reduce((acc, d) => acc + (parseInt(d.quantity)||0), 0),
  };

  const initials = user?.name ? user.name.split(' ').map((n:string)=>n[0]).join('').toUpperCase().slice(0,2) : 'DN';
  const displayName = user?.name || 'Donor';

  return (
    <div className="db-layout">
      {/* ── Sidebar ── */}
      <aside className="db-sidebar">
        <a href="/" className="db-logo"><i className="fas fa-leaf"></i> FoodBridge</a>
        <nav className="db-nav">
          <div className="db-nav-section">
            <div className="db-nav-label">Donor Menu</div>
            <button className={`db-nav-item ${activeTab==='overview'?'active':''}`} onClick={()=>setActiveTab('overview')}>
              <i className="fas fa-chart-pie"></i> Overview
            </button>
            <button className={`db-nav-item ${activeTab==='donate'?'active':''}`} onClick={()=>setActiveTab('donate')}>
              <i className="fas fa-plus-circle"></i> Log Surplus Food
            </button>
            <button className={`db-nav-item ${activeTab==='history'?'active':''}`} onClick={()=>setActiveTab('history')}>
              <i className="fas fa-history"></i> Donation History
              {stats.active > 0 && <span className="notif-badge"></span>}
            </button>
          </div>
          <div className="db-nav-section">
            <div className="db-nav-label">Account</div>
            <a href="/profile"  className="db-nav-item"><i className="fas fa-user"></i> Profile</a>
            <a href="/settings" className="db-nav-item"><i className="fas fa-gear"></i> Settings</a>
            <a href="/logout"   className="db-nav-item" style={{color:'#EF4444'}}><i className="fas fa-right-from-bracket"></i> Logout</a>
          </div>
        </nav>
        <div className="db-user-block">
          <div className="db-avatar">{initials}</div>
          <div><div className="db-user-name">{displayName}</div><div className="db-user-role">Food Donor</div></div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="db-main">
        <div className="db-topbar">
          <div className="db-topbar-title">
            {activeTab==='overview'&&'📊 Donor Overview'}
            {activeTab==='donate'  &&'➕ Log Surplus Food'}
            {activeTab==='history' &&'📋 Donation History'}
          </div>
          <div className="db-topbar-right">
            <button className="db-btn db-btn-ghost db-btn-sm"><i className="fas fa-bell"></i></button>
            <button className="db-btn db-btn-primary" onClick={()=>setActiveTab('donate')}>
              <i className="fas fa-plus"></i> Quick Donate
            </button>
          </div>
        </div>

        <div className="db-content">

          {/* ── Overview ── */}
          {activeTab==='overview'&&(
            <>
              <div style={{marginBottom:28}}>
                <h2 style={{fontFamily:'var(--ff-head)',fontSize:'1.4rem',fontWeight:700,marginBottom:6}}>Welcome back, {displayName}! 👋</h2>
                <p style={{color:'var(--c-muted)',fontSize:'0.9rem'}}>Here's a summary of your food rescue contributions.</p>
              </div>
              <div className="db-stats-row">
                {[
                  {ico:'fa-box-open',      bg:'rgba(16,185,129,0.1)',  color:'var(--c-primary)',   num:stats.total,   lbl:'Total Donations',     delta:'All time'},
                  {ico:'fa-circle-check',  bg:'rgba(37,99,235,0.1)',   color:'var(--c-secondary)', num:stats.claimed, lbl:'Successfully Claimed', delta:'Delivered'},
                  {ico:'fa-hourglass-half',bg:'rgba(249,115,22,0.1)',  color:'var(--c-accent)',    num:stats.active,  lbl:'Active Listings',      delta:'Awaiting pickup'},
                  {ico:'fa-utensils',      bg:'rgba(139,92,246,0.1)',  color:'#8B5CF6',            num:stats.units,   lbl:'Units Donated',        delta:'Est. meals saved'},
                ].map((s,i)=>(
                  <div className="db-stat-chip" key={i}>
                    <div className="db-stat-ico" style={{background:s.bg}}><i className={`fas ${s.ico}`} style={{color:s.color}}></i></div>
                    <div><div className="db-stat-num">{s.num}</div><div className="db-stat-lbl">{s.lbl}</div><div className="db-stat-delta delta-up">{s.delta}</div></div>
                  </div>
                ))}
              </div>
              <div className="db-card">
                <div className="db-card-header">
                  <div className="db-card-title"><i className="fas fa-clock"></i> Recent Donations</div>
                  <button className="db-btn db-btn-ghost db-btn-sm" onClick={()=>setActiveTab('history')}>View all <i className="fas fa-arrow-right"></i></button>
                </div>
                <div className="db-card-body" style={{paddingTop:0}}>
                  <table className="db-table">
                    <thead><tr><th>Food Item</th><th>Quantity</th><th>Pickup Location</th><th>Expiry</th><th>Status</th></tr></thead>
                    <tbody>
                      {donations.slice(0,5).map(d=>(
                        <tr key={d.id}>
                          <td><span style={{marginRight:8}}>{getEmoji(d.title)}</span>{d.title}</td>
                          <td>{d.quantity} {d.unit}</td>
                          <td style={{fontSize:'0.8rem',color:'var(--c-muted)'}}>{d.pickupLocation}</td>
                          <td style={{fontSize:'0.82rem'}}>{d.expiryDate}</td>
                          <td><span className={`db-badge ${d.status==='active'?'badge-orange':d.status==='claimed'?'badge-green':'badge-gray'}`}>{d.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ── Donate Form ── */}
          {activeTab==='donate'&&(
            <div className="db-card">
              <div className="db-card-header"><div className="db-card-title"><i className="fas fa-plus-circle"></i> Log Surplus Food</div></div>
              <div className="db-card-body">
                {success&&(
                  <div style={{background:'#D1FAE5',border:'1px solid #6EE7B7',borderRadius:'var(--r-md)',padding:'14px 18px',marginBottom:20,color:'#065F46',display:'flex',alignItems:'center',gap:10,fontFamily:'var(--ff-head)',fontWeight:600}}>
                    <i className="fas fa-circle-check"></i> Donation logged successfully!
                  </div>
                )}
                <form onSubmit={handleSubmit}>
                  <div className="db-form-group full" style={{marginBottom:24}}>
                    <label className="db-label">Food Photo (optional)</label>
                    <div
                      className={`db-upload-zone ${dragOver?'drag-over':''}`}
                      onClick={()=>fileRef.current?.click()}
                      onDragOver={e=>{e.preventDefault();setDragOver(true);}}
                      onDragLeave={()=>setDragOver(false)}
                      onDrop={e=>{e.preventDefault();setDragOver(false);handleFile(e.dataTransfer.files[0]);}}
                    >
                      {previewURL
                        ?<img src={previewURL} alt="preview" style={{maxHeight:180,borderRadius:'var(--r-md)',margin:'0 auto'}}/>
                        :<><i className="fas fa-cloud-arrow-up" style={{fontSize:'2.5rem',color:'var(--c-subtle)',display:'block',marginBottom:10}}></i><p><span>Click to upload</span> or drag & drop a photo</p><p style={{fontSize:'0.78rem',marginTop:4}}>PNG, JPG, WEBP up to 10MB</p></>
                      }
                    </div>
                    <input type="file" ref={fileRef} accept="image/*" style={{display:'none'}} onChange={e=>handleFile(e.target.files?.[0]??null)}/>
                  </div>
                  <div className="db-form-grid">
                    <div className="db-form-group full">
                      <label className="db-label">Food Title *</label>
                      <input className="db-input" name="title" value={form.title} onChange={handleChange} placeholder="e.g. Cooked Biryani, Fresh Bread" required/>
                    </div>
                    <div className="db-form-group full">
                      <label className="db-label">Description</label>
                      <textarea className="db-textarea" name="description" value={form.description} onChange={handleChange} placeholder="Food type, preparation, allergen notes..."/>
                    </div>
                    <div className="db-form-group">
                      <label className="db-label">Quantity *</label>
                      <input className="db-input" name="quantity" type="number" min="1" value={form.quantity} onChange={handleChange} placeholder="e.g. 25" required/>
                    </div>
                    <div className="db-form-group">
                      <label className="db-label">Unit</label>
                      <select className="db-select" name="unit" value={form.unit} onChange={handleChange}>
                        <option value="kg">kg</option>
                        <option value="servings">Servings</option>
                        <option value="boxes">Boxes</option>
                        <option value="litres">Litres</option>
                        <option value="pieces">Pieces</option>
                      </select>
                    </div>
                    <div className="db-form-group">
                      <label className="db-label">Expiry Date *</label>
                      <input className="db-input" type="date" name="expiryDate" value={form.expiryDate} onChange={handleChange} required/>
                    </div>
                    <div className="db-form-group">
                      <label className="db-label">Expiry Time</label>
                      <input className="db-input" type="time" name="expiryTime" value={form.expiryTime} onChange={handleChange}/>
                    </div>
                    <div className="db-form-group full">
                      <label className="db-label">Pickup Location *</label>
                      <input className="db-input" name="pickupLocation" value={form.pickupLocation} onChange={handleChange} placeholder="Full address, e.g. 12 MG Road, Bengaluru" required/>
                    </div>
                  </div>
                  <div style={{display:'flex',gap:12,marginTop:28}}>
                    <button type="submit" className="db-btn db-btn-primary" disabled={submitting} style={{minWidth:160}}>
                      {submitting?<><i className="fas fa-spinner fa-spin"></i> Logging...</>:<><i className="fas fa-plus"></i> Log Donation</>}
                    </button>
                    <button type="button" className="db-btn db-btn-ghost"
                      onClick={()=>{setForm({title:'',description:'',quantity:'',unit:'kg',expiryDate:'',expiryTime:'',pickupLocation:''});setPreviewURL(null);}}>
                      Clear
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ── History Cards ── */}
          {activeTab==='history'&&(
            <>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24}}>
                <div>
                  <h2 style={{fontFamily:'var(--ff-head)',fontSize:'1.2rem',fontWeight:700,marginBottom:4}}>Donation History</h2>
                  <p style={{color:'var(--c-muted)',fontSize:'0.875rem'}}>{donations.length} total donations</p>
                </div>
                <button className="db-btn db-btn-primary" onClick={()=>setActiveTab('donate')}><i className="fas fa-plus"></i> New Donation</button>
              </div>
              <div className="donation-cards-grid">
                {donations.map(d=>(
                  <div className="donation-card" key={d.id}>
                    <div className="donation-card-img">
                      {d.imageURL?<img src={d.imageURL} alt={d.title} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<span style={{fontSize:'3.5rem'}}>{getEmoji(d.title)}</span>}
                    </div>
                    <div className="donation-card-body">
                      <div className="donation-card-title">{d.title}</div>
                      <div className="donation-card-meta">
                        <span className="donation-meta-item"><i className="fas fa-weight-hanging"></i>{d.quantity} {d.unit}</span>
                        <span className="donation-meta-item"><i className="fas fa-calendar"></i>Expires {d.expiryDate}</span>
                        <span className="donation-meta-item"><i className="fas fa-location-dot"></i>{d.pickupLocation.split(',')[0]}</span>
                      </div>
                    </div>
                    <div className="donation-card-footer">
                      <span style={{fontSize:'0.78rem',color:'var(--c-subtle)'}}>Listed {d.createdAt}</span>
                      <span className={`db-badge ${d.status==='active'?'badge-orange':d.status==='claimed'?'badge-green':'badge-gray'}`}>
                        {d.status==='active'?'🟡 Active':d.status==='claimed'?'✅ Claimed':'⏰ Expired'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

        </div>
      </main>
    </div>
  );
};

export default DonorDashboard;