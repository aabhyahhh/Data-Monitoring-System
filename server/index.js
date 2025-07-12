const express = require('express');
const app = express();
const PORT = 5000;
const cors = require('cors');
   app.use(cors());
const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/.env' });

const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error('Missing MONGO_URI in server/.env');
  process.exit(1);
}

mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

app.use(express.json());
app.use('/', require('./routes/auth'));
app.use('/api', require('./routes/stoves'));
const { verifyToken } = require('./middleware/auth');
const { requireRole } = require('./middleware/auth');

app.get('/protected', verifyToken, (req, res) => {
  res.json({ user: req.user });
});

app.get('/ping', (req, res) => {
  res.send('pong');
});

app.get('/admin-only', verifyToken, requireRole('super_admin'), (req, res) => {
  res.send('Super admin content');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 