const express = require('express');
const router = express.Router();
const StoveData = require('../models/StoveData');
const { verifyToken, requireRole } = require('../middleware/auth');

// Helper function to sort logs by date and time (latest first)
function sortLogsByDateTime(logs) {
  return logs.sort((a, b) => {
    // Handle different date formats
    const parseDate = (dateValue) => {
      if (dateValue instanceof Date) {
        // Already a Date object
        return dateValue;
      } else if (typeof dateValue === 'string') {
        if (dateValue.includes('/')) {
          // Handle DD/MM/YYYY format
          const [day, month, year] = dateValue.split('/');
          return new Date(year, month - 1, day); // month is 0-indexed
        } else {
          // Handle other string formats
          return new Date(dateValue);
        }
      } else {
        // Handle other formats
        return new Date(dateValue);
      }
    };
    
    const dateA = parseDate(a.date);
    const dateB = parseDate(b.date);
    
    // If dates are different, sort by date (latest first)
    if (dateA.getTime() !== dateB.getTime()) {
      return dateB.getTime() - dateA.getTime();
    }
    
    // If dates are the same, sort by start time (latest first)
    const timeA = a.start_time;
    const timeB = b.start_time;
    
    // Convert time strings to comparable values
    const timeAValue = timeA ? parseInt(timeA.replace(':', '')) : 0;
    const timeBValue = timeB ? parseInt(timeB.replace(':', '')) : 0;
    
    return timeBValue - timeAValue;
  });
}

