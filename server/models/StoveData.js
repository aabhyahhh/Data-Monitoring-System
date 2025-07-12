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
  logs: [logSchema]
});

module.exports = mongoose.model('StoveData', stoveDataSchema); 