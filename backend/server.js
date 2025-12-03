require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { auth } = require('./middleware/auth');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10kb' }));

// Test route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    time: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/organizations', require('./routes/organization.routes'));
// Protected example routes (organization-level access control)
app.use('/api', require('./routes/protectedRoutes'));

// Protected test route
app.get('/api/protected', auth, (req, res) => {
  res.json({
    status: 'success',
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      organization: req.user.organization
    }
  });
});

// Handle 404 - Keep this as the last route
app.all('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Can't find ${req.originalUrl} on this server!`
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  // Default error status and message
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;

// Start server with automatic retry if port is in use
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle port already in use error
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} is in use. Trying port ${PORT + 1}...`);
    const retryPort = PORT + 1;
    app.listen(retryPort, () => {
      console.log(`Server running on port ${retryPort} (backup port)`);
    });
  } else {
    throw err;
  }
});
