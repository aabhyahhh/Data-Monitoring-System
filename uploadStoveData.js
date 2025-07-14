const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const axios = require('axios');

// CONFIGURABLES
const CSV_PATH = path.join(__dirname, 'Data Monitoring_Received and Processed Data - UP_V.csv');
const LOGIN_URL = 'http://localhost:5000/login';
const STOVES_URL = 'http://localhost:5000/api/stoves';
const ADMIN_CREDENTIALS = { username: 'admin', password: 'test' };

async function login() {
  const res = await axios.post(LOGIN_URL, ADMIN_CREDENTIALS);
  return res.data.token;
}

function parseCSV() {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(CSV_PATH)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

function dmsToDecimal(dms) {
  // Example: 25°25'52.1"""
  const match = dms.match(/(\d+)°(\d+)'(\d+(?:\.\d+)?)"/);
  if (!match) return null;
  const deg = parseFloat(match[1]);
  const min = parseFloat(match[2]);
  const sec = parseFloat(match[3]);
  return deg + min / 60 + sec / 3600;
}

function groupByStove(data) {
  // Group by Stove_ID and Location
  const grouped = {};
  data.forEach(row => {
    const stove_id = row['Stove_ID'];
    const location = row['Location (SIM Tower)'];
    const latitude = dmsToDecimal(row['Latitude']);
    const longitude = dmsToDecimal(row['Longitude']);
    const key = `${stove_id}||${location}`;
    if (!grouped[key]) {
      grouped[key] = {
        stove_id,
        location,
        latitude,
        longitude,
        logs: []
      };
    }
    grouped[key].logs.push({
      date: row['Date'],
      start_time: row['Start_Time'],
      end_time: row['End_Time'],
      duration: Number(row['Duration_min']),
      cooking_time: Number(row['Cooking_Time_min']),
      wattage_W: Number(row['Wattage_W'])
    });
  });
  return Object.values(grouped);
}

async function uploadStoves(stoves, token) {
  for (const stove of stoves) {
    try {
      const res = await axios.post(STOVES_URL, stove, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`Uploaded stove ${stove.stove_id} (${stove.location})`);
    } catch (err) {
      if (err.response) {
        console.error(`Failed to upload stove ${stove.stove_id}:`, err.response.data);
      } else {
        console.error(`Failed to upload stove ${stove.stove_id}:`, err.message);
      }
    }
  }
}

(async function main() {
  try {
    const token = await login();
    const csvData = await parseCSV();
    const stoves = groupByStove(csvData);
    await uploadStoves(stoves, token);
    console.log('All done!');
  } catch (err) {
    console.error('Error:', err);
  }
})(); 