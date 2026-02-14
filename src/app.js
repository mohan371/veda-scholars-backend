const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const universityRoutes = require('./routes/universityRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const helmet = require('helmet');
const compression = require('compression'); // gzip
const rateLimit = require('express-rate-limit');

const app = express();

// Security & Performance Middleware
app.use(helmet());
app.use(compression());

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use(cors());

// Tenant Middleware
app.use(require('./middleware/tenantMiddleware').resolveTenant);

// Database Connection
connectDB();

// Routes
app.get('/api/test', (req, res) => {
    res.json({ message: "Backend working" });
});

app.use('/api/auth', authRoutes);
app.use('/api/universities', universityRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/subscriptions', require('./routes/subscriptionRoutes'));
app.use('/api/chat', require('./routes/chatRoutes')); // Register Chat Routes
app.use('/api/support', require('./routes/supportRoutes'));
app.use('/api/admin', require('./routes/adminUserRoutes')); // Admin User Management

app.use(require('./middleware/errorMiddleware').errorHandler);

module.exports = app;
