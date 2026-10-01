const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { initDatabase } = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing
app.use(express.json({ limit: '3mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Forex Trading Journal API is running smoothly.',
    timestamp: new Date().toISOString()
  });
});

// Mount application routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/trades', require('./routes/tradeRoutes'));
app.use('/api/strategies', require('./routes/strategyRoutes'));
app.use('/api/backtesting', require('./routes/backtestingRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

// Serve frontend static build if available
const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// Centralized error handling
app.use(notFound);
app.use(errorHandler);

// Start server after verifying database
async function startServer() {
  try {
    console.log('🔄 Initializing database connection and schema...');
    await initDatabase();
    
    app.listen(PORT, () => {
      console.log(`🚀 Forex Journal Server is listening on http://localhost:${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server due to database error:', error);
    process.exit(1);
  }
}

startServer();
