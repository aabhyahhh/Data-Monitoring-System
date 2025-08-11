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

async function reorderStoves() {
  try {
    console.log('Starting stove reordering process...');
    console.log('=====================================');
    
    // Get all stoves from database
    console.log('Fetching all stoves from database...');
    const allStoves = await StoveData.find({});
    console.log(`Found ${allStoves.length} stoves in database`);
    
    // Display current order
    console.log('\nCurrent stove order:');
    console.log('-------------------------------------');
    allStoves.forEach((stove, index) => {
      console.log(`${index + 1}. ${stove.stove_id} - ${stove.location}`);
    });
    
    // Sort stoves using custom sorting function
    console.log('\nSorting stoves...');
    const sortedStoves = [...allStoves].sort(customSort);
    
    // Display new order
    console.log('\nNew sorted order:');
    console.log('-------------------------------------');
    sortedStoves.forEach((stove, index) => {
      console.log(`${index + 1}. ${stove.stove_id} - ${stove.location}`);
    });
    
    // Update database with new order
    console.log('\nUpdating database with new order...');
    
    // We'll use a bulk operation to update all stoves
    // First, let's add a temporary sortOrder field
    const bulkOps = sortedStoves.map((stove, index) => ({
      updateOne: {
        filter: { _id: stove._id },
        update: { $set: { sortOrder: index + 1 } }
      }
    }));
    
    if (bulkOps.length > 0) {
      await StoveData.bulkWrite(bulkOps);
      console.log(`✓ Updated sort order for ${bulkOps.length} stoves`);
    }
    
    // Verify the changes
    console.log('\n=====================================');
    console.log('VERIFICATION:');
    console.log('=====================================');
    
    const verifiedStoves = await StoveData.find({}).sort({ sortOrder: 1 });
    console.log('Final database order:');
    console.log('-------------------------------------');
    verifiedStoves.forEach((stove, index) => {
      console.log(`${index + 1}. ${stove.stove_id} - ${stove.location} (Sort Order: ${stove.sortOrder})`);
    });
    
    console.log('\n=====================================');
    console.log('Stove reordering completed successfully!');
    console.log('=====================================');
    console.log('\nNote: The frontend should now display stoves in this order.');
    console.log('If you need to modify the frontend to use this sort order,');
    console.log('update the API call to sort by the sortOrder field.');
    
  } catch (error) {
    console.error('Error reordering stoves:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the script
reorderStoves().catch(console.error);
