const express = require('express');
const router = express.Router();
const pool = require('../models/db');

// GET all slots with current status
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM parking_slots ORDER BY floor, slot_number'
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET available slots
router.get('/available', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM parking_slots WHERE status = 'available' ORDER BY floor, slot_number"
    );
    res.json({ success: true, data: result.rows, count: result.rowCount });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET slot by id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM parking_slots WHERE id = $1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ success: false, error: 'Slot not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update slot status (used by Android guard app)
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, vehicle_number } = req.body;

    const validStatuses = ['available', 'occupied', 'reserved', 'maintenance'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const result = await pool.query(
      `UPDATE parking_slots 
       SET status = $1, vehicle_number = $2, updated_at = NOW() 
       WHERE id = $3 
       RETURNING *`,
      [status, vehicle_number || null, id]
    );

    if (result.rowCount === 0) return res.status(404).json({ success: false, error: 'Slot not found' });

    // Record occupancy snapshot for ML
    await recordOccupancySnapshot();

    res.json({ success: true, data: result.rows[0], message: 'Slot updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Helper: record occupancy snapshot
async function recordOccupancySnapshot() {
  try {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    
    const countResult = await pool.query(
      "SELECT COUNT(*) as occupied FROM parking_slots WHERE status = 'occupied'"
    );
    const totalResult = await pool.query('SELECT COUNT(*) as total FROM parking_slots');
    
    const occupied = parseInt(countResult.rows[0].occupied);
    const total = parseInt(totalResult.rows[0].total);
    const rate = Math.round((occupied / total) * 100);

    await pool.query(
      `INSERT INTO occupancy_history (hour_of_day, day_of_week, occupied_count, total_slots, occupancy_rate)
       VALUES ($1, $2, $3, $4, $5)`,
      [hour, day, occupied, total, rate]
    );
  } catch (err) {
    console.error('Failed to record occupancy snapshot:', err.message);
  }
}

module.exports = router;
