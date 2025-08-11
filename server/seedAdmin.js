const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/.env' });
const User = require('./models/User');

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    const admin = await User.findOneAndUpdate(
      { username: 'admin' },
      { password: 'd@t@', role: 'super_admin' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log('Seeded admin user:', admin);
    const viewer = await User.findOneAndUpdate(
      { username: 'viewer' },
      { password: 'c!bos', role: 'viewer' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log('Seeded viewer user:', viewer);
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

seedAdmin(); 