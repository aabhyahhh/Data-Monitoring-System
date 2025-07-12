const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/.env' });

const User = require('./models/User');
const StoveData = require('./models/StoveData');

async function testModels() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('MongoDB connected');

    // Test User model
    const user = new User({
      username: 'testuser',
      password: 'testpass',
      role: 'viewer'
    });
    await user.save();
    console.log('User saved:', user);

    // Test StoveData model
    const stove = new StoveData({
      stove_id: 'stove001',
      location: 'Test Kitchen',
      logs: [{
        date: new Date(),
        start_time: '09:00',
        end_time: '09:30',
        duration: 30,
        cooking_time: 25,
        wattage_W: 1200
      }]
    });
    await stove.save();
    console.log('StoveData saved:', stove);

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

testModels(); 