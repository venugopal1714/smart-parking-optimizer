-- Smart Parking Database Schema
-- Run this in PostgreSQL before starting backend

CREATE DATABASE smart_parking;
\c smart_parking;

-- Parking slots table
CREATE TABLE parking_slots (
  id SERIAL PRIMARY KEY,
  slot_number VARCHAR(10) UNIQUE NOT NULL,
  floor VARCHAR(5) DEFAULT 'G',
  slot_type VARCHAR(20) DEFAULT 'regular', -- regular, handicap, ev
  status VARCHAR(20) DEFAULT 'available',  -- available, occupied, reserved, maintenance
  vehicle_number VARCHAR(20),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Bookings table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name VARCHAR(100) NOT NULL,
  user_phone VARCHAR(15) NOT NULL,
  vehicle_number VARCHAR(20) NOT NULL,
  slot_id INTEGER REFERENCES parking_slots(id),
  slot_number VARCHAR(10),
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  duration_hours INTEGER DEFAULT 2,
  status VARCHAR(20) DEFAULT 'active', -- active, completed, cancelled
  created_at TIMESTAMP DEFAULT NOW()
);

-- Occupancy history for ML prediction
CREATE TABLE occupancy_history (
  id SERIAL PRIMARY KEY,
  hour_of_day INTEGER NOT NULL,     -- 0-23
  day_of_week INTEGER NOT NULL,     -- 0=Sunday, 6=Saturday
  occupied_count INTEGER NOT NULL,
  total_slots INTEGER NOT NULL,
  occupancy_rate DECIMAL(5,2),      -- percentage
  recorded_at TIMESTAMP DEFAULT NOW()
);

-- Seed parking slots (20 slots, 4 floors)
INSERT INTO parking_slots (slot_number, floor, slot_type) VALUES
('A-01', 'A', 'regular'), ('A-02', 'A', 'regular'), ('A-03', 'A', 'regular'), ('A-04', 'A', 'regular'), ('A-05', 'A', 'ev'),
('B-01', 'B', 'regular'), ('B-02', 'B', 'regular'), ('B-03', 'B', 'regular'), ('B-04', 'B', 'handicap'), ('B-05', 'B', 'regular'),
('C-01', 'C', 'regular'), ('C-02', 'C', 'regular'), ('C-03', 'C', 'regular'), ('C-04', 'C', 'regular'), ('C-05', 'C', 'ev'),
('D-01', 'D', 'regular'), ('D-02', 'D', 'regular'), ('D-03', 'D', 'regular'), ('D-04', 'D', 'handicap'), ('D-05', 'D', 'regular');

-- Seed historical data for ML (7 days x 24 hours)
INSERT INTO occupancy_history (hour_of_day, day_of_week, occupied_count, total_slots, occupancy_rate)
SELECT 
  h.hour,
  d.day,
  CASE 
    WHEN h.hour BETWEEN 8 AND 18 AND d.day BETWEEN 1 AND 5 THEN FLOOR(RANDOM() * 10 + 10)
    WHEN h.hour BETWEEN 6 AND 22 AND d.day IN (0,6) THEN FLOOR(RANDOM() * 8 + 5)
    ELSE FLOOR(RANDOM() * 4)
  END as occupied,
  20 as total,
  0 as rate
FROM 
  generate_series(0, 23) AS h(hour),
  generate_series(0, 6) AS d(day);

UPDATE occupancy_history SET occupancy_rate = ROUND((occupied_count::DECIMAL / total_slots) * 100, 2);
