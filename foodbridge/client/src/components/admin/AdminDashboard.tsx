import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, Title, Tooltip, Legend,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import '../common/Dashboard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

interface AppUser {
  id: string; name: string; email: string; role: string;
  joinDate: string; status: 'active' | 'inactive' | 'suspended';
  donations?: number; pickups?: number;
}

const MOCK_USERS: AppUser[] = [
  { id:'1', name:'Rajesh Sharma',    email:'rajesh@foodco.in',   role:'donor',     joinDate:'2025-12-01', status:'active',    donations:23 },
  { id:'2', name:'Priya Singh',      email:'priya@helpngo.org',  role:'ngo',       joinDate:'2025-11-15', status:'active',    donations:0 },
  { id:'3', name:'Ananya Verma',     email:'ananya@gmail.com',   role:'volunteer', joinDate:'2026-01-05', status:'active',    pickups:17 },
  { id:'4', name:'Hotel Grandeur',   email:'ops@grandeur.com',   role:'donor',     joinDate:'2025-10-20', status:'active',    donations:51 },
  { id:'5', name:'City Bakery',      email:'info@citybakery.in', role:'donor',     joinDate:'2025-09-11', status:'inactive',  donations:8 },
  { id:'6', name:'Feeding India',    email:'mail@feedindia.org', role:'ngo',       joinDate:'2025-08-30', status:'suspended', donations:0 },
  { id:'7', name:'Karan Mehta',      email:'karan@gmail.com',    role:'volunteer', joinDate:'2026-02-14', status:'active',    pickups:9 },
  { id:'8', name:'Fresh Mart',       email:'fresh@mart.co',      role:'donor',     joinDate:'2026-01-22', status:'active',    donations:14 },
];

const months = ['Sep','Oct','Nov','Dec','Jan','Feb','Mar'];
const donationsOverTime = [42, 65, 78, 91, 110, 136, 158];
const mealsOverTime     = [380, 590, 760, 840, 990, 1240, 1430];

const lineChartData = {
  labels: months,
  datasets: [
    { label: 'Donations', data: donationsOverTime, borderColor:'#10B981', backgroundColor:'rgba(16,185,129,0.12)', tension:0.4, fill:true, pointRadius:4, pointBackgroundColor:'#10B981' },
    { label: 'Meals Served', data: mealsOverTime,  borderColor:'#2563EB', backgroundColor:'rgba(37,99,235,0.09)',   tension:0.4, fill:true, pointRadius:4, pointBackgroundColor:'#2563EB', yAxisID:'y2' },
  ],
};

const lineChartOpts: any = {
  responsive:true, maintainAspectRatio:false,
  plugins:{ legend:{position:'top'}, title:{display:false} },
  scales:{
    y:  { grid:{color:'rgba(0,0,0,0.04)'}, ticks:{color:'#64748B'}, title:{display:true,text:'Donations',color:'#10B981'} },
    y2: { position:'right', grid:{drawOnChartArea:false}, ticks:{color:'#64748B'}, title:{display:true,text:'Meals',color:'#2563EB'} },
    x:  { grid:{display:false}, ticks:{color:'#64748B'} },
  },
};

const barChartData = {
  labels:['Hotel Grandeur','Sunshine Hotel','Fresh Mart','City Bakery','Rajesh Sharma','Grand Catering'],
  datasets:[{ label:'Donations Made', data:[51,38,14,8,23,19],
    backgroundColor:['#10B981','#2563EB','#F97316','#8B5CF6','#EF4444','#F59E0B'],
    borderRadius:6, borderSkipped:false,
  }],
};
const barChartOpts: any = {
  responsive:true, maintainAspectRatio:false, indexAxis:'y' as const,
  plugins:{ legend:{display:false} },
  scales:{ x:{grid:{color:'rgba(0,0,0,0.04)'}, ticks:{color:'#64748B'}}, y:{grid:{display:false}, ticks:{color:'#64748B'}} },
};

