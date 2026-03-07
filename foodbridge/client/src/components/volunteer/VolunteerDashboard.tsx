import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../common/Dashboard.css';

// Fix default leaflet icon paths broken by Vite bundling
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/* ── Custom marker icons ── */
function divIcon(bg: string, faClass: string) {
  return L.divIcon({
    html: `<div style="background:${bg};width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px ${bg}66;border:3px solid #fff;font-size:14px;color:#fff;"><i class="fas ${faClass}"></i></div>`,
    className: '',
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -22],
  });
}

const iconDonor   = divIcon('#10B981', 'fa-utensils');
const iconNgo     = divIcon('#F97316', 'fa-building');
const iconSelf    = divIcon('#2563EB', 'fa-motorcycle');

interface PickupRequest {
  id: string;
  foodTitle: string;
  donor: string;
  address: string;
  distance: string;
  weight: string;
  expiryIn: string;
  ngo: string;
  ngoAddress: string;
  status: 'available' | 'accepted' | 'in-transit' | 'completed';
  donorPos: [number, number];
  ngoPos:   [number, number];
}

const MOCK_PICKUPS: PickupRequest[] = [
  { id:'1', foodTitle:'Cooked Biryani (25kg)',  donor:'Sunshine Hotel',    address:'12 MG Road, Bengaluru',     distance:'0.8 km',  weight:'25 kg',  expiryIn:'2 hrs',  ngo:'Helping Hands NGO',   ngoAddress:'44 Residency Rd',    status:'available',  donorPos:[28.6250,77.2080], ngoPos:[28.6200,77.1900] },
  { id:'2', foodTitle:'Fresh Bread (10kg)',     donor:'City Bakery',       address:'5 Park St, Bengaluru',      distance:'1.4 km',  weight:'10 kg',  expiryIn:'4 hrs',  ngo:'City Care Foundation', ngoAddress:'8 Brigade Rd',       status:'available',  donorPos:[28.6180,77.2150], ngoPos:[28.6350,77.2200] },
  { id:'3', foodTitle:'Mixed Vegetables (15kg)',donor:'Fresh Mart',        address:'88 Church St, Bengaluru',   distance:'2.1 km',  weight:'15 kg',  expiryIn:'6 hrs',  ngo:'Green Hope Trust',    ngoAddress:'16 Commercial St',   status:'accepted',   donorPos:[28.6080,77.2250], ngoPos:[28.6320,77.1950] },
  { id:'4', foodTitle:'Dal & Rice (30 srv)',    donor:'Hotel Grandeur',    address:'4 Infantry Rd, Bengaluru',  distance:'3.5 km',  weight:'30 srv', expiryIn:'1 hr',   ngo:'Annadanam Trust',     ngoAddress:'Majestic Bus Stand',  status:'available',  donorPos:[28.6139,77.2090], ngoPos:[28.6260,77.2150] },
];

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 1) {
      map.fitBounds(L.latLngBounds(positions), { padding: [40, 40] });
    }
  }, [map, positions]);
  return null;
}

