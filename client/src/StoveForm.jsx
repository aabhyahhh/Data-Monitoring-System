import { useState, useRef } from 'react';
import { FiCalendar } from 'react-icons/fi';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function StoveForm({ onClose, onSubmit }) {
  const [stove_id, setStoveId] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [log, setLog] = useState({
    date: '',
    start_time: '',
    start_ampm: 'AM',
    end_time: '',
    end_ampm: 'AM',
    duration: '',
    cooking_time: '',
    wattage_W: ''
  });
  const dateInputRef = useRef(null);

  function handleChange(e) {
    setLog({ ...log, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    // Prevent duplicate submissions
    if (isSubmitting) {
      console.log('Form submission already in progress, ignoring duplicate submit');
      return;
    }
    
    setIsSubmitting(true);
    console.log('Submitting form with data:', { stove_id, location, log });
    
    try {
      // Convert AM/PM times to 24-hour format
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
      
      const processedLog = {
        ...log,
        start_time: convertTo24Hour(log.start_time, log.start_ampm),
        end_time: convertTo24Hour(log.end_time, log.end_ampm)
      };
      
      // Remove AM/PM fields from the final log object
      delete processedLog.start_ampm;
      delete processedLog.end_ampm;
      
      const formData = { stove_id, location, logs: [processedLog] };
      console.log('Processed form data:', formData);
      
      await onSubmit(formData);
      console.log('Form submitted successfully');
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
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
          <label style={{color:'#4a5568',fontWeight:500,display:'block',marginBottom:'4px'}}>Stove ID:</label>
          <input 
            value={stove_id} 
            onChange={e => setStoveId(e.target.value)} 
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
          <label style={{color:'#4a5568',fontWeight:500,display:'block',marginBottom:'4px'}}>Location:</label>
          <input 
            value={location} 
            onChange={e => setLocation(e.target.value)} 
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
          <div style={{marginBottom:8}}>
            <label style={{color:'#4a5568',fontWeight:500,display:'block',marginBottom:'4px'}}>Start Time:</label>
            <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
              <input 
                type="time" 
                name="start_time" 
                value={log.start_time} 
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
                value={log.start_ampm || 'AM'} 
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
                value={log.end_time} 
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
                value={log.end_ampm || 'AM'} 
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
              value={log.duration} 
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
              value={log.cooking_time} 
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
          <div style={{marginBottom:0}}>
            <label style={{color:'#4a5568',fontWeight:500,display:'block',marginBottom:'4px'}}>Wattage (W):</label>
            <input 
              name="wattage_W" 
              value={log.wattage_W} 
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
        </fieldset>
        <button 
          type="submit" 
          disabled={isSubmitting}
          style={{
            marginTop: 8,
            padding: '14px 32px',
            borderRadius: 10,
            background: isSubmitting 
              ? 'linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)'
              : 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)',
            color: '#fff',
            border: 'none',
            fontWeight: 600,
            fontSize: '1rem',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 15px rgba(74,144,226,0.13)',
            transition: 'all 0.3s ease',
            width: '100%',
            opacity: isSubmitting ? 0.7 : 1
          }}
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </div>
  );
} 