const doughnutData = {
  labels:['Cooked Food','Bakery','Produce','Dairy','Fruits','Packaged'],
  datasets:[{ data:[35,20,18,10,9,8],
    backgroundColor:['#10B981','#F97316','#2563EB','#8B5CF6','#EF4444','#F59E0B'],
    borderWidth:2, borderColor:'#fff',
  }],
};
const doughnutOpts: any = {
  responsive:true, maintainAspectRatio:false,
  plugins:{ legend:{position:'right', labels:{font:{size:11},boxWidth:12}} },
  cutout:'68%',
};

const ROLE_COLORS: Record<string,string> = { donor:'badge-green', ngo:'badge-blue', volunteer:'badge-orange', admin:'badge-red' };

const AdminDashboard: React.FC = () => {
  const user = useSelector((state: any) => state.auth.user);
  const [activeTab, setActiveTab] = useState<'analytics'|'donations'|'users'>('analytics');
  const [users, setUsers] = useState<AppUser[]>(MOCK_USERS);
  const [roleFilter, setRoleFilter] = useState<'all'|'donor'|'ngo'|'volunteer'>('all');
  const [userSearch, setUserSearch] = useState('');

  const handleStatusToggle = (id: string) => {
    setUsers(prev => prev.map(u => u.id===id ? {...u, status: u.status==='active'?'suspended':'active'} : u));
  };

  const filteredUsers = users.filter(u => {
    const matchRole   = roleFilter==='all' || u.role===roleFilter;
    const matchSearch = !userSearch || u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase());
    return matchRole && matchSearch;
  });

  const totalDonations  = donationsOverTime[donationsOverTime.length-1];
  const totalMeals      = mealsOverTime[mealsOverTime.length-1];
  const activeVols      = users.filter(u=>u.role==='volunteer'&&u.status==='active').length;
  const registeredNGOs  = users.filter(u=>u.role==='ngo').length;

  const initials = user?.name ? user.name.split(' ').map((n:string)=>n[0]).join('').toUpperCase().slice(0,2) : 'AD';
  const displayName = user?.name || 'Admin';

  return (
    <div className="db-layout">
      {/* ── Sidebar ── */}
      <aside className="db-sidebar">
        <a href="/" className="db-logo"><i className="fas fa-leaf"></i> FoodBridge</a>
        <nav className="db-nav">
          <div className="db-nav-section">
            <div className="db-nav-label">Admin Panel</div>
            <button className={`db-nav-item ${activeTab==='analytics'?'active':''}`} onClick={()=>setActiveTab('analytics')}>
              <i className="fas fa-chart-line"></i> Analytics
            </button>
            <button className={`db-nav-item ${activeTab==='donations'?'active':''}`} onClick={()=>setActiveTab('donations')}>
              <i className="fas fa-box-heart"></i> All Donations
            </button>
            <button className={`db-nav-item ${activeTab==='users'?'active':''}`} onClick={()=>setActiveTab('users')}>
              <i className="fas fa-users"></i> Manage Users
            </button>
          </div>
          <div className="db-nav-section">
            <div className="db-nav-label">System</div>
            <a href="/settings" className="db-nav-item"><i className="fas fa-gear"></i> Settings</a>
            <a href="/logout"   className="db-nav-item" style={{color:'#EF4444'}}><i className="fas fa-right-from-bracket"></i> Logout</a>
          </div>
        </nav>
        <div className="db-user-block">
          <div className="db-avatar" style={{background:'linear-gradient(135deg,#EF4444,#B91C1C)'}}>{initials}</div>
          <div><div className="db-user-name">{displayName}</div><div className="db-user-role">Platform Admin</div></div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="db-main">
        <div className="db-topbar">
          <div className="db-topbar-title">
            {activeTab==='analytics' && '📊 Platform Analytics'}
            {activeTab==='donations' && '📦 All Donations'}
            {activeTab==='users'     && '👥 User Management'}
          </div>
          <div className="db-topbar-right">
            <button className="db-btn db-btn-ghost db-btn-sm"><i className="fas fa-bell"></i></button>
          </div>
        </div>

        <div className="db-content">

          {/* ── Analytics ── */}
          {activeTab==='analytics' && (
            <>
              <div className="db-stats-row">
                {[
                  {ico:'fa-box',         bg:'rgba(16,185,129,0.1)', color:'var(--c-primary)',   num:totalDonations, lbl:'Total Donations',    suffix:''},
                  {ico:'fa-bowl-food',   bg:'rgba(37,99,235,0.1)',  color:'var(--c-secondary)', num:`${(totalMeals/1000).toFixed(1)}k`, lbl:'Meals Rescued', suffix:''},
                  {ico:'fa-person-running',bg:'rgba(249,115,22,0.1)',color:'var(--c-accent)',   num:activeVols,     lbl:'Active Volunteers',  suffix:''},
                  {ico:'fa-building-ngo',bg:'rgba(139,92,246,0.1)', color:'#8B5CF6',            num:registeredNGOs, lbl:'Registered NGOs',    suffix:''},
                ].map((s,i)=>(
                  <div className="db-stat-chip" key={i}>
                    <div className="db-stat-ico" style={{background:s.bg}}><i className={`fas ${s.ico}`} style={{color:s.color}}></i></div>
                    <div><div className="db-stat-num">{s.num}</div><div className="db-stat-lbl">{s.lbl}</div></div>
                  </div>
                ))}
              </div>

              {/* Line chart — donations + meals over time */}
              <div className="db-card">
                <div className="db-card-header">
                  <div className="db-card-title"><i className="fas fa-chart-line"></i> Growth Over Time (Sep 2025 – Mar 2026)</div>
                </div>
                <div className="db-card-body" style={{height:280}}>
                  <Line data={lineChartData} options={lineChartOpts} />
                </div>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginTop:0}}>
                {/* Bar chart — top donors */}
                <div className="db-card">
                  <div className="db-card-header">
                    <div className="db-card-title"><i className="fas fa-trophy"></i> Top Donors</div>
                  </div>
                  <div className="db-card-body" style={{height:240}}>
                    <Bar data={barChartData} options={barChartOpts} />
                  </div>
                </div>
                {/* Doughnut — food categories */}
                <div className="db-card">
                  <div className="db-card-header">
                    <div className="db-card-title"><i className="fas fa-pie-chart"></i> Food Categories</div>
                  </div>
                  <div className="db-card-body" style={{height:240}}>
                    <Doughnut data={doughnutData} options={doughnutOpts} />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── All Donations tab (summary table) ── */}
          {activeTab==='donations' && (
            <>
              <div style={{marginBottom:20}}>
                <h2 style={{fontFamily:'var(--ff-head)',fontSize:'1.2rem',fontWeight:700,marginBottom:4}}>All Platform Donations</h2>
                <p style={{color:'var(--c-muted)',fontSize:'0.875rem'}}>Real-time overview of every donation across the platform.</p>
              </div>
              <div className="db-card">
                <div className="db-card-body" style={{padding:0}}>
                  <table className="db-table">
                    <thead>
                      <tr><th>#</th><th>Item</th><th>Donor</th><th>Quantity</th><th>Category</th><th>Expiry</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {[
                        {id:1,item:'Cooked Biryani',      donor:'Sunshine Hotel',  qty:'25 kg',       cat:'Cooked Food', exp:'2026-03-08', status:'available'},
                        {id:2,item:'Fresh Bread & Rolls', donor:'City Bakery',     qty:'10 kg',       cat:'Bakery',      exp:'2026-03-07', status:'reserved'},
                        {id:3,item:'Mixed Vegetables',    donor:'Fresh Mart',      qty:'15 kg',       cat:'Produce',     exp:'2026-03-09', status:'available'},
                        {id:4,item:'Dal & Rice',          donor:'Hotel Grandeur',  qty:'30 servings', cat:'Cooked Food', exp:'2026-03-07', status:'distributed'},
                        {id:5,item:'Fruit Platter',       donor:'Grand Catering',  qty:'8 kg',        cat:'Fruits',      exp:'2026-03-08', status:'available'},
                        {id:6,item:'Dairy Products',      donor:'Amul Booth',      qty:'20 litres',   cat:'Dairy',       exp:'2026-03-07', status:'distributed'},
                      ].map(d=>(
                        <tr key={d.id}>
                          <td style={{color:'var(--c-muted)',fontSize:'0.8rem'}}>#{d.id}</td>
                          <td style={{fontWeight:500}}>{d.item}</td>
                          <td style={{color:'var(--c-muted)'}}>{d.donor}</td>
                          <td>{d.qty}</td>
                          <td><span style={{background:'rgba(16,185,129,0.12)',color:'var(--c-primary)',padding:'2px 9px',borderRadius:'9999px',fontSize:'0.75rem',fontWeight:700}}>{d.cat}</span></td>
                          <td style={{fontSize:'0.82rem'}}>{d.exp}</td>
                          <td><span className={`db-badge ${d.status==='available'?'badge-orange':d.status==='reserved'?'badge-blue':'badge-gray'}`}>{d.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ── User Management ── */}
          {activeTab==='users' && (
            <>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:12}}>
                <div>
                  <h2 style={{fontFamily:'var(--ff-head)',fontSize:'1.2rem',fontWeight:700,marginBottom:4}}>Manage Users</h2>
                  <p style={{color:'var(--c-muted)',fontSize:'0.875rem'}}>{filteredUsers.length} of {users.length} users</p>
                </div>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  <input
                    className="db-input"
                    style={{width:200,padding:'7px 12px',fontSize:'0.85rem'}}
                    placeholder="Search name / email…"
                    value={userSearch}
                    onChange={e=>setUserSearch(e.target.value)}
                  />
                  {(['all','donor','ngo','volunteer'] as const).map(r=>(
                    <button key={r} className={`db-btn db-btn-sm ${roleFilter===r?'db-btn-primary':'db-btn-ghost'}`} onClick={()=>setRoleFilter(r)}>
                      {r.charAt(0).toUpperCase()+r.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="db-card">
                <div className="db-card-body" style={{padding:0}}>
                  <table className="db-table">
                    <thead>
                      <tr><th>User</th><th>Role</th><th>Joined</th><th>Activity</th><th>Status</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(u=>(
                        <tr key={u.id}>
                          <td>
                            <div style={{display:'flex',alignItems:'center',gap:10}}>
                              <div style={{
                                width:34,height:34,borderRadius:'50%',background:'linear-gradient(135deg,#10B981,#2563EB)',
                                display:'flex',alignItems:'center',justifyContent:'center',
                                color:'#fff',fontSize:'0.8rem',fontWeight:700,flexShrink:0,
                              }}>
                                {u.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)}
                              </div>
                              <div>
                                <div style={{fontWeight:600,fontSize:'0.88rem'}}>{u.name}</div>
                                <div style={{fontSize:'0.75rem',color:'var(--c-muted)'}}>{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td><span className={`db-badge ${ROLE_COLORS[u.role]||'badge-gray'}`}>{u.role}</span></td>
                          <td style={{fontSize:'0.82rem',color:'var(--c-muted)'}}>{u.joinDate}</td>
                          <td style={{fontSize:'0.82rem'}}>
                            {u.role==='donor'    && <span>{u.donations} donations</span>}
                            {u.role==='volunteer'&& <span>{u.pickups} pickups</span>}
                            {u.role==='ngo'      && <span>Active NGO</span>}
                          </td>
                          <td>
                            <span className={`db-badge ${u.status==='active'?'badge-green':u.status==='inactive'?'badge-gray':'badge-red'}`}>
                              {u.status}
                            </span>
                          </td>
                          <td>
                            <div style={{display:'flex',gap:6}}>
                              <button
                                className={`db-btn db-btn-sm ${u.status==='active'?'db-btn-danger':'db-btn-success'}`}
                                onClick={()=>handleStatusToggle(u.id)}
                              >
                                {u.status==='active'?'Suspend':'Restore'}
                              </button>
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

        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
