const express = require('express');
const router = express.Router();
const pool = require('../models/db');

// GET all bookings
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM bookings ORDER BY created_at DESC LIMIT 100'
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create a new booking
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { user_name, user_phone, vehicle_number, slot_id, duration_hours = 2 } = req.body;

    if (!user_name || !user_phone || !vehicle_number || !slot_id) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Check slot availability
    const slotResult = await client.query(
      "SELECT * FROM parking_slots WHERE id = $1 AND status = 'available'",
      [slot_id]
    );

    if (slotResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, error: 'Slot not available' });
    }

    const slot = slotResult.rows[0];
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + duration_hours * 60 * 60 * 1000);

    // Create booking
    const bookingResult = await client.query(
      `INSERT INTO bookings (user_name, user_phone, vehicle_number, slot_id, slot_number, start_time, end_time, duration_hours)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [user_name, user_phone, vehicle_number, slot_id, slot.slot_number, startTime, endTime, duration_hours]
    );

    // Update slot status to reserved
    await client.query(
      "UPDATE parking_slots SET status = 'reserved', vehicle_number = $1, updated_at = NOW() WHERE id = $2",
      [vehicle_number, slot_id]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      data: bookingResult.rows[0],
      message: `Slot ${slot.slot_number} booked successfully!`
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

// PUT cancel booking
router.put('/:id/cancel', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const booking = await client.query(
      "SELECT * FROM bookings WHERE id = $1 AND status = 'active'",
      [id]
    );

    if (booking.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Active booking not found' });
    }

    await client.query(
      "UPDATE bookings SET status = 'cancelled' WHERE id = $1",
      [id]
    );

    await client.query(
      "UPDATE parking_slots SET status = 'available', vehicle_number = NULL WHERE id = $1",
      [booking.rows[0].slot_id]
    );

    await client.query('COMMIT');
    res.json({ success: true, message: 'Booking cancelled successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