// GET /stoves - list all stoves (any authenticated user)
router.get('/stoves', verifyToken, async (req, res) => {
  try {
    const stoves = await StoveData.find({}, '-__v');
    
    // Sort stoves alphabetically by stove_id
    stoves.sort((a, b) => {
      // Extract prefix and number from stove IDs
      const aMatch = a.stove_id.match(/^([A-Z]+)_([A-Z]+)_(\d+)$/);
      const bMatch = b.stove_id.match(/^([A-Z]+)_([A-Z]+)_(\d+)$/);
      
      if (!aMatch || !bMatch) {
        // Fallback to simple string comparison if pattern doesn't match
        return a.stove_id.localeCompare(b.stove_id);
      }
      
      const [, aPrefix1, aPrefix2, aNum] = aMatch;
      const [, bPrefix1, bPrefix2, bNum] = bMatch;
      
      // Compare first prefix (e.g., "UP", "BH", "KN")
      const prefix1Comparison = aPrefix1.localeCompare(bPrefix1);
      if (prefix1Comparison !== 0) {
        return prefix1Comparison;
      }
      
      // If first prefix is same, compare second prefix (e.g., "V", "M", "S")
      const prefix2Comparison = aPrefix2.localeCompare(bPrefix2);
      if (prefix2Comparison !== 0) {
        return prefix2Comparison;
      }
      
      // If both prefixes are same, compare numbers
      return parseInt(aNum) - parseInt(bNum);
    });
    
    res.json(stoves);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /stoves/:id - get logs for one stove (any authenticated user)
router.get('/stoves/:id', verifyToken, async (req, res) => {
  try {
    const stove = await StoveData.findById(req.params.id, '-__v');
    if (!stove) return res.status(404).json({ error: 'Not found' });
    res.json(stove);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /stoves/by-stoveid/:stove_id - get all logs for a given stove_id (any authenticated user)
router.get('/stoves/by-stoveid/:stove_id', verifyToken, async (req, res) => {
  try {
    const docs = await StoveData.find({ stove_id: req.params.stove_id }, '-__v');
    // Combine all logs from all docs
    const allLogs = docs.flatMap(doc => doc.logs.map(log => ({ ...log.toObject(), stoveDocId: doc._id })));
    
    // Sort logs by date and time (latest first)
    sortLogsByDateTime(allLogs);
    
    res.json({ logs: allLogs });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add this endpoint to count cooking sessions in the last 24 hours
router.get('/stoves/logs/last24h/count', verifyToken, async (req, res) => {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const stoves = await StoveData.find({}, 'logs');
    let count = 0;
    stoves.forEach(stove => {
      stove.logs.forEach(log => {
        // Combine date and start_time to get the actual datetime
        let logDateTime;
        if (log.date && log.start_time) {
          // log.date may be a Date or a string
          const datePart = (log.date instanceof Date)
            ? log.date.toISOString().slice(0, 10)
            : (typeof log.date === 'string' ? log.date.slice(0, 10) : '');
          logDateTime = new Date(`${datePart}T${log.start_time}`);
        } else if (log.date) {
          logDateTime = new Date(log.date);
        }
        if (logDateTime && logDateTime >= since) {
          count++;
        }
      });
    });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add this endpoint to get total cooking minutes
router.get('/stoves/logs/total-cooking-minutes', verifyToken, async (req, res) => {
  try {
    const stoves = await StoveData.find({}, 'logs');
    let totalMinutes = 0;
    stoves.forEach(stove => {
      totalMinutes += stove.logs.reduce((sum, log) => sum + (log.cooking_time || 0), 0);
    });
    res.json({ totalMinutes });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /stoves - add new stove (super_admin only)
router.post('/stoves', verifyToken, requireRole('super_admin'), async (req, res) => {
  try {
    console.log('POST /stoves received request:', {
      stove_id: req.body.stove_id,
      location: req.body.location,
      logsCount: req.body.logs?.length || 0,
      timestamp: new Date().toISOString()
    });
    
    // If logs are being added, sort them before saving
    if (req.body.logs && Array.isArray(req.body.logs)) {
      sortLogsByDateTime(req.body.logs);
    }
    
    const stove = new StoveData(req.body);
    await stove.save();
    
    console.log('Stove saved successfully:', stove.stove_id);
    
    // Return all stoves sorted alphabetically
    const allStoves = await StoveData.find({}, '-__v');
    allStoves.sort((a, b) => {
      const aMatch = a.stove_id.match(/^([A-Z]+)_([A-Z]+)_(\d+)$/);
      const bMatch = b.stove_id.match(/^([A-Z]+)_([A-Z]+)_(\d+)$/);
      
      if (!aMatch || !bMatch) {
        return a.stove_id.localeCompare(b.stove_id);
      }
      
      const [, aPrefix1, aPrefix2, aNum] = aMatch;
      const [, bPrefix1, bPrefix2, bNum] = bMatch;
      
      const prefix1Comparison = aPrefix1.localeCompare(bPrefix1);
      if (prefix1Comparison !== 0) {
        return prefix1Comparison;
      }
      
      const prefix2Comparison = aPrefix2.localeCompare(bPrefix2);
      if (prefix2Comparison !== 0) {
        return prefix2Comparison;
      }
      
      return parseInt(aNum) - parseInt(bNum);
    });
    
    res.status(201).json(allStoves);
  } catch (err) {
    console.error('Error in POST /stoves:', err);
    res.status(400).json({ error: 'Invalid data' });
  }
});

// PUT /stoves/:id - edit stove (super_admin only)
router.put('/stoves/:id', verifyToken, requireRole('super_admin'), async (req, res) => {
  try {
    // If logs are being updated, sort them before saving
    if (req.body.logs && Array.isArray(req.body.logs)) {
      sortLogsByDateTime(req.body.logs);
    }
    
    const stove = await StoveData.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!stove) return res.status(404).json({ error: 'Not found' });
    res.json(stove);
  } catch (err) {
    res.status(400).json({ error: 'Invalid data' });
  }
});

// DELETE /stoves/:id - delete stove (super_admin only)
router.delete('/stoves/:id', verifyToken, requireRole('super_admin'), async (req, res) => {
  try {
    console.log('DELETE /stoves/:id received request for id:', req.params.id);
    
    const stove = await StoveData.findByIdAndDelete(req.params.id);
    if (!stove) {
      console.log('Stove not found for deletion:', req.params.id);
      return res.status(404).json({ error: 'Not found' });
    }
    
    console.log('Stove deleted successfully:', stove.stove_id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('Error deleting stove:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 