require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const slotsRouter = require('./routes/slots');
const bookingsRouter = require('./routes/bookings');
const predictionRouter = require('./routes/prediction');
const adminRouter = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/slots', slotsRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/prediction', predictionRouter);
app.use('/api/admin', adminRouter);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

app.listen(PORT, () => {
  console.log(`🚗 Smart Parking Backend running on port ${PORT}`);
});

module.exports = app;
