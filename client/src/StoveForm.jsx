import { useState, useRef } from 'react';
import { FiCalendar } from 'react-icons/fi';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

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
  const dateInputRef = useRef(null);

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
      background: 'rgba(0,0,0,0.18)',
      zIndex: 3000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40 // more padding for centering
    }}>
      <form onSubmit={handleSubmit} style={{
        background: '#fff',
        borderRadius: 20,
        minWidth: 320,
        maxWidth: 420,
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative',
        boxShadow: '0 8px 32px rgba(74,144,226,0.13)',
        border: '1px solid #e2e8f0',
        padding: 28,
        display: 'flex',
        flexDirection: 'column',
        gap: 14
      }}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <h3 style={{color:'#357ABD',margin:0,fontSize:'1.3rem',fontWeight:700}}>Add Stove Data</h3>
          <button type="button" onClick={onClose} style={{
            background: '#f7faff',
            border: '1px solid #e2e8f0',
            color: '#357ABD',
            padding: '7px 14px',
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
          <label style={{color:'#4a5568',fontWeight:500}}>Stove ID: <input value={stove_id} onChange={e => setStoveId(e.target.value)} required style={{margin:'8px 0',padding:'10px',borderRadius:8,border:'1px solid #e2e8f0',background:'#f8fafc',color:'#222',fontSize:'1rem',outline:'none',width:'100%'}} /></label>
        </div>
        <div style={{marginBottom:8}}>
          <label style={{color:'#4a5568',fontWeight:500}}>Location: <input value={location} onChange={e => setLocation(e.target.value)} required style={{margin:'8px 0',padding:'10px',borderRadius:8,border:'1px solid #e2e8f0',background:'#f8fafc',color:'#222',fontSize:'1rem',outline:'none',width:'100%'}} /></label>
        </div>
        <fieldset style={{marginTop:10,border:'1px solid #e2e8f0',borderRadius:8,padding:12,marginBottom:8}}>
          <legend style={{color:'#357ABD',fontWeight:600}}>Log Entry</legend>
          <div style={{marginBottom:8, position:'relative'}}>
            <label style={{color:'#4a5568',fontWeight:500}}>Date:
              <div style={{position:'relative', width:'100%'}}>
                <DatePicker
                  ref={dateInputRef}
                  selected={log.date ? new Date(log.date) : null}
                  onChange={date => setLog({ ...log, date: date ? date.toISOString().split('T')[0] : '' })}
                  dateFormat="yyyy-MM-dd"
                  placeholderText="Select a date"
                  className="custom-datepicker"
                  calendarClassName="custom-calendar"
                  popperPlacement="bottom-start"
                  required
                  style={{width:'100%'}}
                />
                <FiCalendar
                  onClick={() => dateInputRef.current?.setFocus?.()}
                  style={{
                    position:'absolute',
                    right:14,
                    top:'50%',
                    transform:'translateY(-50%)',
                    color:'#357ABD',
                    fontSize:'1.3rem',
                    cursor:'pointer',
                    opacity:0.85
                  }}
                />
              </div>
            </label>
          </div>
          <div style={{marginBottom:8}}><label style={{color:'#4a5568',fontWeight:500}}>Start Time: <input type="time" name="start_time" value={log.start_time} onChange={handleChange} required style={{margin:'8px 0',padding:'10px',borderRadius:8,border:'1px solid #e2e8f0',background:'#f8fafc',color:'#222',fontSize:'1rem',outline:'none',width:'100%'}} /></label></div>
          <div style={{marginBottom:8}}><label style={{color:'#4a5568',fontWeight:500}}>End Time: <input type="time" name="end_time" value={log.end_time} onChange={handleChange} required style={{margin:'8px 0',padding:'10px',borderRadius:8,border:'1px solid #e2e8f0',background:'#f8fafc',color:'#222',fontSize:'1rem',outline:'none',width:'100%'}} /></label></div>
          <div style={{marginBottom:8}}><label style={{color:'#4a5568',fontWeight:500}}>Duration (min): <input name="duration" value={log.duration} onChange={handleChange} required style={{margin:'8px 0',padding:'10px',borderRadius:8,border:'1px solid #e2e8f0',background:'#f8fafc',color:'#222',fontSize:'1rem',outline:'none',width:'100%'}} /></label></div>
          <div style={{marginBottom:8}}><label style={{color:'#4a5568',fontWeight:500}}>Cooking Time (min): <input name="cooking_time" value={log.cooking_time} onChange={handleChange} required style={{margin:'8px 0',padding:'10px',borderRadius:8,border:'1px solid #e2e8f0',background:'#f8fafc',color:'#222',fontSize:'1rem',outline:'none',width:'100%'}} /></label></div>
          <div style={{marginBottom:0}}><label style={{color:'#4a5568',fontWeight:500}}>Wattage (W): <input name="wattage_W" value={log.wattage_W} onChange={handleChange} required style={{margin:'8px 0',padding:'10px',borderRadius:8,border:'1px solid #e2e8f0',background:'#f8fafc',color:'#222',fontSize:'1rem',outline:'none',width:'100%'}} /></label></div>
        </fieldset>
        <button type="submit" style={{
          marginTop: 8,
          padding: '14px 32px',
          borderRadius: 10,
          background: 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)',
          color: '#fff',
          border: 'none',
          fontWeight: 600,
          fontSize: '1rem',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(74,144,226,0.13)',
          transition: 'all 0.3s ease',
          width: '100%'
        }}>Submit</button>
      </form>
    </div>
  );
} 