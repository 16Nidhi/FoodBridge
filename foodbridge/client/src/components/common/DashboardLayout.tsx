import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import './Dashboard.css';

interface DashboardLayoutProps {
  children: React.ReactNode;
  sidebarItems: {
    label: string;
    icon: string;
    tab: string;
    notifCount?: number;
  }[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  hideHeaderTitle?: boolean;
  user?: any;
  handleLogout?: () => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, sidebarItems, activeTab, setActiveTab }) => {
  const user = useSelector((state: any) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.classList.add('db-sidebar-open');
    } else {
      document.body.classList.remove('db-sidebar-open');
    }
    return () => document.body.classList.remove('db-sidebar-open');
  }, [sidebarOpen]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    dispatch(logout());
    navigate('/login');
  };

  const displayName = user?.name || 'User';
  const initials = user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'US';

  // Helper: check whether children already render a top-level title to avoid duplicates
  const containsPageTitle = (node: any): boolean => {
    if (!node) return false;
    if (Array.isArray(node)) return node.some(n => containsPageTitle(n));
    if (typeof node !== 'object') return false;
    const type = node.type;
    const props = node.props || {};
    // If the child is an h1 element, assume it provides the page title
    if (type === 'h1') return true;
    // If the child has a classname commonly used for page titles, detect it
    const cn = props.className || '';
    if (typeof cn === 'string' && (cn.includes('db-title') || cn.includes('profile-header') || cn.includes('profile-page') || cn.includes('page-title'))) return true;
    // Recurse into children
    if (props.children) return containsPageTitle(props.children);
    return false;
  };

  return (
    <div className="db-layout">
      {sidebarOpen && <div className="db-overlay" onClick={() => setSidebarOpen(false)} />}

      <aside className={`db-sidebar${sidebarOpen ? ' open' : ''}`}>
        <Link to="/" className="db-logo"><i className="fas fa-leaf"></i> FoodBridge</Link>
        <nav className="db-nav">
          <div className="db-nav-section">
            <div className="db-nav-label">Menu</div>
            {sidebarItems.map(({ label, icon, tab, notifCount }) => (
              <button
                key={tab}
                className={`db-nav-item${activeTab === tab ? ' active' : ''}`}
                onClick={() => {
                  setActiveTab(tab);
                  setSidebarOpen(false);
                }}
              >
                                <i className={`fas ${icon}`}></i> {label}
                {notifCount != null && notifCount > 0 && (
                  <span className="notif-badge">{notifCount}</span>
                )}
              </button>
            ))}
          </div>
          <div className="db-nav-section">
            <div className="db-nav-label">System</div>
            <Link to="/profile" className="db-nav-item"><i className="fas fa-user"></i> Profile</Link>
            <Link to="/" className="db-nav-item"><i className="fas fa-earth-asia"></i> View Site</Link>
            <button className="db-nav-item" style={{ color: 'var(--c-danger)' }} onClick={handleLogout}>
              <i className="fas fa-right-from-bracket"></i> Logout
            </button>
          </div>
        </nav>
        <div className="db-user-block">
          <div className="db-user-avatar">{initials}</div>
          <div className="db-user-info">
            <div className="db-user-name">{displayName}</div>
            <div className="db-user-role">{user?.role}</div>
          </div>
        </div>
      </aside>

      <main className="db-main">
        <header className="db-header">
          <button className="db-menu-toggle" onClick={() => setSidebarOpen(true)}>
            <i className="fas fa-bars"></i>
          </button>
          {!containsPageTitle(children) && (
            <h1>{sidebarItems.find(item => item.tab === activeTab)?.label || 'Dashboard'}</h1>
          )}
        </header>
        <div className="db-content">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
