const express = require('express');
const router = express.Router();
const pool = require('../models/db');

// GET dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const [slots, bookings, history] = await Promise.all([
      pool.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'available' THEN 1 END) as available,
          COUNT(CASE WHEN status = 'occupied' THEN 1 END) as occupied,
          COUNT(CASE WHEN status = 'reserved' THEN 1 END) as reserved,
          COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance
        FROM parking_slots
      `),
      pool.query(`
        SELECT 
          COUNT(*) as total_bookings,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
          COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as today
        FROM bookings
      `),
      pool.query(`
        SELECT hour_of_day, ROUND(AVG(occupancy_rate), 1) as avg_rate
        FROM occupancy_history
        GROUP BY hour_of_day
        ORDER BY hour_of_day
      `)
    ]);

    res.json({
      success: true,
      slots: slots.rows[0],
      bookings: bookings.rows[0],
      hourly_averages: history.rows
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET all slots grouped by floor
router.get('/slots-by-floor', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT floor, 
        json_agg(json_build_object(
          'id', id,
          'slot_number', slot_number,
          'status', status,
          'slot_type', slot_type,
          'vehicle_number', vehicle_number,
          'updated_at', updated_at
        ) ORDER BY slot_number) as slots
      FROM parking_slots
      GROUP BY floor
      ORDER BY floor
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT set slot to maintenance
router.put('/slots/:id/maintenance', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "UPDATE parking_slots SET status = 'maintenance', vehicle_number = NULL WHERE id = $1 RETURNING *",
      [id]
    );
    if (result.rowCount === 0) return res.status(404).json({ success: false, error: 'Slot not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
