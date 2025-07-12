import { useState } from 'react';

export default function StoveForm({ onClose, onSubmit }) {
  const [stove_id, setStoveId] = useState('');
  const [location, setLocation] = useState('');
  const [log, setLog] = useState({
    date: '',
    start_time: '',
    end_time: '',
    duration: '',
    cooking_time: '',
    wattage_W: ''
  });

  function handleChange(e) {
    setLog({ ...log, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({ stove_id, location, logs: [log] });
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      zIndex: 2000,
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
          <h3 style={{color:'#fff',margin:0,fontSize:'1.5rem',fontWeight:600}}>Add Stove Data</h3>
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
        <div>
          <label style={{color:'#fff'}}>Stove ID: <input value={stove_id} onChange={e => setStoveId(e.target.value)} required style={{margin:'8px',padding:'6px',borderRadius:4,border:'1px solid #444',background:'#222',color:'#fff'}} /></label>
        </div>
        <div>
          <label style={{color:'#fff'}}>Location: <input value={location} onChange={e => setLocation(e.target.value)} required style={{margin:'8px',padding:'6px',borderRadius:4,border:'1px solid #444',background:'#222',color:'#fff'}} /></label>
        </div>
        <fieldset style={{marginTop:10,border:'1px solid #444',borderRadius:8,padding:12}}>
          <legend style={{color:'#fff'}}>Log Entry</legend>
          <div><label style={{color:'#fff'}}>Date: <input type="date" name="date" value={log.date} onChange={handleChange} required style={{margin:'8px',padding:'6px',borderRadius:4,border:'1px solid #444',background:'#222',color:'#fff'}} /></label></div>
          <div><label style={{color:'#fff'}}>Start Time: <input type="time" name="start_time" value={log.start_time} onChange={handleChange} required style={{margin:'8px',padding:'6px',borderRadius:4,border:'1px solid #444',background:'#222',color:'#fff'}} /></label></div>
          <div><label style={{color:'#fff'}}>End Time: <input type="time" name="end_time" value={log.end_time} onChange={handleChange} required style={{margin:'8px',padding:'6px',borderRadius:4,border:'1px solid #444',background:'#222',color:'#fff'}} /></label></div>
          <div><label style={{color:'#fff'}}>Duration (min): <input name="duration" value={log.duration} onChange={handleChange} required style={{margin:'8px',padding:'6px',borderRadius:4,border:'1px solid #444',background:'#222',color:'#fff'}} /></label></div>
          <div><label style={{color:'#fff'}}>Cooking Time (min): <input name="cooking_time" value={log.cooking_time} onChange={handleChange} required style={{margin:'8px',padding:'6px',borderRadius:4,border:'1px solid #444',background:'#222',color:'#fff'}} /></label></div>
          <div><label style={{color:'#fff'}}>Wattage (W): <input name="wattage_W" value={log.wattage_W} onChange={handleChange} required style={{margin:'8px',padding:'6px',borderRadius:4,border:'1px solid #444',background:'#222',color:'#fff'}} /></label></div>
        </fieldset>
        <button type="submit" style={{marginTop:18,padding:'12px 28px',borderRadius:8,background:'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)',color:'#fff',border:'none',fontWeight:600,fontSize:'1rem',cursor:'pointer',boxShadow:'0 4px 15px rgba(74,144,226,0.2)',transition:'all 0.3s ease'}}>Submit</button>
      </form>
    </div>
  );
} 