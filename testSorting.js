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

function customSort(a, b) {
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
}

async function testSorting() {
  try {
    console.log('Testing stove sorting functionality...');
    console.log('=====================================');
    
    // Get all stoves from database
    console.log('Fetching all stoves from database...');
    const allStoves = await StoveData.find({});
    console.log(`Found ${allStoves.length} stoves in database`);
    
    if (allStoves.length === 0) {
      console.log('No stoves found in database. Please run the import script first.');
      return;
    }
    
    // Display current order
    console.log('\nCurrent stove order (as stored in database):');
    console.log('-------------------------------------');
    allStoves.forEach((stove, index) => {
      console.log(`${index + 1}. ${stove.stove_id} - ${stove.location}`);
    });
    
    // Sort stoves using custom sorting function
    console.log('\nSorting stoves alphabetically...');
    const sortedStoves = [...allStoves].sort(customSort);
    
    // Display new order
    console.log('\nSorted order (alphabetical by ID):');
    console.log('-------------------------------------');
    sortedStoves.forEach((stove, index) => {
      console.log(`${index + 1}. ${stove.stove_id} - ${stove.location}`);
    });
    
    // Show the sorting logic for specific examples
    console.log('\n=====================================');
    console.log('SORTING LOGIC EXAMPLES:');
    console.log('=====================================');
    
    const examples = [
      'UP_V_025', 'UP_V_026', 'UP_V_027', 'UP_V_028',
      'BH_V_022', 'BH_P_023',
      'KN_M_015', 'KN_M_016', 'KN_M_017',
      'MP_S_010',
      'KL_E_018',
      'RJ_T_007', 'RJ_J_008', 'RJ_J_009'
    ];
    
    console.log('Example sorting order:');
    examples.forEach((id, index) => {
      console.log(`${index + 1}. ${id}`);
    });
    
    console.log('\n=====================================');
    console.log('SORTING RULES:');
    console.log('=====================================');
    console.log('1. First by state prefix (BH, KL, KN, MP, RJ, UP)');
    console.log('2. Then by type prefix (E, J, M, P, S, T, V)');
    console.log('3. Finally by number in ascending order');
    console.log('\nExample: UP_V_025, UP_V_026, UP_V_027, UP_V_028');
    console.log('         BH_V_022, BH_P_023');
    console.log('         KN_M_015, KN_M_016, KN_M_017');
    
    console.log('\n=====================================');
    console.log('The server API now automatically sorts stoves this way!');
    console.log('Any new stoves added will be automatically ordered.');
    console.log('=====================================');
    
  } catch (error) {
    console.error('Error testing sorting:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the script
testSorting().catch(console.error);
