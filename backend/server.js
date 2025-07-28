require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const allowedOrigins = [
  'https://ai-playground-e757.vercel.app',
  'http://localhost:3000'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

const authRoutes = require('./routes/auth');
const sessionRoutes = require('./routes/session');
const aiRoutes = require('./routes/ai');

app.use('/api/auth', authRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/ai', aiRoutes);

app.get('/', (req, res) => {
  res.send('API is running!');
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => app.listen(process.env.PORT || 5000, () => console.log(`Server running on port ${process.env.PORT || 5000}`)))
  .catch(err => console.error(err)); 