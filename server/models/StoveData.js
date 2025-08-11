const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  start_time: { type: String, required: true },
  end_time: { type: String, required: true },
  duration: { type: Number, required: true }, // in mins
  cooking_time: { type: Number, required: true }, // in mins
  wattage_W: { type: Number, required: true }
}, { _id: false });

const stoveDataSchema = new mongoose.Schema({
  stove_id: { type: String, required: true },
  location: { type: String, required: true },
  latitude: { type: Number },
  longitude: { type: Number },
  logs: [logSchema]
});

// Pre-save middleware to sort logs by date and time (latest first)
stoveDataSchema.pre('save', function(next) {
  if (this.logs && this.logs.length > 0) {
    this.logs.sort((a, b) => {
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
  next();
});

// Pre-update middleware to sort logs by date and time (latest first)
stoveDataSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  if (update.logs && Array.isArray(update.logs)) {
    update.logs.sort((a, b) => {
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
  next();
});

// Pre-update middleware for findByIdAndUpdate
stoveDataSchema.pre('findByIdAndUpdate', function(next) {
  const update = this.getUpdate();
  if (update.logs && Array.isArray(update.logs)) {
    update.logs.sort((a, b) => {
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
  next();
});

module.exports = mongoose.model('StoveData', stoveDataSchema); 