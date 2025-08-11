import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { useState, useEffect, lazy, Suspense } from 'react';
import { login as apiLogin } from './services/api';
import { AuthProvider, useAuth } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import { getStoves, addStove, updateStove } from './services/api';
import StoveForm from './StoveForm';
import { getLogsByStoveId } from './services/api';
import Unauthorized from './Unauthorized';
import Sidebar from './components/Sidebar';
import { FiUser, FiShoppingCart, FiDollarSign, FiBox, FiClock } from 'react-icons/fi';
// Replace direct imports with lazy imports
// import UsersPage from './components/UsersPage';
const UsersPage = lazy(() => import('./components/UsersPage'));
import { getCookingSessionsLast24h } from './services/api';
import { getTotalCookingMinutes } from './services/api';
import { FaFire } from 'react-icons/fa';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import marker from './assets/marker.png';
import { getTotalLogsCount } from './services/api';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const data = await apiLogin(username, password);
      login(data.token, data.role);
      alert('Login successful!');
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed: ' + (err.message || 'Unknown error'));
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
  const [totalSessions, setTotalSessions] = useState(null);
  const [totalMinutes, setTotalMinutes] = useState(null);
  const navigate = useNavigate();
  const [stoves, setStoves] = useState([]);
  
  // Loading states
  const [isLoadingStoves, setIsLoadingStoves] = useState(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isDeletingLog, setIsDeletingLog] = useState(false);
  const [isEditingLog, setIsEditingLog] = useState(false);
  const [deletingLogId, setDeletingLogId] = useState(null);
  
 useEffect(() => {
  setIsLoadingStoves(true);
  getStoves().then(stoves => {
    setStoves(stoves);
    setStovesCount(Array.isArray(stoves) ? stoves.length : 0);
  }).finally(() => setIsLoadingStoves(false));
  
  getCookingSessionsLast24h().then(res => setSessions24h(res.count));
  getTotalLogsCount().then(res => setTotalSessions(res.totalCount));
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
    setIsLoadingLogs(true);
    try {
      const data = await getLogsByStoveId(stove.stove_id);
      setLogs(data.logs || []);
    } catch {
      setLogs([]);
    } finally {
      setIsLoadingLogs(false);
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
    console.log('Dashboard handleFormSubmit called with:', data);
    try {
      await addStove(data);
      console.log('Stove added successfully');
      setShowForm(false);
      // Refresh stove list
      const updated = await getStoves();
      setStovesCount(Array.isArray(updated) ? updated.length : 0);
    } catch (err) {
      console.error('Error in handleFormSubmit:', err);
      if (err.message.includes('403')) navigate('/unauthorized');
      else alert('Failed to add stove');
    }
  }

  function handleEditLog(log) {
    setEditLog(log);
  }
  async function handleEditLogSubmit(updatedLog) {
    if (isEditingLog) return;
    
    setIsEditingLog(true);
    
    try {
      // Replace the edited log in the logs array
      const newLogs = logs.map(log => log === editLog ? updatedLog : log);
      await updateStove(selectedStove._id, { ...selectedStove, logs: newLogs });
      setEditLog(null);
      // Refresh logs from backend
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/stoves/${selectedStove._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      if (err.message.includes('403')) navigate('/unauthorized');
      else alert('Failed to update log');
    } finally {
      setIsEditingLog(false);
    }
  }

  async function handleDeleteLog(logToDelete) {
    if (isDeletingLog) return;
    
    setIsDeletingLog(true);
    setDeletingLogId(`${logToDelete.date}_${logToDelete.start_time}_${logToDelete.end_time}`);
    
    try {
      const newLogs = logs.filter(log => log !== logToDelete);
      await updateStove(selectedStove._id, { ...selectedStove, logs: newLogs });
      // Refresh logs from backend
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/stoves/${selectedStove._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      if (err.message.includes('403')) navigate('/unauthorized');
      else alert('Failed to delete log');
    } finally {
      setIsDeletingLog(false);
      setDeletingLogId(null);
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
      label: 'Total Cooking Sessions',
      value: totalSessions === null ? '...' : totalSessions,
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
  // Convert 24-hour time to 12-hour with AM/PM
  const convertTo12Hour = (time24) => {
    if (!time24) return { time: '', ampm: 'AM' };
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return { time: `${hour12.toString().padStart(2, '0')}:${minutes}`, ampm };
  };

  const startTime12 = convertTo12Hour(log.start_time);
  const endTime12 = convertTo12Hour(log.end_time);

  const [form, setForm] = useState({ 
    ...log, 
    start_time: startTime12.time,
    start_ampm: startTime12.ampm,
    end_time: endTime12.time,
    end_ampm: endTime12.ampm
  });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    
    // Convert AM/PM times back to 24-hour format
    const convertTo24Hour = (time, ampm) => {
      if (!time) return time;
      const [hours, minutes] = time.split(':');
      let hour = parseInt(hours);
      
      if (ampm === 'PM' && hour !== 12) {
        hour += 12;
      } else if (ampm === 'AM' && hour === 12) {
        hour = 0;
      }
      
      return `${hour.toString().padStart(2, '0')}:${minutes}`;
    };
    
    const processedForm = {
      ...form,
      start_time: convertTo24Hour(form.start_time, form.start_ampm),
      end_time: convertTo24Hour(form.end_time, form.end_ampm)
    };
    
    // Remove AM/PM fields from the final form object
    delete processedForm.start_ampm;
    delete processedForm.end_ampm;
    
    onSubmit(processedForm);
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
        <div style={{marginBottom:12}}>
          <label style={{color:'#fff',display:'block',marginBottom:'4px',fontWeight:500}}>Date:</label>
          <input 
            type="date" 
            name="date" 
            value={form.date?.slice(0,10) || ''} 
            onChange={handleChange} 
            required 
            style={{
              width:'100%',
              padding:'10px',
              borderRadius:8,
              border:'1px solid #444',
              background:'#222',
              color:'#fff',
              fontSize:'1rem',
              outline:'none',
              boxSizing:'border-box'
            }} 
          />
        </div>
        <div style={{marginBottom:12}}>
          <label style={{color:'#fff',display:'block',marginBottom:'4px',fontWeight:500}}>Start Time:</label>
          <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
            <input 
              type="time" 
              name="start_time" 
              value={form.start_time} 
              onChange={handleChange} 
              required 
              style={{
                flex:1,
                padding:'10px',
                borderRadius:8,
                border:'1px solid #444',
                background:'#222',
                color:'#fff',
                fontSize:'1rem',
                outline:'none'
              }} 
            />
            <select 
              name="start_ampm" 
              value={form.start_ampm || 'AM'} 
              onChange={handleChange}
              style={{
                padding:'10px',
                borderRadius:8,
                border:'1px solid #444',
                background:'#222',
                color:'#fff',
                fontSize:'1rem',
                outline:'none',
                minWidth:'60px'
              }}
            >
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>
        </div>
        <div style={{marginBottom:12}}>
          <label style={{color:'#fff',display:'block',marginBottom:'4px',fontWeight:500}}>End Time:</label>
          <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
            <input 
              type="time" 
              name="end_time" 
              value={form.end_time} 
              onChange={handleChange} 
              required 
              style={{
                flex:1,
                padding:'10px',
                borderRadius:8,
                border:'1px solid #444',
                background:'#222',
                color:'#fff',
                fontSize:'1rem',
                outline:'none'
              }} 
            />
            <select 
              name="end_ampm" 
              value={form.end_ampm || 'AM'} 
              onChange={handleChange}
              style={{
                padding:'10px',
                borderRadius:8,
                border:'1px solid #444',
                background:'#222',
                color:'#fff',
                fontSize:'1rem',
                outline:'none',
                minWidth:'60px'
              }}
            >
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>
        </div>
        <div style={{marginBottom:12}}>
          <label style={{color:'#fff',display:'block',marginBottom:'4px',fontWeight:500}}>Duration (min):</label>
          <input 
            name="duration" 
            value={form.duration} 
            onChange={handleChange} 
            required 
            style={{
              width:'100%',
              padding:'10px',
              borderRadius:8,
              border:'1px solid #444',
              background:'#222',
              color:'#fff',
              fontSize:'1rem',
              outline:'none',
              boxSizing:'border-box'
            }} 
          />
        </div>
        <div style={{marginBottom:12}}>
          <label style={{color:'#fff',display:'block',marginBottom:'4px',fontWeight:500}}>Cooking Time (min):</label>
          <input 
            name="cooking_time" 
            value={form.cooking_time} 
            onChange={handleChange} 
            required 
            style={{
              width:'100%',
              padding:'10px',
              borderRadius:8,
              border:'1px solid #444',
              background:'#222',
              color:'#fff',
              fontSize:'1rem',
              outline:'none',
              boxSizing:'border-box'
            }} 
          />
        </div>
        <div style={{marginBottom:12}}>
          <label style={{color:'#fff',display:'block',marginBottom:'4px',fontWeight:500}}>Wattage (W):</label>
          <input 
            name="wattage_W" 
            value={form.wattage_W} 
            onChange={handleChange} 
            required 
            style={{
              width:'100%',
              padding:'10px',
              borderRadius:8,
              border:'1px solid #444',
              background:'#222',
              color:'#fff',
              fontSize:'1rem',
              outline:'none',
              boxSizing:'border-box'
            }} 
          />
        </div>
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
                <Suspense fallback={<div>Loading...</div>}>
                  <Dashboard />
                </Suspense>
              </AppLayout>
            </PrivateRoute>
          } />
          <Route path="/users" element={
            <PrivateRoute>
              <AppLayout>
                <Suspense fallback={<div>Loading...</div>}>
                  <UsersPage />
                </Suspense>
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
