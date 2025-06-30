const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Log important environment variables (excluding sensitive ones)
console.log('Environment Configuration:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('CLIENT_URL:', process.env.CLIENT_URL);
console.log('MONGO_URI:', process.env.MONGO_URI ? 'Set' : 'Not Set');
console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'Not Set');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set' : 'Not Set');

const app = express();

// Configure CORS to allow requests from the client
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

const PORT = process.env.PORT || 5000;

// MongoDB connection with fallback to local MongoDB
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/document-signature';
console.log('Connecting to MongoDB:', mongoUri);

mongoose.connect(mongoUri, {
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
}).then(() => {
  console.log('✅ MongoDB connected successfully');
}).catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  console.log('💡 If using MongoDB Atlas, make sure your IP is whitelisted');
  console.log('💡 For local development, install MongoDB locally or use MongoDB Atlas');
  process.exit(1);
});

app.get('/', (req, res) => {
  res.send('API is running...');
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/documents', require('./routes/documents'));

// Serve static assets
app.use('/uploads', express.static('uploads'));

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🌐 Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
}); 