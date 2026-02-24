const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/auth');
const utilityRoutes = require('./routes/utilities');
const bookingRoutes = require('./routes/bookings');
const paymentRoutes = require('./routes/payments');
const analyticsRoutes = require('./routes/analytics');
const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notifications');
const auditRoutes = require('./routes/audit');
const organizationRoutes = require('./routes/organizations');
const verificationRoutes = require('./routes/verification');

const app = express();

// Middleware
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:4173'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/utilities', utilityRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/verification', verificationRoutes);

// Serve uploaded documents
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));

// Only serve React frontend when NOT running as serverless function
if (!process.env.VERCEL) {
  const clientBuildPath = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientBuildPath));

  // Any non-API route serves the React app
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server Error', error: err.message });
});

// Cached mongoose connection for serverless
async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI, {
    bufferCommands: false,
  });
  console.log('MongoDB Connected');
}

// Start server only when not on Vercel (local dev / traditional hosting)
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  connectDB()
    .then(() => {
      app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch((err) => {
      console.error('MongoDB Connection Error:', err.message);
      process.exit(1);
    });
}

module.exports = { app, connectDB };
