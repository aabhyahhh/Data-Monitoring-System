import { NavLink, useNavigate } from 'react-router-dom';
import { FiGrid, FiUser, FiLogOut } from 'react-icons/fi';
import logo from '../assets/logo.png';
import { useAuth } from '../context/AuthContext';

const sidebarStyle = {
  width: '240px',
  height: '100vh',
  background: '#fff',
  color: '#222',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch', // changed from 'flex-start' to 'stretch'
  padding: '32px 0',
  position: 'fixed',
  top: 0,
  left: 0,
  boxShadow: '2px 0 12px rgba(0,0,0,0.08)',
  zIndex: 1000,
  borderRight: '1px solid #f0f0f0',
  overflowY: 'auto', // add vertical scroll
};

const logoStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  fontWeight: 700,
  fontSize: '1.7rem',
  marginBottom: 40,
  marginLeft: 32,
  letterSpacing: 1,
  width: '100%',
};

const logoImgStyle = {
  width: 32,
  height: 32,
  objectFit: 'contain',
};

const linkStyle = {
  padding: '14px 32px',
  width: '100%',
  color: '#222',
  textDecoration: 'none',
  fontWeight: 600,
  fontSize: '1.08rem',
  border: 'none',
  background: 'none',
  textAlign: 'left',
  transition: 'background 0.18s, color 0.18s',
  borderRadius: '12px',
  marginBottom: '10px',
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  outline: 'none',
  overflow: 'hidden',
};

const activeLinkStyle = {
  background: 'linear-gradient(90deg, #e3f0ff 0%, #f7faff 100%)',
  color: '#357ABD',
  boxShadow: '0 2px 12px 0 rgba(74,144,226,0.07)',
};

const logoutButtonStyle = {
  ...linkStyle,
  background: 'linear-gradient(90deg, #e3f0ff 0%, #f7faff 100%)', // blue gradient
  color: '#357ABD', // blue text
  border: '1px solid #b3d1f7', // blue border
  boxShadow: '0 2px 12px 0 rgba(53,122,189,0.07)', // blue shadow
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  cursor: 'pointer',
};

export default function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  return (
    <nav style={sidebarStyle}>
      <div style={logoStyle}>
        <img src={logo} alt="Logo" style={logoImgStyle} />
        <span>Cibos</span>
      </div>
      <NavLink
        to="/dashboard"
        style={({ isActive }) => isActive ? { ...linkStyle, ...activeLinkStyle } : linkStyle}
      >
        <FiGrid size={20} /> Dashboard
      </NavLink>
      <NavLink
        to="/users"
        style={({ isActive }) => isActive ? { ...linkStyle, ...activeLinkStyle } : linkStyle}
      >
        <FiUser size={20} /> Users
      </NavLink>
      <div style={{ width: '100%', borderTop: '1px solid #f0f0f0', margin: '16px 0' }} />
      <button
        style={{ ...logoutButtonStyle, width: '100%' }}
        onClick={() => {
          logout();
          navigate('/login');
        }}
        tabIndex={0}
      >
        <FiLogOut size={20} /> Logout
      </button>
    </nav>
  );
} 