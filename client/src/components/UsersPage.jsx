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
  const { role, isTokenValid } = useAuth();
  const [stoves, setStoves] = useState([]);
  const [error, setError] = useState('');
  const [selectedStove, setSelectedStove] = useState(null);
  const [logs, setLogs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editLog, setEditLog] = useState(null);
  const [selectedStoveId, setSelectedStoveId] = useState(null);
  
  // Loading states
  const [isLoadingStoves, setIsLoadingStoves] = useState(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isDeletingLog, setIsDeletingLog] = useState(false);
  const [isEditingLog, setIsEditingLog] = useState(false);
  const [isDeletingStove, setIsDeletingStove] = useState(false);
  const [deletingLogId, setDeletingLogId] = useState(null);
  const [deletingStoveId, setDeletingStoveId] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    // Check if token is valid before making API calls
    if (!isTokenValid()) {
      console.log('Token is invalid, redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      window.location.href = '/login';
      return;
    }
    
    setIsLoadingStoves(true);
    getStoves()
      .then(setStoves)
      .catch(() => setError('Failed to fetch stoves'))
      .finally(() => setIsLoadingStoves(false));
  }, [isTokenValid]);

  async function handleViewLogs(stove) {
    console.log('Viewing logs for stove:', stove.stove_id);
    setSelectedStove(stove);
    setSelectedStoveId(stove.stove_id);
    setShowModal(true);
    setIsLoadingLogs(true);
    try {
      const data = await getLogsByStoveId(stove.stove_id);
      console.log('Fetched logs:', data.logs?.length || 0);
      console.log('Sample log:', data.logs?.[0]);
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
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
    console.log('UsersPage handleFormSubmit called with:', data);
    try {
      await addStove(data);
      console.log('Stove added successfully');
      setShowForm(false);
      // Refresh stove list
      const updated = await getStoves();
      setStoves(updated);
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
    // Prevent multiple edits
    if (isEditingLog) return;
    
    setIsEditingLog(true);
    
    try {
      console.log('Editing log in stove:', selectedStove.stove_id);
      console.log('Original log:', editLog);
      console.log('Updated log:', updatedLog);
      
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
      console.log('Log updated successfully');
    } catch (err) {
      console.error('Error updating log:', err);
      if (err.message.includes('403')) navigate('/unauthorized');
      else alert('Failed to update log');
    } finally {
      setIsEditingLog(false);
    }
  }

  async function handleDeleteLog(logToDelete) {
    if (!window.confirm('Delete this log entry? This cannot be undone.')) return;
    
    // Prevent multiple deletions
    if (isDeletingLog) return;
    
    setIsDeletingLog(true);
    setDeletingLogId(`${logToDelete.date}_${logToDelete.start_time}_${logToDelete.end_time}`);
    
    try {
      console.log('Deleting log from stove:', selectedStove.stove_id);
      console.log('Log to delete:', logToDelete);
      
      // Get all stove documents with this stove_id
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      // First, get all stove documents with this stove_id
      const allStovesRes = await fetch(`${API_URL}/api/stoves`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!allStovesRes.ok) {
        throw new Error(`HTTP ${allStovesRes.status}: ${allStovesRes.statusText}`);
      }
      
      const allStoves = await allStovesRes.json();
      const stovesWithSameId = allStoves.filter(stove => stove.stove_id === selectedStove.stove_id);
      
      console.log(`Found ${stovesWithSameId.length} stove documents with stove_id: ${selectedStove.stove_id}`);
      
      // Delete the log from ALL stove documents with this stove_id
      for (const stove of stovesWithSameId) {
        console.log(`Processing stove document: ${stove._id}`);
        
        const res = await fetch(`${API_URL}/api/stoves/${stove._id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) {
          console.error(`Failed to fetch stove ${stove._id}:`, res.status);
          continue;
        }
        
        const stoveDoc = await res.json();
        console.log(`Stove ${stove._id} has ${stoveDoc.logs.length} logs`);
        
        // Remove the log by matching all fields
        const newLogs = stoveDoc.logs.filter(log =>
          !(log.date === logToDelete.date &&
            log.start_time === logToDelete.start_time &&
            log.end_time === logToDelete.end_time &&
            log.duration === logToDelete.duration &&
            log.cooking_time === logToDelete.cooking_time &&
            log.wattage_W === logToDelete.wattage_W)
        );
        
        if (newLogs.length !== stoveDoc.logs.length) {
          console.log(`Deleting log from stove ${stove._id} (${stoveDoc.logs.length} -> ${newLogs.length} logs)`);
          await updateStove(stove._id, { ...stoveDoc, logs: newLogs });
        }
      }
      
      console.log('Log deletion completed');
      
      // Refresh logs in modal
      console.log('Refreshing logs for stove:', selectedStoveId);
      const data = await getLogsByStoveId(selectedStoveId);
      console.log('Refreshed logs count:', data.logs?.length || 0);
      setLogs(data.logs || []);
      
    } catch (err) {
      console.error('Error deleting log:', err);
      alert('Failed to delete log');
    } finally {
      setIsDeletingLog(false);
      setDeletingLogId(null);
    }
  }

  async function handleDeleteStove(stove) {
    if (!window.confirm(`Delete stove ${stove.stove_id} at ${stove.location}? This cannot be undone.`)) return;
    
    // Prevent multiple deletions
    if (isDeletingStove) return;
    
    setIsDeletingStove(true);
    setDeletingStoveId(stove._id);
    
    try {
      await deleteStove(stove._id);
      console.log('Stove deleted successfully, refreshing stove list...');
      
      // Refresh the entire stove list from the server
      const updatedStoves = await getStoves();
      setStoves(updatedStoves);
      console.log('Stove list refreshed, new count:', updatedStoves.length);
      
    } catch (err) {
      console.error('Error deleting stove:', err);
      alert('Failed to delete stove');
    } finally {
      setIsDeletingStove(false);
      setDeletingStoveId(null);
    }
  }

  // Loading spinner component
  const LoadingSpinner = ({ size = 20, color = '#357ABD' }) => (
    <div style={{
      display: 'inline-block',
      width: size,
      height: size,
      border: `2px solid ${color}20`,
      borderTop: `2px solid ${color}`,
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }} />
  );

  // Add CSS animation for spinner
  const spinnerStyle = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;

  if (error) return <div>{error}</div>;
  if (isLoadingStoves) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f7faff'
      }}>
        <style>{spinnerStyle}</style>
        <div style={{ textAlign: 'center' }}>
          <LoadingSpinner size={40} />
          <div style={{ marginTop: 16, color: '#357ABD', fontSize: '1.1rem' }}>Loading stoves...</div>
        </div>
      </div>
    );
  }
  if (!stoves.length) return <div>No stoves found</div>;

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
                          disabled={isLoadingLogs}
                          style={{
                            padding: '8px 18px',
                            borderRadius: '8px',
                            background: isLoadingLogs
                              ? 'linear-gradient(90deg, #6c757d 0%, #5a6268 100%)'
                              : 'linear-gradient(90deg, #27c97a 0%, #43e97b 100%)',
                            color: '#fff',
                            border: 'none',
                            cursor: isLoadingLogs ? 'not-allowed' : 'pointer',
                            fontSize: '0.98rem',
                            fontWeight: '600',
                            transition: 'all 0.2s',
                            boxShadow: '0 2px 8px rgba(39,201,122,0.08)',
                            marginRight: 0,
                            opacity: isLoadingLogs ? 0.7 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                          onMouseOver={e => {
                            if (!isLoadingLogs) {
                              e.target.style.transform = 'translateY(-2px)';
                              e.target.style.boxShadow = '0 4px 15px rgba(39,201,122,0.13)';
                            }
                          }}
                          onMouseOut={e => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 2px 8px rgba(39,201,122,0.08)';
                          }}
                        >
                          {isLoadingLogs ? (
                            <>
                              <LoadingSpinner size={14} color="#fff" />
                              Loading...
                            </>
                          ) : (
                            'View Logs'
                          )}
                        </button>
                        {role === 'super_admin' && (
                          <button
                            onClick={() => handleDeleteStove(stove)}
                            disabled={isDeletingStove && deletingStoveId === stove._id}
                            style={{
                              padding: '8px 18px',
                              borderRadius: '8px',
                              background: isDeletingStove && deletingStoveId === stove._id
                                ? 'linear-gradient(90deg, #6c757d 0%, #5a6268 100%)'
                                : 'linear-gradient(90deg, #dc3545 0%, #c82333 100%)',
                              color: '#fff',
                              border: 'none',
                              cursor: isDeletingStove && deletingStoveId === stove._id ? 'not-allowed' : 'pointer',
                              fontSize: '0.98rem',
                              fontWeight: '600',
                              transition: 'all 0.2s',
                              boxShadow: '0 2px 8px rgba(220,53,69,0.08)',
                              opacity: isDeletingStove && deletingStoveId === stove._id ? 0.7 : 1,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                            onMouseOver={e => {
                              if (!isDeletingStove || deletingStoveId !== stove._id) {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 4px 15px rgba(220,53,69,0.13)';
                              }
                            }}
                            onMouseOut={e => {
                              e.target.style.transform = 'translateY(0)';
                              e.target.style.boxShadow = '0 2px 8px rgba(220,53,69,0.08)';
                            }}
                          >
                            {isDeletingStove && deletingStoveId === stove._id ? (
                              <>
                                <LoadingSpinner size={14} color="#fff" />
                                Deleting...
                              </>
                            ) : (
                              'Delete'
                            )}
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
                  {isLoadingLogs ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '40px',
                      minHeight: '200px'
                    }}>
                      <style>{spinnerStyle}</style>
                      <div style={{ textAlign: 'center' }}>
                        <LoadingSpinner size={30} />
                        <div style={{ marginTop: 12, color: '#357ABD', fontSize: '1rem' }}>Loading logs...</div>
                      </div>
                    </div>
                  ) : (
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
                                  disabled={isEditingLog}
                                  style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    background: isEditingLog
                                      ? 'linear-gradient(90deg, #6c757d 0%, #5a6268 100%)'
                                      : 'linear-gradient(90deg, #ffc107 0%, #ffb300 100%)',
                                    color: isEditingLog ? '#fff' : '#000',
                                    border: 'none',
                                    cursor: isEditingLog ? 'not-allowed' : 'pointer',
                                    fontSize: '0.9rem',
                                    fontWeight: '600',
                                    transition: 'all 0.2s',
                                    opacity: isEditingLog ? 0.7 : 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    minWidth: '50px',
                                    justifyContent: 'center'
                                  }}
                                  onMouseOver={e => {
                                    if (!isEditingLog) {
                                      e.target.style.transform = 'translateY(-1px)';
                                      e.target.style.boxShadow = '0 4px 12px rgba(255, 193, 7, 0.13)';
                                    }
                                  }}
                                  onMouseOut={e => {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = 'none';
                                  }}
                                >
                                  {isEditingLog ? (
                                    <>
                                      <LoadingSpinner size={12} color={isEditingLog ? "#fff" : "#000"} />
                                      Edit
                                    </>
                                  ) : (
                                    'Edit'
                                  )}
                                </button>
                                <button
                                  onClick={() => handleDeleteLog(log)}
                                  disabled={isDeletingLog && deletingLogId === `${log.date}_${log.start_time}_${log.end_time}`}
                                  style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    background: isDeletingLog && deletingLogId === `${log.date}_${log.start_time}_${log.end_time}`
                                      ? 'linear-gradient(90deg, #6c757d 0%, #5a6268 100%)'
                                      : 'linear-gradient(90deg, #dc3545 0%, #c82333 100%)',
                                    color: '#fff',
                                    border: 'none',
                                    cursor: isDeletingLog && deletingLogId === `${log.date}_${log.start_time}_${log.end_time}` ? 'not-allowed' : 'pointer',
                                    fontSize: '0.9rem',
                                    fontWeight: '600',
                                    transition: 'all 0.2s',
                                    opacity: isDeletingLog && deletingLogId === `${log.date}_${log.start_time}_${log.end_time}` ? 0.7 : 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    minWidth: '60px',
                                    justifyContent: 'center'
                                  }}
                                  onMouseOver={e => {
                                    if (!isDeletingLog || deletingLogId !== `${log.date}_${log.start_time}_${log.end_time}`) {
                                      e.target.style.transform = 'translateY(-1px)';
                                      e.target.style.boxShadow = '0 4px 12px rgba(220, 53, 69, 0.13)';
                                    }
                                  }}
                                  onMouseOut={e => {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = 'none';
                                  }}
                                >
                                  {isDeletingLog && deletingLogId === `${log.date}_${log.start_time}_${log.end_time}` ? (
                                    <>
                                      <LoadingSpinner size={12} color="#fff" />
                                      Del
                                    </>
                                  ) : (
                                    'Delete'
                                  )}
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  )}
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
        <div style={{marginBottom:8}}>
          <label style={{color:'#4a5568',fontWeight:500,display:'block',marginBottom:'4px'}}>Date:</label>
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
              border:'1px solid #e2e8f0',
              background:'#f8fafc',
              color:'#222',
              fontSize:'1rem',
              outline:'none',
              boxSizing:'border-box'
            }} 
          />
        </div>
        <div style={{marginBottom:8}}>
          <label style={{color:'#4a5568',fontWeight:500,display:'block',marginBottom:'4px'}}>Start Time:</label>
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
                border:'1px solid #e2e8f0',
                background:'#f8fafc',
                color:'#222',
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
                border:'1px solid #e2e8f0',
                background:'#f8fafc',
                color:'#222',
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
        <div style={{marginBottom:8}}>
          <label style={{color:'#4a5568',fontWeight:500,display:'block',marginBottom:'4px'}}>End Time:</label>
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
                border:'1px solid #e2e8f0',
                background:'#f8fafc',
                color:'#222',
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
                border:'1px solid #e2e8f0',
                background:'#f8fafc',
                color:'#222',
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
        <div style={{marginBottom:8}}>
          <label style={{color:'#4a5568',fontWeight:500,display:'block',marginBottom:'4px'}}>Duration (min):</label>
          <input 
            name="duration" 
            value={form.duration} 
            onChange={handleChange} 
            required 
            style={{
              width:'100%',
              padding:'10px',
              borderRadius:8,
              border:'1px solid #e2e8f0',
              background:'#f8fafc',
              color:'#222',
              fontSize:'1rem',
              outline:'none',
              boxSizing:'border-box'
            }} 
          />
        </div>
        <div style={{marginBottom:8}}>
          <label style={{color:'#4a5568',fontWeight:500,display:'block',marginBottom:'4px'}}>Cooking Time (min):</label>
          <input 
            name="cooking_time" 
            value={form.cooking_time} 
            onChange={handleChange} 
            required 
            style={{
              width:'100%',
              padding:'10px',
              borderRadius:8,
              border:'1px solid #e2e8f0',
              background:'#f8fafc',
              color:'#222',
              fontSize:'1rem',
              outline:'none',
              boxSizing:'border-box'
            }} 
          />
        </div>
        <div style={{marginBottom:8}}>
          <label style={{color:'#4a5568',fontWeight:500,display:'block',marginBottom:'4px'}}>Wattage (W):</label>
          <input 
            name="wattage_W" 
            value={form.wattage_W} 
            onChange={handleChange} 
            required 
            style={{
              width:'100%',
              padding:'10px',
              borderRadius:8,
              border:'1px solid #e2e8f0',
              background:'#f8fafc',
              color:'#222',
              fontSize:'1rem',
              outline:'none',
              boxSizing:'border-box'
            }} 
          />
        </div>
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