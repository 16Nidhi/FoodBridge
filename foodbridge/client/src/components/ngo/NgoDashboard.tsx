import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import '../common/Dashboard.css';

interface Donation {
  id: string;
  title: string;
  donor: string;
  quantity: string;
  address: string;
  expiryDate: string;
  category: string;
  status: 'available' | 'reserved' | 'received' | 'distributed';
  reservedBy?: string;
}

const MOCK_DONATIONS: Donation[] = [
  { id:'1', title:'Cooked Biryani',      donor:'Sunshine Hotel',    quantity:'25 kg',       address:'12 MG Road',          expiryDate:'2026-03-08', category:'Cooked Food',    status:'available' },
  { id:'2', title:'Fresh Bread & Rolls', donor:'City Bakery',       quantity:'10 kg',       address:'5 Park Street',       expiryDate:'2026-03-07', category:'Bakery',         status:'reserved',  reservedBy:'Helping Hands NGO' },
  { id:'3', title:'Mixed Vegetables',    donor:'Fresh Mart',        quantity:'15 kg',       address:'88 Church Street',    expiryDate:'2026-03-09', category:'Produce',        status:'available' },
  { id:'4', title:'Dal & Rice',          donor:'Hotel Grandeur',    quantity:'30 servings', address:'4 Infantry Road',     expiryDate:'2026-03-07', category:'Cooked Food',    status:'received' },
  { id:'5', title:'Fruit Platter',       donor:'Grand Catering',    quantity:'8 kg',        address:'22 Bandra West',      expiryDate:'2026-03-08', category:'Fruits',         status:'available' },
  { id:'6', title:'Dairy Products',      donor:'Amul Booth',        quantity:'20 litres',   address:'7 Linking Road',      expiryDate:'2026-03-07', category:'Dairy',          status:'distributed' },
];

const CATEGORY_COLORS: Record<string,string> = {
  'Cooked Food':'#10B981','Bakery':'#F97316','Produce':'#2563EB',
  'Fruits':'#8B5CF6','Dairy':'#EF4444','Other':'#64748B',
};

const DistributionLog = [
  { date:'2026-03-06', item:'Dal & Rice', quantity:'30 srv', beneficiaries:45, by:'Ananya Sharma' },
  { date:'2026-03-05', item:'Dairy Products', quantity:'20 L', beneficiaries:20, by:'Raj Kumar' },
  { date:'2026-03-04', item:'Cooked Biryani',  quantity:'18 kg',  beneficiaries:60, by:'Priya Singh' },
];

