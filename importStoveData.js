const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/server/.env' });

// CONFIGURABLES
const CSV_FILES = [
  'Data Monitoring_Received and Processed Data - UP_V copy.csv',
  'Copy of Data Monitoring_Received and Processed Data - UP_V.csv'
];

// Use the same MongoDB URI as the server
const MONGODB_URI = process.env.MONGO_URI;
if (!MONGODB_URI) {
  console.error('Missing MONGO_URI in server/.env');
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Connection is already established above

// Import the StoveData model
const StoveData = require('./server/models/StoveData');

function dmsToDecimal(dms) {
  if (!dms || dms.trim() === '') return null;
  
  // Handle different formats
  // Format 1: 25°25'52.1""
  let match = dms.match(/(\d+)°(\d+)'(\d+(?:\.\d+)?)"/);
  if (match) {
    const deg = parseFloat(match[1]);
    const min = parseFloat(match[2]);
    const sec = parseFloat(match[3]);
    return deg + min / 60 + sec / 3600;
  }
  
  // Format 2: 25"69'26.2""
  match = dms.match(/(\d+)"(\d+)'(\d+(?:\.\d+)?)"/);
  if (match) {
    const deg = parseFloat(match[1]);
    const min = parseFloat(match[2]);
    const sec = parseFloat(match[3]);
    return deg + min / 60 + sec / 3600;
  }
  
  // Format 3: 13"10'94.8""
  match = dms.match(/(\d+)"(\d+)'(\d+(?:\.\d+)?)"/);
  if (match) {
    const deg = parseFloat(match[1]);
    const min = parseFloat(match[2]);
    const sec = parseFloat(match[3]);
    return deg + min / 60 + sec / 3600;
  }
  
  console.warn(`Could not parse coordinate: ${dms}`);
  return null;
}

function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

function groupByStove(data) {
  // Group by Stove_ID and Location
  const grouped = {};
  data.forEach(row => {
    const stove_id = row['Stove_ID'];
    const location = row['Location (SIM Tower)'];
    const latitude = dmsToDecimal(row['Latitude']);
    const longitude = dmsToDecimal(row['Longitude']);
    
    // Skip if essential data is missing
    if (!stove_id || !location) {
      console.warn(`Skipping row with missing stove_id or location:`, row);
      return;
    }
    
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
    
    // Skip if log data is missing
    if (!row['Date'] || !row['Start_Time'] || !row['End_Time'] || 
        !row['Duration_min'] || !row['Cooking_Time_min'] || !row['Wattage_W']) {
      console.warn(`Skipping log with missing data for stove ${stove_id}:`, row);
      return;
    }
    
    grouped[key].logs.push({
      date: new Date(row['Date']),
      start_time: row['Start_Time'],
      end_time: row['End_Time'],
      duration: Number(row['Duration_min']),
      cooking_time: Number(row['Cooking_Time_min']),
      wattage_W: Number(row['Wattage_W'])
    });
  });
  return Object.values(grouped);
}

async function checkExistingStove(stove) {
  try {
    const existingStove = await StoveData.findOne({ 
      stove_id: stove.stove_id,
      location: stove.location
    });
    
    if (!existingStove) {
      return { exists: false, existingLogs: [] };
    }
    
    return { exists: true, existingLogs: existingStove.logs };
  } catch (error) {
    console.error(`Error checking existing stove ${stove.stove_id}:`, error);
    return { exists: false, existingLogs: [] };
  }
}

function isLogDuplicate(newLog, existingLogs) {
  return existingLogs.some(existingLog => 
    existingLog.date.getTime() === newLog.date.getTime() &&
    existingLog.start_time === newLog.start_time &&
    existingLog.end_time === newLog.end_time &&
    existingLog.duration === newLog.duration &&
    existingLog.cooking_time === newLog.cooking_time &&
    existingLog.wattage_W === newLog.wattage_W
  );
}

async function uploadStoves(stoves) {
  let totalStoves = 0;
  let newStoves = 0;
  let totalLogs = 0;
  let newLogs = 0;
  let skippedLogs = 0;
  
  for (const stove of stoves) {
    totalStoves++;
    console.log(`Processing stove ${stove.stove_id} (${stove.location})...`);
    
    try {
      const { exists, existingLogs } = await checkExistingStove(stove);
      
      if (!exists) {
        // Create new stove with all logs
        const newStove = new StoveData(stove);
        await newStove.save();
        console.log(`✓ Created new stove ${stove.stove_id} with ${stove.logs.length} logs`);
        newStoves++;
        newLogs += stove.logs.length;
      } else {
        // Add only non-duplicate logs
        const newLogsToAdd = [];
        for (const log of stove.logs) {
          totalLogs++;
          if (isLogDuplicate(log, existingLogs)) {
            console.log(`  - Skipping duplicate log: ${log.date.toDateString()} ${log.start_time}-${log.end_time}`);
            skippedLogs++;
          } else {
            newLogsToAdd.push(log);
            newLogs++;
          }
        }
        
        if (newLogsToAdd.length > 0) {
          await StoveData.updateOne(
            { stove_id: stove.stove_id, location: stove.location },
            { $push: { logs: { $each: newLogsToAdd } } }
          );
          console.log(`✓ Updated existing stove ${stove.stove_id} with ${newLogsToAdd.length} new logs`);
        } else {
          console.log(`- No new logs to add for stove ${stove.stove_id}`);
        }
      }
    } catch (error) {
      console.error(`✗ Error processing stove ${stove.stove_id}:`, error.message);
    }
  }
  
  return { totalStoves, newStoves, totalLogs, newLogs, skippedLogs };
}

async function main() {
  try {
    console.log('Starting CSV import process...');
    console.log('=====================================');
    
    let allStoves = [];
    
    // Process each CSV file
    for (const csvFile of CSV_FILES) {
      const filePath = path.join(__dirname, csvFile);
      
      if (!fs.existsSync(filePath)) {
        console.warn(`CSV file not found: ${csvFile}`);
        continue;
      }
      
      console.log(`\nProcessing file: ${csvFile}`);
      console.log('-------------------------------------');
      
      const csvData = await parseCSV(filePath);
      console.log(`Read ${csvData.length} rows from CSV`);
      
      const stoves = groupByStove(csvData);
      console.log(`Grouped into ${stoves.length} unique stoves`);
      
      allStoves = allStoves.concat(stoves);
    }
    
    if (allStoves.length === 0) {
      console.log('No valid stove data found in CSV files');
      return;
    }
    
    console.log(`\nTotal unique stoves to process: ${allStoves.length}`);
    console.log('=====================================');
    
    const results = await uploadStoves(allStoves);
    
    console.log('\n=====================================');
    console.log('IMPORT SUMMARY:');
    console.log('=====================================');
    console.log(`Total stoves processed: ${results.totalStoves}`);
    console.log(`New stoves created: ${results.newStoves}`);
    console.log(`Total logs processed: ${results.totalLogs}`);
    console.log(`New logs added: ${results.newLogs}`);
    console.log(`Duplicate logs skipped: ${results.skippedLogs}`);
    console.log('=====================================');
    
  } catch (error) {
    console.error('Error during import:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the script
main().catch(console.error);
