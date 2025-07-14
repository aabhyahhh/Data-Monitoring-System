import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { login as apiLogin } from './services/api';
import { AuthProvider, useAuth } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import { getStoves, addStove, updateStove } from './services/api';
import StoveForm from './StoveForm';
import { getLogsByStoveId } from './services/api';
import Unauthorized from './Unauthorized';
import Sidebar from './components/Sidebar';
import { FiUser, FiShoppingCart, FiDollarSign, FiBox, FiClock } from 'react-icons/fi';
import UsersPage from './components/UsersPage';
import { getCookingSessionsLast24h } from './services/api';
import { getTotalCookingMinutes } from './services/api';
import { FaFire } from 'react-icons/fa';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import marker from './assets/marker.png';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const data = await apiLogin(username, password);
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      alert('Login successful!');
      navigate('/dashboard');
    } catch (err) {
      setError('Login failed');
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 0,
      margin: 0
    }}>
      <form onSubmit={handleSubmit} style={{
        background: '#fff',
        borderRadius: 20,
        minWidth: 350,
        maxWidth: '95vw',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: '1px solid #e2e8f0',
        padding: 40,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 24
      }}>
        <h2 style={{color:'#1a202c',marginBottom:8,fontSize:'2rem',fontWeight:700,letterSpacing:'-0.02em'}}>Login</h2>
        <div style={{width:'100%',marginBottom:8}}>
          <label style={{color:'#4a5568',fontWeight:500,marginBottom:8,display:'block',fontSize:'1rem'}}>Username:</label>
          <input value={username} onChange={e => setUsername(e.target.value)} required style={{width:'100%',padding:'12px',borderRadius:8,border:'1px solid #e2e8f0',background:'#f8fafc',color:'#222',fontSize:'1rem',outline:'none',transition:'border 0.2s'}} />
        </div>
        <div style={{width:'100%',marginBottom:8}}>
          <label style={{color:'#4a5568',fontWeight:500,marginBottom:8,display:'block',fontSize:'1rem'}}>Password:</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{width:'100%',padding:'12px',borderRadius:8,border:'1px solid #e2e8f0',background:'#f8fafc',color:'#222',fontSize:'1rem',outline:'none',transition:'border 0.2s'}} />
        </div>
        <button type="submit" style={{
          padding: '14px 32px',
          fontSize: '1rem',
          fontWeight: '600',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 15px rgba(74, 144, 226, 0.13)',
          marginTop: 8
        }}
        onMouseOver={e => {
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0 8px 30px rgba(74, 144, 226, 0.18)';
        }}
        onMouseOut={e => {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = '0 4px 15px rgba(74, 144, 226, 0.13)';
        }}
        >
          Login
        </button>
        {error && <div style={{color:'#E74C3C',marginTop:8,fontWeight:500}}>{error}</div>}
      </form>
    </div>
  );
}

