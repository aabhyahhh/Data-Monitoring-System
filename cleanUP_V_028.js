const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/server/.env' });

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

function extractUP_V_028Data(data) {
  const upV028Entries = data.filter(row => row['Stove_ID'] === 'UP_V_028');
  
  if (upV028Entries.length === 0) {
    throw new Error('No UP_V_028 entries found in CSV');
  }
  
  // Get the first entry to extract stove info
  const firstEntry = upV028Entries[0];
  const stoveInfo = {
    stove_id: 'UP_V_028',
    location: 'Chunar',
    latitude: dmsToDecimal(firstEntry['Latitude']),
    longitude: dmsToDecimal(firstEntry['Longitude']),
    logs: []
  };
  
  // Extract all logs for UP_V_028
  upV028Entries.forEach(row => {
    if (row['Date'] && row['Start_Time'] && row['End_Time'] && 
        row['Duration_min'] && row['Cooking_Time_min'] && row['Wattage_W']) {
      stoveInfo.logs.push({
        date: new Date(row['Date']),
        start_time: row['Start_Time'],
        end_time: row['End_Time'],
        duration: Number(row['Duration_min']),
        cooking_time: Number(row['Cooking_Time_min']),
        wattage_W: Number(row['Wattage_W'])
      });
    }
  });
  
  // Sort logs by date
  stoveInfo.logs.sort((a, b) => a.date.getTime() - b.date.getTime());
  
  return stoveInfo;
}

async function cleanUP_V_028() {
  try {
    console.log('Starting UP_V_028 complete cleanup...');
    console.log('=====================================');
    
    // First, let's see what's currently in the database
    console.log('Checking current database state...');
    const allUP_V_028 = await StoveData.find({ stove_id: 'UP_V_028' });
    console.log(`Found ${allUP_V_028.length} records for UP_V_028 in database`);
    
    allUP_V_028.forEach((stove, index) => {
      console.log(`Record ${index + 1}: ID=${stove._id}, Location=${stove.location}, Logs=${stove.logs.length}`);
    });
    
    // Delete ALL existing UP_V_028 records
    console.log('\nDeleting all existing UP_V_028 records...');
    const deleteResult = await StoveData.deleteMany({ stove_id: 'UP_V_028' });
    console.log(`✓ Deleted ${deleteResult.deletedCount} UP_V_028 records`);
    
    // Read the CSV file
    const csvPath = path.join(__dirname, 'Data Monitoring_Received and Processed Data - UP_V copy.csv');
    if (!fs.existsSync(csvPath)) {
      throw new Error('CSV file not found');
    }
    
    console.log('\nReading CSV file...');
    const csvData = await parseCSV(csvPath);
    console.log(`Read ${csvData.length} rows from CSV`);
    
    // Extract UP_V_028 data
    console.log('Extracting UP_V_028 data...');
    const upV028Data = extractUP_V_028Data(csvData);
    console.log(`Found ${upV028Data.logs.length} logs for UP_V_028`);
    
    // Display the logs that will be added
    console.log('\nUP_V_028 logs from CSV:');
    console.log('-------------------------------------');
    upV028Data.logs.forEach((log, index) => {
      console.log(`${index + 1}. ${log.date.toDateString()} ${log.start_time}-${log.end_time} (${log.duration}min, ${log.wattage_W}W)`);
    });
    
    // Create a completely new UP_V_028 record
    console.log('\nCreating new UP_V_028 record...');
    const newStove = new StoveData(upV028Data);
    await newStove.save();
    console.log('✓ Created new UP_V_028 record with correct logs');
    
    // Verify the cleanup
    const finalCheck = await StoveData.find({ stove_id: 'UP_V_028' });
    console.log('\n=====================================');
    console.log('FINAL VERIFICATION:');
    console.log('=====================================');
    console.log(`Total UP_V_028 records in database: ${finalCheck.length}`);
    
    if (finalCheck.length === 1) {
      const stove = finalCheck[0];
      console.log(`✓ Single record found:`);
      console.log(`  - Stove ID: ${stove.stove_id}`);
      console.log(`  - Location: ${stove.location}`);
      console.log(`  - Total logs: ${stove.logs.length}`);
      console.log(`  - Latitude: ${stove.latitude}`);
      console.log(`  - Longitude: ${stove.longitude}`);
      
      console.log('\nFinal logs:');
      console.log('-------------------------------------');
      stove.logs.forEach((log, index) => {
        console.log(`${index + 1}. ${log.date.toDateString()} ${log.start_time}-${log.end_time} (${log.duration}min, ${log.wattage_W}W)`);
      });
      
      console.log('\n=====================================');
      console.log('UP_V_028 cleanup completed successfully!');
      console.log('=====================================');
    } else {
      console.log('❌ ERROR: Multiple records still exist!');
      finalCheck.forEach((stove, index) => {
        console.log(`Record ${index + 1}: ${stove.logs.length} logs`);
      });
    }
    
  } catch (error) {
    console.error('Error cleaning UP_V_028 data:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the script
cleanUP_V_028().catch(console.error);
