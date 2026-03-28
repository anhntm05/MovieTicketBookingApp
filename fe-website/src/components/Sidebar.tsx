import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: 'DB' },
  { to: '/revenue', label: 'Revenue', icon: 'RV' },
  { to: '/movies', label: 'Movies', icon: 'MV' },
  { to: '/users', label: 'Users', icon: 'US' },
  { to: '/cinemas', label: 'Cinemas', icon: 'CN' },
  { to: '/profile', label: 'Profile', icon: 'PR' },
];

export const Sidebar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <aside className="sidebar">
      <div>
        <div className="brand-block">
          <div className="brand-mark">M</div>
          <div>
            <p className="brand-kicker">ADMIN WEBSITE</p>
            <h1 className="brand-title">Mavis Control</h1>
          </div>
        </div>

        <nav className="nav-list" aria-label="Admin navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link${isActive ? ' nav-link-active' : ''}`}
            >
              <span className="nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="sidebar-footer">
        <div className="account-badge">
          <p className="account-name">{user?.fullName || 'Admin User'}</p>
          <p className="account-role">{user?.email}</p>
        </div>

        <button
          type="button"
          className="ghost-button"
          onClick={() => {
            logout();
            navigate('/login', { replace: true });
          }}
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
};