const NgoDashboard: React.FC = () => {
  const user = useSelector((state: any) => state.auth.user);
  const [activeTab, setActiveTab] = useState<'overview'|'donations'|'distribution'>('overview');
  const [donations, setDonations] = useState<Donation[]>(MOCK_DONATIONS);
  const [filter, setFilter] = useState<'all'|'available'|'reserved'|'received'|'distributed'>('all');
  const [confirmId, setConfirmId] = useState<string|null>(null);

  const handleReserve = (id: string) => {
    setDonations(prev => prev.map(d => d.id===id ? {...d, status:'reserved', reservedBy: user?.name||'Your NGO'} : d));
  };
  const handleConfirmDistribution = (id: string) => {
    setDonations(prev => prev.map(d => d.id===id ? {...d, status:'distributed'} : d));
    setConfirmId(null);
  };

  const filtered = filter==='all' ? donations : donations.filter(d=>d.status===filter);
  const stats = {
    available:    donations.filter(d=>d.status==='available').length,
    reserved:     donations.filter(d=>d.status==='reserved').length,
    received:     donations.filter(d=>d.status==='received').length,
    distributed:  donations.filter(d=>d.status==='distributed').length,
  };

  const initials = user?.name ? user.name.split(' ').map((n:string)=>n[0]).join('').toUpperCase().slice(0,2) : 'NG';
  const displayName = user?.name || 'NGO Manager';

  return (
    <div className="db-layout">
      {/* ── Sidebar ── */}
      <aside className="db-sidebar">
        <a href="/" className="db-logo"><i className="fas fa-leaf"></i> FoodBridge</a>
        <nav className="db-nav">
          <div className="db-nav-section">
            <div className="db-nav-label">NGO Menu</div>
            <button className={`db-nav-item ${activeTab==='overview'?'active':''}`} onClick={()=>setActiveTab('overview')}>
              <i className="fas fa-chart-pie"></i> Overview
            </button>
            <button className={`db-nav-item ${activeTab==='donations'?'active':''}`} onClick={()=>setActiveTab('donations')}>
              <i className="fas fa-boxes-stacked"></i> Available Donations
              {stats.available>0&&<span className="notif-badge"></span>}
            </button>
            <button className={`db-nav-item ${activeTab==='distribution'?'active':''}`} onClick={()=>setActiveTab('distribution')}>
              <i className="fas fa-clipboard-list"></i> Distribution Log
            </button>
          </div>
          <div className="db-nav-section">
            <div className="db-nav-label">Account</div>
            <a href="/profile"  className="db-nav-item"><i className="fas fa-building"></i> NGO Profile</a>
            <a href="/logout"   className="db-nav-item" style={{color:'#EF4444'}}><i className="fas fa-right-from-bracket"></i> Logout</a>
          </div>
        </nav>
        <div className="db-user-block">
          <div className="db-avatar" style={{background:'linear-gradient(135deg,#F97316,#EA580C)'}}>{initials}</div>
          <div><div className="db-user-name">{displayName}</div><div className="db-user-role">NGO Manager</div></div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="db-main">
        <div className="db-topbar">
          <div className="db-topbar-title">
            {activeTab==='overview'    && '📊 NGO Overview'}
            {activeTab==='donations'   && '📦 Available Food Donations'}
            {activeTab==='distribution'&& '📋 Distribution Log'}
          </div>
          <div className="db-topbar-right">
            <button className="db-btn db-btn-ghost db-btn-sm"><i className="fas fa-bell"></i></button>
          </div>
        </div>

        <div className="db-content">

          {/* ── Overview ── */}
          {activeTab==='overview' && (
            <>
              <div style={{marginBottom:28}}>
                <h2 style={{fontFamily:'var(--ff-head)',fontSize:'1.4rem',fontWeight:700,marginBottom:6}}>
                  Welcome, {displayName}! 🏢
                </h2>
                <p style={{color:'var(--c-muted)',fontSize:'0.9rem'}}>Manage incoming food donations and track your distribution impact.</p>
              </div>
              <div className="db-stats-row">
                {[
                  {ico:'fa-clock',       bg:'rgba(249,115,22,0.1)', color:'var(--c-accent)',    num:stats.available,   lbl:'Available Donations'},
                  {ico:'fa-bookmark',    bg:'rgba(37,99,235,0.1)',  color:'var(--c-secondary)', num:stats.reserved,    lbl:'Reserved by You'},
                  {ico:'fa-inbox',       bg:'rgba(16,185,129,0.1)', color:'var(--c-primary)',   num:stats.received,    lbl:'Received & Verified'},
                  {ico:'fa-circle-check',bg:'rgba(139,92,246,0.1)', color:'#8B5CF6',            num:stats.distributed, lbl:'Distributed'},
                ].map((s,i)=>(
                  <div className="db-stat-chip" key={i}>
                    <div className="db-stat-ico" style={{background:s.bg}}><i className={`fas ${s.ico}`} style={{color:s.color}}></i></div>
                    <div><div className="db-stat-num">{s.num}</div><div className="db-stat-lbl">{s.lbl}</div></div>
                  </div>
                ))}
              </div>

              {/* Recent donations */}
              <div className="db-card">
                <div className="db-card-header">
                  <div className="db-card-title"><i className="fas fa-clock"></i> Recent Donations</div>
                  <button className="db-btn db-btn-ghost db-btn-sm" onClick={()=>setActiveTab('donations')}>View all</button>
                </div>
                <div className="db-card-body" style={{paddingTop:0}}>
                  <table className="db-table">
                    <thead><tr><th>Item</th><th>Donor</th><th>Quantity</th><th>Category</th><th>Expiry</th><th>Status</th></tr></thead>
                    <tbody>
                      {donations.slice(0,5).map(d=>(
                        <tr key={d.id}>
                          <td style={{fontWeight:500}}>{d.title}</td>
                          <td style={{color:'var(--c-muted)'}}>{d.donor}</td>
                          <td>{d.quantity}</td>
                          <td><span style={{background:`${CATEGORY_COLORS[d.category]||'#64748B'}20`,color:CATEGORY_COLORS[d.category]||'#64748B',padding:'2px 10px',borderRadius:'9999px',fontSize:'0.75rem',fontWeight:700}}>{d.category}</span></td>
                          <td style={{fontSize:'0.82rem'}}>{d.expiryDate}</td>
                          <td>
                            <span className={`db-badge ${d.status==='available'?'badge-orange':d.status==='reserved'?'badge-blue':d.status==='received'?'badge-green':'badge-gray'}`}>
                              {d.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ── Donations Tab ── */}
          {activeTab==='donations' && (
            <>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:12}}>
                <div>
                  <h2 style={{fontFamily:'var(--ff-head)',fontSize:'1.2rem',fontWeight:700,marginBottom:4}}>Food Donations</h2>
                  <p style={{color:'var(--c-muted)',fontSize:'0.875rem'}}>{filtered.length} donations shown</p>
                </div>
                <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                  {(['all','available','reserved','received','distributed'] as const).map(f=>(
                    <button key={f} className={`db-btn db-btn-sm ${filter===f?'db-btn-primary':'db-btn-ghost'}`} onClick={()=>setFilter(f)}>
                      {f.charAt(0).toUpperCase()+f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Confirm modal */}
              {confirmId && (
                <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.6)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(4px)'}}>
                  <div style={{background:'#fff',borderRadius:'var(--r-xl)',padding:'36px',maxWidth:420,width:'90%',boxShadow:'0 20px 60px rgba(0,0,0,0.2)'}}>
                    <div style={{textAlign:'center',marginBottom:24}}>
                      <i className="fas fa-circle-check" style={{fontSize:'3rem',color:'var(--c-primary)',display:'block',marginBottom:16}}></i>
                      <h3 style={{fontFamily:'var(--ff-head)',fontWeight:700,fontSize:'1.2rem',marginBottom:8}}>Confirm Distribution</h3>
                      <p style={{color:'var(--c-muted)',fontSize:'0.9rem'}}>Are you sure you want to mark this donation as distributed to beneficiaries?</p>
                    </div>
                    <div style={{display:'flex',gap:12,justifyContent:'center'}}>
                      <button className="db-btn db-btn-primary" onClick={()=>handleConfirmDistribution(confirmId!)}>
                        <i className="fas fa-check"></i> Yes, Confirm
                      </button>
                      <button className="db-btn db-btn-ghost" onClick={()=>setConfirmId(null)}>Cancel</button>
                    </div>
                  </div>
                </div>
              )}

              <div style={{display:'grid',gap:16}}>
                {filtered.map(d=>(
                  <div key={d.id} className="db-card" style={{transition:'transform 0.28s ease,box-shadow 0.28s ease'}}>
                    <div style={{padding:'20px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:16}}>
                      <div style={{display:'flex',gap:16,alignItems:'flex-start',flex:1,minWidth:0}}>
                        <div style={{
                          width:50,height:50,borderRadius:'var(--r-md)',flexShrink:0,
                          background:`${CATEGORY_COLORS[d.category]||'#64748B'}18`,
                          display:'flex',alignItems:'center',justifyContent:'center',
                          fontSize:'1.5rem',
                        }}>
                          {d.category==='Cooked Food'?'🍛':d.category==='Bakery'?'🍞':d.category==='Produce'?'🥦':d.category==='Fruits'?'🍎':d.category==='Dairy'?'🥛':'📦'}
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontFamily:'var(--ff-head)',fontWeight:700,fontSize:'0.95rem',marginBottom:4}}>{d.title}</div>
                          <div style={{fontSize:'0.82rem',color:'var(--c-muted)',marginBottom:8}}>
                            <i className="fas fa-store" style={{marginRight:5}}></i>{d.donor} · {d.address}
                          </div>
                          <div style={{display:'flex',flexWrap:'wrap',gap:10,fontSize:'0.8rem',color:'var(--c-muted)'}}>
                            <span><i className="fas fa-weight-hanging" style={{color:'var(--c-primary)',marginRight:4}}></i>{d.quantity}</span>
                            <span><i className="fas fa-calendar" style={{color:'var(--c-primary)',marginRight:4}}></i>Expires {d.expiryDate}</span>
                            <span style={{background:`${CATEGORY_COLORS[d.category]||'#64748B'}18`,color:CATEGORY_COLORS[d.category]||'#64748B',padding:'2px 9px',borderRadius:'9999px',fontWeight:700}}>{d.category}</span>
                          </div>
                        </div>
                      </div>
                      <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:10}}>
                        <span className={`db-badge ${d.status==='available'?'badge-orange':d.status==='reserved'?'badge-blue':d.status==='received'?'badge-green':'badge-gray'}`}>
                          {d.status==='available'?'🟡 Available':d.status==='reserved'?'🔵 Reserved':d.status==='received'?'✅ Received':'✔️ Distributed'}
                        </span>
                        <div style={{display:'flex',gap:8}}>
                          {d.status==='available'&&(
                            <button className="db-btn db-btn-primary db-btn-sm" onClick={()=>handleReserve(d.id)}>
                              <i className="fas fa-bookmark"></i> Reserve
                            </button>
                          )}
                          {d.status==='received'&&(
                            <button className="db-btn db-btn-success db-btn-sm" onClick={()=>setConfirmId(d.id)}>
                              <i className="fas fa-circle-check"></i> Confirm Distribution
                            </button>
                          )}
                          {d.status==='reserved' && d.reservedBy &&(
                            <span style={{fontSize:'0.78rem',color:'var(--c-muted)',padding:'4px 8px',background:'#F8FAFC',borderRadius:'var(--r-sm)',border:'1px solid var(--c-border)'}}>
                              Reserved by {d.reservedBy}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {filtered.length===0&&(
                  <div style={{textAlign:'center',padding:'60px 20px',color:'var(--c-subtle)'}}>
                    <i className="fas fa-box-open" style={{fontSize:'3rem',opacity:0.3,display:'block',marginBottom:14}}></i>
                    <p style={{fontFamily:'var(--ff-head)',fontWeight:600}}>No donations match this filter</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── Distribution Log ── */}
          {activeTab==='distribution' && (
            <>
              <div style={{marginBottom:24}}>
                <h2 style={{fontFamily:'var(--ff-head)',fontSize:'1.2rem',fontWeight:700,marginBottom:4}}>Distribution Log</h2>
                <p style={{color:'var(--c-muted)',fontSize:'0.875rem'}}>Track all confirmed food distributions to beneficiaries.</p>
              </div>
              <div className="db-card">
                <div className="db-card-body" style={{padding:0}}>
                  <table className="db-table">
                    <thead>
                      <tr><th>Date</th><th>Food Item</th><th>Quantity</th><th>Beneficiaries</th><th>Confirmed By</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {[...DistributionLog, ...donations.filter(d=>d.status==='distributed').map(d=>({
                        date: new Date().toISOString().slice(0,10),
                        item: d.title, quantity: d.quantity,
                        beneficiaries: Math.floor(parseInt(d.quantity)||10 * 2.5),
                        by: user?.name||'NGO Team',
                      }))].map((log,i)=>(
                        <tr key={i}>
                          <td style={{fontSize:'0.82rem',color:'var(--c-muted)'}}>{log.date}</td>
                          <td style={{fontWeight:500}}>{log.item}</td>
                          <td>{log.quantity}</td>
                          <td>
                            <span style={{fontWeight:700,color:'var(--c-primary)'}}>{log.beneficiaries}</span>
                            <span style={{fontSize:'0.78rem',color:'var(--c-muted)',marginLeft:4}}>people</span>
                          </td>
                          <td style={{fontSize:'0.85rem'}}>{log.by}</td>
                          <td><span className="db-badge badge-green">✅ Distributed</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

        </div>
      </main>
    </div>
  );
};

export default NgoDashboard;
