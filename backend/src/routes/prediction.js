const express = require('express');
const router = express.Router();
const pool = require('../models/db');

/**
 * OCCUPANCY PREDICTION ENGINE
 * Primary: Historical average by hour + day of week
 * Fallback: Last 3 entries average
 */

// GET prediction for current or specified time
router.get('/', async (req, res) => {
  try {
    const { hour, day, use_fallback } = req.query;

    const targetHour = hour !== undefined ? parseInt(hour) : new Date().getHours();
    const targetDay = day !== undefined ? parseInt(day) : new Date().getDay();
    const forceFallback = use_fallback === 'true';

    let prediction;
    let method;

    if (!forceFallback) {
      // PRIMARY METHOD: Historical average for this hour + day of week
      prediction = await getHistoricalAverage(targetHour, targetDay);
      method = 'historical_average';
    }

    // FALLBACK: Last 3 entries if primary has insufficient data or forced
    if (!prediction || prediction.sample_count < 3 || forceFallback) {
      prediction = await getLastThreeFallback();
      method = 'fallback_last3';
    }

    // Get current real stats
    const currentStats = await getCurrentStats();

    res.json({
      success: true,
      method,
      is_fallback: method === 'fallback_last3',
      prediction: {
        hour: targetHour,
        day: targetDay,
        predicted_occupancy_rate: prediction.predicted_rate,
        predicted_occupied: Math.round((prediction.predicted_rate / 100) * currentStats.total),
        confidence: prediction.confidence,
        sample_count: prediction.sample_count
      },
      current: currentStats,
      peak_hours: [8, 9, 10, 17, 18, 19],
      recommendation: getRecommendation(prediction.predicted_rate)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET hourly predictions for today (full day chart)
router.get('/today', async (req, res) => {
  try {
    const { use_fallback } = req.query;
    const forceFallback = use_fallback === 'true';
    const dayOfWeek = new Date().getDay();
    const predictions = [];

    for (let hour = 0; hour < 24; hour++) {
      let pred;
      if (!forceFallback) {
        pred = await getHistoricalAverage(hour, dayOfWeek);
      }

      if (!pred || pred.sample_count < 3 || forceFallback) {
        pred = await getLastThreeFallback();
        pred.method = 'fallback';
      } else {
        pred.method = 'ai';
      }

      predictions.push({
        hour,
        predicted_rate: pred.predicted_rate,
        method: pred.method
      });
    }

    res.json({ success: true, day_of_week: dayOfWeek, predictions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PRIMARY: Historical average by hour and day of week
async function getHistoricalAverage(hour, day) {
  const result = await pool.query(
    `SELECT 
       AVG(occupancy_rate) as avg_rate,
       COUNT(*) as sample_count
     FROM occupancy_history
     WHERE hour_of_day = $1 AND day_of_week = $2`,
    [hour, day]
  );

  const row = result.rows[0];
  if (!row || !row.avg_rate) return null;

  return {
    predicted_rate: Math.round(parseFloat(row.avg_rate)),
    sample_count: parseInt(row.sample_count),
    confidence: Math.min(95, 60 + parseInt(row.sample_count) * 2) // More samples = more confidence
  };
}

// FALLBACK: Last 3 occupancy entries average
async function getLastThreeFallback() {
  const result = await pool.query(
    `SELECT occupancy_rate 
     FROM occupancy_history 
     ORDER BY recorded_at DESC 
     LIMIT 3`
  );

  if (result.rowCount === 0) {
    return { predicted_rate: 50, sample_count: 0, confidence: 10 };
  }

  const avg = result.rows.reduce((sum, r) => sum + parseFloat(r.occupancy_rate), 0) / result.rowCount;

  return {
    predicted_rate: Math.round(avg),
    sample_count: result.rowCount,
    confidence: 40
  };
}

// Get current real-time stats
async function getCurrentStats() {
  const result = await pool.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN status = 'occupied' THEN 1 END) as occupied,
      COUNT(CASE WHEN status = 'available' THEN 1 END) as available,
      COUNT(CASE WHEN status = 'reserved' THEN 1 END) as reserved
    FROM parking_slots
  `);
  
  const row = result.rows[0];
  return {
    total: parseInt(row.total),
    occupied: parseInt(row.occupied),
    available: parseInt(row.available),
    reserved: parseInt(row.reserved),
    occupancy_rate: Math.round((parseInt(row.occupied) / parseInt(row.total)) * 100)
  };
}

function getRecommendation(rate) {
  if (rate >= 90) return { level: 'high', message: 'Parking is nearly full. Book immediately!', color: 'red' };
  if (rate >= 70) return { level: 'medium', message: 'Limited spots available. Book soon.', color: 'orange' };
  if (rate >= 40) return { level: 'low', message: 'Good availability. Plenty of spots.', color: 'yellow' };
  return { level: 'very_low', message: 'Parking is mostly empty. Easy to find a spot.', color: 'green' };
}

module.exports = router;