function Dashboard() {
  const { role } = useAuth();
  const [stovesCount, setStovesCount] = useState(null);
  const [sessions24h, setSessions24h] = useState(null);
  const [totalMinutes, setTotalMinutes] = useState(null);
  const navigate = useNavigate();
  const [stoves, setStoves] = useState([]);
  useEffect(() => {
    getStoves().then(stoves => {
      setStoves(stoves);
      setStovesCount(Array.isArray(stoves) ? stoves.length : 0);
    });
    getCookingSessionsLast24h().then(res => setSessions24h(res.count));
    getTotalCookingMinutes().then(res => setTotalMinutes(res.totalMinutes));
  }, []);
  const [error, setError] = useState('');
  const [selectedStove, setSelectedStove] = useState(null);
  const [logs, setLogs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editLog, setEditLog] = useState(null);
  const [selectedStoveId, setSelectedStoveId] = useState(null);

  async function handleViewLogs(stove) {
    setSelectedStove(stove);
    setSelectedStoveId(stove.stove_id);
    setShowModal(true);
    try {
      const data = await getLogsByStoveId(stove.stove_id);
      setLogs(data.logs || []);
    } catch {
      setLogs([]);
    }
  }

  function closeModal() {
    setShowModal(false);
    setLogs([]);
    setSelectedStove(null);
  }

  function handleAddEntry() {
    setShowForm(true);
  }
  async function handleFormSubmit(data) {
    try {
      await addStove(data);
      setShowForm(false);
      // Refresh stove list
      const updated = await getStoves();
      setStovesCount(Array.isArray(updated) ? updated.length : 0);
    } catch (err) {
      if (err.message.includes('403')) navigate('/unauthorized');
      else alert('Failed to add stove');
    }
  }

  function handleEditLog(log) {
    setEditLog(log);
  }
  async function handleEditLogSubmit(updatedLog) {
    try {
      // Replace the edited log in the logs array
      const newLogs = logs.map(log => log === editLog ? updatedLog : log);
      await updateStove(selectedStove._id, { ...selectedStove, logs: newLogs });
      setEditLog(null);
      // Refresh logs from backend
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/stoves/${selectedStove._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      if (err.message.includes('403')) navigate('/unauthorized');
      else alert('Failed to update log');
    }
  }

  async function handleDeleteLog(logToDelete) {
    try {
      const newLogs = logs.filter(log => log !== logToDelete);
      await updateStove(selectedStove._id, { ...selectedStove, logs: newLogs });
      // Refresh logs from backend
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/stoves/${selectedStove._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      if (err.message.includes('403')) navigate('/unauthorized');
      else alert('Failed to delete log');
    }
  }

  // Example stats (replace with real data as needed)
  const stats = [
    {
      label: 'Total Stoves Deployed',
      value: stovesCount === null ? '...' : stovesCount,
      sub: (
        <span style={{ cursor: 'pointer', textDecoration: 'underline', color: '#4A90E2', fontWeight: '500' }} onClick={() => navigate('/users')}>
          See all stoves
        </span>
      ),
      icon: <FiBox size={20} />,
      color: '#4A90E2'
    },
    {
      label: 'Cooking Sessions in Last 24 Hours',
      value: sessions24h === null ? '...' : sessions24h,
      sub: null,
      icon: <FiClock size={20} />,
      color: '#27AE60'
    },
    {
      label: 'Minutes Cooked on Solar Cookstove',
      value: totalMinutes === null ? '...' : totalMinutes,
      sub: null,
      icon: <FaFire size={20} />,
      color: '#E74C3C'
    },
  ];

  // Merge stoves by stove_id for map markers
  const mergedStoves = Object.values(
    stoves.reduce((acc, stove) => {
      if (!acc[stove.stove_id]) {
        acc[stove.stove_id] = {
          stove_id: stove.stove_id,
          location: stove.location,
          latitude: stove.latitude,
          longitude: stove.longitude,
          logs: Array.isArray(stove.logs) ? [...stove.logs] : []
        };
      } else {
        // Prefer the entry with latitude/longitude
        if (stove.latitude && stove.longitude) {
          acc[stove.stove_id].latitude = stove.latitude;
          acc[stove.stove_id].longitude = stove.longitude;
        }
        // Combine logs
        if (Array.isArray(stove.logs) && stove.logs.length > 0) {
          acc[stove.stove_id].logs = acc[stove.stove_id].logs.concat(stove.logs);
        }
      }
    return acc;
    }, {})
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '40px clamp(16px, 5vw, 40px)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        width: '100%'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '50px'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            color: '#1a202c',
            marginBottom: '10px',
            letterSpacing: '-0.02em'
          }}>
            Solar Cookstove Dashboard
          </h1>
          <p style={{
            fontSize: '1.1rem',
            color: '#718096',
            fontWeight: '400'
          }}>
            Monitor and track your solar cooking activities
          </p>
          </div>

        {/* Stats cards row */}
            <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '30px',
          marginBottom: '50px'
        }}>
          {stats.map((stat, i) => (
            <div key={stat.label} style={{
              background: '#ffffff',
              borderRadius: '20px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              padding: '35px 30px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
              border: '1px solid #e2e8f0',
              minHeight: '180px',
              textAlign: 'center',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              cursor: 'default'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
            }}>
              {/* Icon with colored background */}
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: `${stat.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
                color: stat.color
              }}>
                {stat.icon}
              </div>
              
                <div style={{
                fontSize: '1.1rem',
                fontWeight: '600',
                color: '#4a5568',
                marginBottom: '15px',
                lineHeight: '1.4'
                  }}>
                {stat.label}
              </div>
              
              <div style={{
                fontSize: '3rem',
                fontWeight: '700',
                color: '#1a202c',
                marginBottom: '15px',
                lineHeight: '1'
              }}>
                {stat.value}
      </div>
              
              {stat.sub && (
                <div style={{
                  fontSize: '0.9rem',
                  color: '#718096'
                }}>
                  {stat.sub}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Map section */}
        <div style={{
          background: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          marginBottom: '40px',
          padding: 0
        }}>
          <div style={{
            padding: '30px 30px 20px 30px',
            borderBottom: '1px solid #e2e8f0'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#1a202c',
              margin: '0',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: '#4A90E215',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#4A90E2'
              }}>
                🗺️
              </span>
              Stove Locations
            </h2>
          </div>
          
          <div style={{
            width: '100%',
            height: '500px',
            margin: 0,
            padding: 0,
            display: 'flex'
          }}>
            <MapContainer center={[22.9734, 78.6569]} zoom={5} style={{ flex: 1, height: '100%' }} scrollWheelZoom={true}>
              <TileLayer
                attribution='&copy; <a href="https://carto.com/attributions">CLEAN COOKING</a>'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              />
              {mergedStoves.filter(s => s.latitude && s.longitude).map(stove => (
                <Marker
                  key={stove.stove_id}
                  position={[stove.latitude, stove.longitude]}
                  icon={L.icon({
                    iconUrl: marker, // your red pin image
                    iconSize: [41, 41],
                    iconAnchor: [20.5, 41], // center bottom of the icon
                    popupAnchor: [0, -41],  // above the tip
                    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
                    shadowSize: [41, 41],
                    shadowAnchor: [13, 41] // matches Leaflet's default shadow position
                  })}
                >
                  <Popup>
                    <div style={{
                      minWidth: '150px',
                      padding: '5px'
                    }}>
                      <div style={{
                        fontWeight: '600',
                        color: '#1a202c',
                        marginBottom: '8px',
                        fontSize: '0.9rem'
                      }}>
                        <b>Stove ID:</b> {stove.stove_id}
                      </div>
                      <div style={{
                        color: '#4a5568',
                        fontSize: '0.85rem'
                      }}>
                        <b>Logs:</b> {Array.isArray(stove.logs) ? stove.logs.length : 0}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditLogModal({ log, onClose, onSubmit }) {
  const [form, setForm] = useState({ ...log });
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }
  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(form);
  }
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      zIndex: 2001,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <form onSubmit={handleSubmit} style={{
        background: 'rgba(40, 40, 40, 0.95)',
        borderRadius: 20,
        minWidth: 400,
        maxWidth: '95vw',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: 32
      }}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
          <h3 style={{color:'#fff',margin:0,fontSize:'1.5rem',fontWeight:600}}>Edit Log</h3>
          <button type="button" onClick={onClose} style={{
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            color: '#fff',
            padding: '10px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '500',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={e => e.target.style.background = 'rgba(255,255,255,0.2)'}
          onMouseOut={e => e.target.style.background = 'rgba(255,255,255,0.1)'}
          >Close</button>
        </div>
        <div><label style={{color:'#fff'}}>Date: <input type="date" name="date" value={form.date?.slice(0,10) || ''} onChange={handleChange} required style={{margin:'8px',padding:'6px',borderRadius:4,border:'1px solid #444',background:'#222',color:'#fff'}} /></label></div>
        <div><label style={{color:'#fff'}}>Start Time: <input type="time" name="start_time" value={form.start_time} onChange={handleChange} required style={{margin:'8px',padding:'6px',borderRadius:4,border:'1px solid #444',background:'#222',color:'#fff'}} /></label></div>
        <div><label style={{color:'#fff'}}>End Time: <input type="time" name="end_time" value={form.end_time} onChange={handleChange} required style={{margin:'8px',padding:'6px',borderRadius:4,border:'1px solid #444',background:'#222',color:'#fff'}} /></label></div>
        <div><label style={{color:'#fff'}}>Duration (min): <input name="duration" value={form.duration} onChange={handleChange} required style={{margin:'8px',padding:'6px',borderRadius:4,border:'1px solid #444',background:'#222',color:'#fff'}} /></label></div>
        <div><label style={{color:'#fff'}}>Cooking Time (min): <input name="cooking_time" value={form.cooking_time} onChange={handleChange} required style={{margin:'8px',padding:'6px',borderRadius:4,border:'1px solid #444',background:'#222',color:'#fff'}} /></label></div>
        <div><label style={{color:'#fff'}}>Wattage (W): <input name="wattage_W" value={form.wattage_W} onChange={handleChange} required style={{margin:'8px',padding:'6px',borderRadius:4,border:'1px solid #444',background:'#222',color:'#fff'}} /></label></div>
        <button type="submit" style={{marginTop:18,padding:'12px 28px',borderRadius:8,background:'linear-gradient(135deg, #ffc107 0%, #ffb300 100%)',color:'#000',border:'none',fontWeight:600,fontSize:'1rem',cursor:'pointer',boxShadow:'0 4px 15px rgba(255,193,7,0.2)',transition:'all 0.3s ease'}}>Save</button>
      </form>
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB'); // dd/mm/yyyy
}
function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const date = new Date();
  date.setHours(Number(h), Number(m));
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function AppLayout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', background: '#f7faff' }}>
      <Sidebar />
      <div style={{ flex: 1, background: '#f7faff', marginLeft: 240 }}>
        {children}
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={
            <PrivateRoute>
              <AppLayout>
              <Dashboard />
              </AppLayout>
            </PrivateRoute>
          } />
          <Route path="/users" element={
            <PrivateRoute>
              <AppLayout>
                <UsersPage />
              </AppLayout>
            </PrivateRoute>
          } />
          <Route path="/unauthorized" element={<Unauthorized />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