const VolunteerDashboard: React.FC = () => {
  const user = useSelector((state: any) => state.auth.user);
  const [activeTab, setActiveTab] = useState<'pickups'|'map'|'history'>('pickups');
  const [pickups, setPickups] = useState<PickupRequest[]>(MOCK_PICKUPS);
  const [selectedPickup, setSelectedPickup] = useState<PickupRequest | null>(null);

  const handleAccept = (id: string) => {
    setPickups(prev => prev.map(p => p.id === id ? { ...p, status: 'accepted' } : p));
    const p = pickups.find(p => p.id === id);
    if (p) { setSelectedPickup({ ...p, status: 'accepted' }); setActiveTab('map'); }
  };

  const handleComplete = (id: string) => {
    setPickups(prev => prev.map(p => p.id === id ? { ...p, status: 'completed' } : p));
    setSelectedPickup(null);
    setActiveTab('history');
  };

  const myPos: [number, number] = [28.6160, 77.2120];
  const stats = {
    available:  pickups.filter(p => p.status === 'available').length,
    accepted:   pickups.filter(p => p.status === 'accepted' || p.status === 'in-transit').length,
    completed:  pickups.filter(p => p.status === 'completed').length,
  };

  const initials = user?.name ? user.name.split(' ').map((n:string)=>n[0]).join('').toUpperCase().slice(0,2) : 'VL';
  const displayName = user?.name || 'Volunteer';

  return (
    <div className="db-layout">
      {/* ── Sidebar ── */}
      <aside className="db-sidebar">
        <a href="/" className="db-logo"><i className="fas fa-leaf"></i> FoodBridge</a>
        <nav className="db-nav">
          <div className="db-nav-section">
            <div className="db-nav-label">Volunteer Menu</div>
            <button className={`db-nav-item ${activeTab==='pickups'?'active':''}`} onClick={()=>setActiveTab('pickups')}>
              <i className="fas fa-list-check"></i> Nearby Pickups
              {stats.available > 0 && <span className="notif-badge"></span>}
            </button>
            <button className={`db-nav-item ${activeTab==='map'?'active':''}`} onClick={()=>setActiveTab('map')}>
              <i className="fas fa-map-location-dot"></i> Live Map
            </button>
            <button className={`db-nav-item ${activeTab==='history'?'active':''}`} onClick={()=>setActiveTab('history')}>
              <i className="fas fa-trophy"></i> Completed
            </button>
          </div>
          <div className="db-nav-section">
            <div className="db-nav-label">Account</div>
            <a href="/profile"  className="db-nav-item"><i className="fas fa-user"></i> Profile</a>
            <a href="/logout"   className="db-nav-item" style={{color:'#EF4444'}}><i className="fas fa-right-from-bracket"></i> Logout</a>
          </div>
        </nav>
        <div className="db-user-block">
          <div className="db-avatar" style={{background:'linear-gradient(135deg,#2563EB,#1D4ED8)'}}>{initials}</div>
          <div><div className="db-user-name">{displayName}</div><div className="db-user-role">Volunteer</div></div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="db-main">
        <div className="db-topbar">
          <div className="db-topbar-title">
            {activeTab==='pickups' && '🛵 Nearby Pickup Requests'}
            {activeTab==='map'     && '🗺️ Live Pickup Map'}
            {activeTab==='history' && '🏆 Completed Deliveries'}
          </div>
          <div className="db-topbar-right">
            <button className="db-btn db-btn-ghost db-btn-sm"><i className="fas fa-bell"></i></button>
            <span className="db-badge badge-green" style={{padding:'6px 14px'}}>
              <i className="fas fa-circle" style={{fontSize:'0.5rem',marginRight:6}}></i> Online
            </span>
          </div>
        </div>

        <div className="db-content">

          {/* ── Nearby Pickups ── */}
          {activeTab==='pickups' && (
            <>
              <div className="db-stats-row" style={{marginBottom:28}}>
                {[
                  {ico:'fa-clock',       bg:'rgba(249,115,22,0.1)', color:'var(--c-accent)',    num:stats.available, lbl:'Available Now'},
                  {ico:'fa-motorcycle',  bg:'rgba(37,99,235,0.1)',  color:'var(--c-secondary)', num:stats.accepted,  lbl:'In Progress'},
                  {ico:'fa-circle-check',bg:'rgba(16,185,129,0.1)', color:'var(--c-primary)',   num:stats.completed, lbl:'Completed Today'},
                  {ico:'fa-star',        bg:'rgba(239,199,0,0.1)',  color:'#D97706',            num:48,              lbl:'Impact Points'},
                ].map((s,i)=>(
                  <div className="db-stat-chip" key={i}>
                    <div className="db-stat-ico" style={{background:s.bg}}><i className={`fas ${s.ico}`} style={{color:s.color}}></i></div>
                    <div><div className="db-stat-num">{s.num}</div><div className="db-stat-lbl">{s.lbl}</div></div>
                  </div>
                ))}
              </div>

              <div className="pickup-cards-grid">
                {pickups.filter(p => p.status==='available'||p.status==='accepted').map(p=>(
                  <div className="pickup-card" key={p.id} style={{ '--accent': p.status==='accepted'?'#2563EB':'var(--c-primary)' } as React.CSSProperties}>
                    <div style={{position:'absolute',top:0,left:0,width:4,height:'100%',background:p.status==='accepted'?'var(--c-secondary)':'var(--c-primary)',borderRadius:'4px 0 0 4px'}}></div>
                    <div className="pickup-card-header">
                      <div>
                        <div className="pickup-card-title" style={{paddingLeft:8}}>{p.foodTitle}</div>
                        <div style={{fontSize:'0.8rem',color:'var(--c-muted)',paddingLeft:8,marginTop:3}}>
                          <i className="fas fa-store" style={{marginRight:5}}></i>{p.donor}
                        </div>
                      </div>
                      <span className={`db-badge ${p.status==='accepted'?'badge-blue':'badge-orange'}`}>
                        {p.status==='accepted'?'Accepted':'Available'}
                      </span>
                    </div>
                    <div style={{paddingLeft:8,marginTop:12,display:'flex',flexDirection:'column',gap:7}}>
                      {[
                        ['fa-location-dot','Pickup:', p.address],
                        ['fa-building',    'Drop-off:', p.ngoAddress],
                        ['fa-route',       'Distance:', p.distance],
                        ['fa-weight-hanging','Weight:',  p.weight],
                        ['fa-clock',       'Expires in:', p.expiryIn],
                      ].map(([ico,lbl,val],i)=>(
                        <div key={i} style={{display:'flex',alignItems:'center',gap:8,fontSize:'0.82rem',color:'var(--c-muted)'}}>
                          <i className={`fas ${ico}`} style={{color:'var(--c-primary)',width:14,textAlign:'center'}}></i>
                          <span style={{fontWeight:600,color:'var(--c-text)',minWidth:70}}>{lbl}</span>
                          <span>{val}</span>
                        </div>
                      ))}
                    </div>
                    <div className="pickup-card-actions">
                      {p.status==='available' && (
                        <button className="db-btn db-btn-primary" onClick={()=>handleAccept(p.id)}>
                          <i className="fas fa-check"></i> Accept Pickup
                        </button>
                      )}
                      {p.status==='accepted' && (
                        <>
                          <button className="db-btn db-btn-secondary" onClick={()=>{setSelectedPickup(p);setActiveTab('map');}}>
                            <i className="fas fa-map"></i> View on Map
                          </button>
                          <button className="db-btn db-btn-success" onClick={()=>handleComplete(p.id)}>
                            <i className="fas fa-circle-check"></i> Mark Delivered
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── Live Map ── */}
          {activeTab==='map' && (
            <>
              {selectedPickup && (
                <div style={{background:'#EFF6FF',border:'1px solid #BFDBFE',borderRadius:'var(--r-md)',padding:'14px 18px',marginBottom:20,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,fontSize:'0.9rem'}}>
                    <i className="fas fa-route" style={{color:'var(--c-secondary)'}}></i>
                    <span style={{fontFamily:'var(--ff-head)',fontWeight:600,color:'var(--c-secondary)'}}>Active route:</span>
                    <span>{selectedPickup.donor}</span>
                    <i className="fas fa-arrow-right" style={{opacity:0.5}}></i>
                    <span>{selectedPickup.ngo}</span>
                  </div>
                  <button className="db-btn db-btn-success db-btn-sm" onClick={()=>handleComplete(selectedPickup.id)}>
                    <i className="fas fa-circle-check"></i> Mark Delivered
                  </button>
                </div>
              )}
              <div className="db-card" style={{overflow:'hidden'}}>
                <div className="db-card-header" style={{paddingBottom:12}}>
                  <div className="db-card-title"><i className="fas fa-map-location-dot"></i> Live Pickup Map</div>
                  <div style={{display:'flex',gap:12,fontSize:'0.8rem',color:'var(--c-muted)'}}>
                    <span><span style={{display:'inline-block',width:10,height:10,borderRadius:'50%',background:'#10B981',marginRight:5}}></span>Donor</span>
                    <span><span style={{display:'inline-block',width:10,height:10,borderRadius:'50%',background:'#2563EB',marginRight:5}}></span>You</span>
                    <span><span style={{display:'inline-block',width:10,height:10,borderRadius:'50%',background:'#F97316',marginRight:5}}></span>NGO</span>
                  </div>
                </div>
                <MapContainer
                  center={myPos}
                  zoom={13}
                  style={{ width:'100%', height:440 }}
                  scrollWheelZoom={false}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />
                  {/* My location */}
                  <Marker position={myPos} icon={iconSelf}>
                    <Popup><strong>Your Location</strong><br/>Ready for pickup</Popup>
                  </Marker>
                  {/* All donor markers */}
                  {pickups.map(p=>(
                    <Marker key={p.id} position={p.donorPos} icon={iconDonor}>
                      <Popup><strong>{p.donor}</strong><br/>{p.foodTitle}<br/><span style={{color:'var(--c-muted)',fontSize:'0.8rem'}}>{p.address}</span></Popup>
                    </Marker>
                  ))}
                  {/* All NGO markers */}
                  {pickups.map(p=>(
                    <Marker key={`ngo-${p.id}`} position={p.ngoPos} icon={iconNgo}>
                      <Popup><strong>{p.ngo}</strong><br/>{p.ngoAddress}</Popup>
                    </Marker>
                  ))}
                  {/* Active route */}
                  {selectedPickup && (
                    <Polyline
                      positions={[myPos, selectedPickup.donorPos, selectedPickup.ngoPos]}
                      pathOptions={{ color:'#2563EB', weight:3, dashArray:'8 6', opacity:0.85 }}
                    />
                  )}
                  <FitBounds positions={selectedPickup
                    ? [myPos, selectedPickup.donorPos, selectedPickup.ngoPos]
                    : [myPos, ...pickups.map(p=>p.donorPos)]}
                  />
                </MapContainer>
              </div>
            </>
          )}

          {/* ── Completed Deliveries ── */}
          {activeTab==='history' && (
            <>
              <div style={{marginBottom:24}}>
                <h2 style={{fontFamily:'var(--ff-head)',fontSize:'1.2rem',fontWeight:700,marginBottom:4}}>Completed Deliveries</h2>
                <p style={{color:'var(--c-muted)',fontSize:'0.875rem'}}>{stats.completed} deliveries completed</p>
              </div>
              {stats.completed === 0 ? (
                <div style={{textAlign:'center',padding:'60px 20px',color:'var(--c-subtle)'}}>
                  <i className="fas fa-truck-fast" style={{fontSize:'3rem',display:'block',marginBottom:16,opacity:0.4}}></i>
                  <p style={{fontFamily:'var(--ff-head)',fontWeight:600,fontSize:'1rem',marginBottom:8}}>No deliveries yet</p>
                  <p style={{fontSize:'0.875rem'}}>Accept a pickup request to get started!</p>
                  <button className="db-btn db-btn-primary" style={{marginTop:20}} onClick={()=>setActiveTab('pickups')}>
                    View Pickups
                  </button>
                </div>
              ) : (
                <div className="db-card">
                  <div className="db-card-body" style={{padding:0}}>
                    <table className="db-table">
                      <thead><tr><th>Food Item</th><th>Donor</th><th>NGO</th><th>Distance</th><th>Status</th></tr></thead>
                      <tbody>
                        {pickups.filter(p=>p.status==='completed').map(p=>(
                          <tr key={p.id}>
                            <td>{p.foodTitle}</td>
                            <td>{p.donor}</td>
                            <td>{p.ngo}</td>
                            <td>{p.distance}</td>
                            <td><span className="db-badge badge-green">✅ Delivered</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </main>
    </div>
  );
};

export default VolunteerDashboard;
