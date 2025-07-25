import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getStoves, addStove, updateStove, getLogsByStoveId, deleteStove } from '../services/api';
import StoveForm from '../StoveForm';

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

export default function UsersPage() {
  const { role } = useAuth();
  const [stoves, setStoves] = useState([]);
  const [error, setError] = useState('');
  const [selectedStove, setSelectedStove] = useState(null);
  const [logs, setLogs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editLog, setEditLog] = useState(null);
  const [selectedStoveId, setSelectedStoveId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getStoves()
      .then(setStoves)
      .catch(() => setError('Failed to fetch stoves'));
  }, []);

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
      setStoves(updated);
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
    if (!window.confirm('Delete this log entry? This cannot be undone.')) return;
    try {
      // Find all logs for this stoveDocId
      const stoveDocId = logToDelete.stoveDocId;
      // Fetch the current logs for this document
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/stoves/${stoveDocId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const stoveDoc = await res.json();
      // Remove the log by matching all fields (date, start_time, end_time, duration, cooking_time, wattage_W)
      const newLogs = stoveDoc.logs.filter(log =>
        !(log.date === logToDelete.date &&
          log.start_time === logToDelete.start_time &&
          log.end_time === logToDelete.end_time &&
          log.duration === logToDelete.duration &&
          log.cooking_time === logToDelete.cooking_time &&
          log.wattage_W === logToDelete.wattage_W)
      );
      await updateStove(stoveDocId, { ...stoveDoc, logs: newLogs });
      // Refresh logs in modal
      const data = await getLogsByStoveId(selectedStoveId);
      setLogs(data.logs || []);
    } catch (err) {
      alert('Failed to delete log');
    }
  }

  async function handleDeleteStove(stove) {
    if (!window.confirm(`Delete stove ${stove.stove_id} at ${stove.location}? This cannot be undone.`)) return;
    try {
      await deleteStove(stove._id);
      setStoves(stoves.filter(s => s._id !== stove._id));
    } catch (err) {
      alert('Failed to delete stove');
    }
  }

  if (error) return <div>{error}</div>;
  if (!stoves.length) return <div>Loading...</div>;

  // Group stoves by unique stove_id
  const uniqueStoves = Object.values(stoves.reduce((acc, stove) => {
    if (!acc[stove.stove_id]) acc[stove.stove_id] = stove;
    return acc;
  }, {}));

  return (
    <>
      {showForm && <StoveForm onClose={() => setShowForm(false)} onSubmit={handleFormSubmit} />}
      {editLog && <EditLogModal log={editLog} onClose={() => setEditLog(null)} onSubmit={handleEditLogSubmit} />}
      <div style={{
        minHeight: '100vh',
        width: '100%',
        background: '#f7faff',
        padding: '40px 0',
        boxSizing: 'border-box',
      }}>
        <div style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          padding: '0 40px',
          boxSizing: 'border-box',
        }}>
          <h1 style={{
            color: '#222',
            textAlign: 'center',
            marginBottom: '32px',
            fontSize: '2.2rem',
            fontWeight: '700',
            letterSpacing: 0.5,
            textShadow: '0 2px 8px rgba(74,144,226,0.07)'
          }}>
            Stove Management Dashboard
          </h1>
          {role === 'super_admin' && (
            <button
              style={{
                padding: '12px 28px',
                fontSize: '1rem',
                fontWeight: '600',
                borderRadius: '10px',
                background: 'linear-gradient(90deg, #4A90E2 0%, #357ABD 100%)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 12px 0 rgba(74,144,226,0.07)',
                marginBottom: '28px',
                display: 'block',
              }}
              onMouseOver={e => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 15px rgba(74, 144, 226, 0.13)';
              }}
              onMouseOut={e => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 12px 0 rgba(74,144,226,0.07)';
              }}
              onClick={handleAddEntry}
            >
              Add New Entry
            </button>
          )}
          <div style={{
            background: '#fff',
            borderRadius: '18px',
            overflow: 'hidden',
            boxShadow: '0 8px 32px 0 rgba(74,144,226,0.13)', // stronger shadow
            border: '1px solid #f0f0f0',
            width: '100%',
            maxWidth: 1100, // slightly wider
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0',
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'center', // center all content
            }}>
              <thead>
                <tr style={{
                  background: 'linear-gradient(90deg, #e3f0ff 0%, #f7faff 100%)',
                }}>
                  <th style={{
                    padding: '20px',
                    fontWeight: '700',
                    fontSize: '1.08rem',
                    color: '#357ABD',
                    textAlign: 'center', // center header
                    borderBottom: '2px solid #f0f0f0',
                    width: '33%',
                  }}>Stove ID</th>
                  <th style={{
                    padding: '20px',
                    fontWeight: '700',
                    fontSize: '1.08rem',
                    color: '#357ABD',
                    textAlign: 'center',
                    borderBottom: '2px solid #f0f0f0',
                    width: '33%',
                  }}>Location</th>
                  <th style={{
                    padding: '20px',
                    fontWeight: '700',
                    fontSize: '1.08rem',
                    color: '#357ABD',
                    textAlign: 'center',
                    borderBottom: '2px solid #f0f0f0',
                    width: '34%',
                  }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {uniqueStoves.map((stove, index) => (
                  <tr
                    key={stove.stove_id}
                    style={{
                      background: index % 2 === 0 ? '#f7faff' : '#fff',
                      borderBottom: '1px solid #f0f0f0',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <td style={{
                      padding: '18px 20px',
                      color: '#222',
                      fontSize: '1rem',
                      fontWeight: '500',
                      textAlign: 'center',
                      width: '33%',
                    }}>{stove.stove_id}</td>
                    <td style={{
                      padding: '18px 20px',
                      color: '#222',
                      fontSize: '1rem',
                      fontWeight: '500',
                      textAlign: 'center',
                      width: '33%',
                    }}>{stove.location}</td>
                    <td style={{
                      padding: '18px 20px',
                      textAlign: 'center',
                      width: '34%',
                    }}>
                      <div style={{display:'flex',justifyContent:'center',gap:'16px'}}>
                        <button
                          onClick={() => handleViewLogs(stove)}
                          style={{
                            padding: '8px 18px',
                            borderRadius: '8px',
                            background: 'linear-gradient(90deg, #27c97a 0%, #43e97b 100%)',
                            color: '#fff',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.98rem',
                            fontWeight: '600',
                            transition: 'all 0.2s',
                            boxShadow: '0 2px 8px rgba(39,201,122,0.08)',
                            marginRight: 0
                          }}
                          onMouseOver={e => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 4px 15px rgba(39,201,122,0.13)';
                          }}
                          onMouseOut={e => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 2px 8px rgba(39,201,122,0.08)';
                          }}
                        >
                          View Logs
                        </button>
                        {role === 'super_admin' && (
                          <button
                            onClick={() => handleDeleteStove(stove)}
                            style={{
                              padding: '8px 18px',
                              borderRadius: '8px',
                              background: 'linear-gradient(90deg, #dc3545 0%, #c82333 100%)',
                              color: '#fff',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '0.98rem',
                              fontWeight: '600',
                              transition: 'all 0.2s',
                              boxShadow: '0 2px 8px rgba(220,53,69,0.08)'
                            }}
                            onMouseOver={e => {
                              e.target.style.transform = 'translateY(-2px)';
                              e.target.style.boxShadow = '0 4px 15px rgba(220,53,69,0.13)';
                            }}
                            onMouseOut={e => {
                              e.target.style.transform = 'translateY(0)';
                              e.target.style.boxShadow = '0 2px 8px rgba(220,53,69,0.08)';
                            }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {showModal && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2001,
              padding: '20px',
            }}>
              <div style={{
                background: '#fff',
                borderRadius: 20,
                minWidth: 400,
                maxWidth: '95vw',
                maxHeight: '90vh',
                overflow: 'auto',
                position: 'relative',
                boxShadow: '0 8px 32px rgba(74,144,226,0.13)',
                border: '1px solid #f0f0f0',
                padding: 32,
              }}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
                  <h3 style={{color:'#357ABD',margin:0,fontSize:'1.5rem',fontWeight:700}}>Logs for Stove {selectedStoveId}</h3>
                  <button type="button" onClick={closeModal} style={{
                    background: 'rgba(74,144,226,0.07)',
                    border: 'none',
                    color: '#357ABD',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '600',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={e => e.target.style.background = 'rgba(74,144,226,0.13)'}
                  onMouseOut={e => e.target.style.background = 'rgba(74,144,226,0.07)'}
                  >Close</button>
                </div>
                <div style={{
                  background: '#f7faff',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid #f0f0f0',
                  margin: '32px 0',
                }}>
                  <table style={{width: '100%', borderCollapse: 'collapse'}}>
                    <thead>
                      <tr style={{background: 'linear-gradient(90deg, #e3f0ff 0%, #f7faff 100%)'}}>
                        <th style={{
                          padding: '16px',
                          textAlign: 'center',
                          color: '#357ABD',
                          fontWeight: '700',
                          fontSize: '1rem',
                          borderBottom: '2px solid #f0f0f0',
                        }}>Date</th>
                        <th style={{padding: '16px', textAlign: 'center', color: '#357ABD', fontWeight: '700', fontSize: '1rem', borderBottom: '2px solid #f0f0f0'}}>Start</th>
                        <th style={{padding: '16px', textAlign: 'center', color: '#357ABD', fontWeight: '700', fontSize: '1rem', borderBottom: '2px solid #f0f0f0'}}>End</th>
                        <th style={{padding: '16px', textAlign: 'center', color: '#357ABD', fontWeight: '700', fontSize: '1rem', borderBottom: '2px solid #f0f0f0'}}>Duration</th>
                        <th style={{padding: '16px', textAlign: 'center', color: '#357ABD', fontWeight: '700', fontSize: '1rem', borderBottom: '2px solid #f0f0f0'}}>Cooking Time</th>
                        <th style={{padding: '16px', textAlign: 'center', color: '#357ABD', fontWeight: '700', fontSize: '1rem', borderBottom: '2px solid #f0f0f0'}}>Wattage</th>
                        {role === 'super_admin' && <th style={{padding: '16px', textAlign: 'center', color: '#357ABD', fontWeight: '700', fontSize: '1rem', borderBottom: '2px solid #f0f0f0'}}>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log, i) => (
                        <tr
                          key={i}
                          style={{
                            background: i % 2 === 0 ? '#fff' : '#f7faff',
                            borderBottom: '1px solid #f0f0f0',
                            transition: 'all 0.2s',
                          }}
                        >
                          <td style={{padding: '14px', textAlign: 'center', color: '#222'}}>{log.date ? formatDate(log.date) : ''}</td>
                          <td style={{padding: '14px', textAlign: 'center', color: '#222'}}>{formatTime(log.start_time)}</td>
                          <td style={{padding: '14px', textAlign: 'center', color: '#222'}}>{formatTime(log.end_time)}</td>
                          <td style={{padding: '14px', textAlign: 'center', color: '#222'}}>{log.duration}</td>
                          <td style={{padding: '14px', textAlign: 'center', color: '#222'}}>{log.cooking_time}</td>
                          <td style={{padding: '14px', textAlign: 'center', color: '#222'}}>{log.wattage_W}</td>
                          {role === 'super_admin' && (
                            <td style={{padding: '14px', textAlign: 'center'}}>
                              <div style={{display: 'flex', gap: '8px', justifyContent: 'center'}}>
                                <button
                                  onClick={() => handleEditLog(log)}
                                  style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    background: 'linear-gradient(90deg, #ffc107 0%, #ffb300 100%)',
                                    color: '#000',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    fontWeight: '600',
                                    transition: 'all 0.2s',
                                  }}
                                  onMouseOver={e => {
                                    e.target.style.transform = 'translateY(-1px)';
                                    e.target.style.boxShadow = '0 4px 12px rgba(255, 193, 7, 0.13)';
                                  }}
                                  onMouseOut={e => {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = 'none';
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteLog(log)}
                                  style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    background: 'linear-gradient(90deg, #dc3545 0%, #c82333 100%)',
                                    color: '#fff',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    fontWeight: '600',
                                    transition: 'all 0.2s',
                                  }}
                                  onMouseOver={e => {
                                    e.target.style.transform = 'translateY(-1px)';
                                    e.target.style.boxShadow = '0 4px 12px rgba(220, 53, 69, 0.13)';
                                  }}
                                  onMouseOut={e => {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = 'none';
                                  }}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
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
      background: 'rgba(0,0,0,0.18)',
      zIndex: 3000, // higher than view logs modal
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20
    }}>
      <form onSubmit={handleSubmit} style={{
        background: '#fff',
        borderRadius: 20,
        minWidth: 350,
        maxWidth: '95vw',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative',
        boxShadow: '0 8px 32px rgba(74,144,226,0.13)',
        border: '1px solid #e2e8f0',
        padding: 36,
        display: 'flex',
        flexDirection: 'column',
        gap: 18
      }}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <h3 style={{color:'#357ABD',margin:0,fontSize:'1.5rem',fontWeight:700}}>Edit Log</h3>
          <button type="button" onClick={onClose} style={{
            background: '#f7faff',
            border: '1px solid #e2e8f0',
            color: '#357ABD',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '600',
            transition: 'all 0.2s',
          }}
          onMouseOver={e => e.target.style.background = '#e3f0ff'}
          onMouseOut={e => e.target.style.background = '#f7faff'}
          >Close</button>
        </div>
        <div><label style={{color:'#4a5568',fontWeight:500}}>Date: <input type="date" name="date" value={form.date?.slice(0,10) || ''} onChange={handleChange} required style={{margin:'8px',padding:'10px',borderRadius:8,border:'1px solid #e2e8f0',background:'#f8fafc',color:'#222',fontSize:'1rem',outline:'none'}} /></label></div>
        <div><label style={{color:'#4a5568',fontWeight:500}}>Start Time: <input type="time" name="start_time" value={form.start_time} onChange={handleChange} required style={{margin:'8px',padding:'10px',borderRadius:8,border:'1px solid #e2e8f0',background:'#f8fafc',color:'#222',fontSize:'1rem',outline:'none'}} /></label></div>
        <div><label style={{color:'#4a5568',fontWeight:500}}>End Time: <input type="time" name="end_time" value={form.end_time} onChange={handleChange} required style={{margin:'8px',padding:'10px',borderRadius:8,border:'1px solid #e2e8f0',background:'#f8fafc',color:'#222',fontSize:'1rem',outline:'none'}} /></label></div>
        <div><label style={{color:'#4a5568',fontWeight:500}}>Duration (min): <input name="duration" value={form.duration} onChange={handleChange} required style={{margin:'8px',padding:'10px',borderRadius:8,border:'1px solid #e2e8f0',background:'#f8fafc',color:'#222',fontSize:'1rem',outline:'none'}} /></label></div>
        <div><label style={{color:'#4a5568',fontWeight:500}}>Cooking Time (min): <input name="cooking_time" value={form.cooking_time} onChange={handleChange} required style={{margin:'8px',padding:'10px',borderRadius:8,border:'1px solid #e2e8f0',background:'#f8fafc',color:'#222',fontSize:'1rem',outline:'none'}} /></label></div>
        <div><label style={{color:'#4a5568',fontWeight:500}}>Wattage (W): <input name="wattage_W" value={form.wattage_W} onChange={handleChange} required style={{margin:'8px',padding:'10px',borderRadius:8,border:'1px solid #e2e8f0',background:'#f8fafc',color:'#222',fontSize:'1rem',outline:'none'}} /></label></div>
        <button type="submit" style={{
          marginTop: 12,
          padding: '14px 32px',
          borderRadius: 10,
          background: 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)',
          color: '#fff',
          border: 'none',
          fontWeight: 600,
          fontSize: '1rem',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(74,144,226,0.13)',
          transition: 'all 0.3s ease'
        }}>Save</button>
      </form>
    </div>
  );
} 