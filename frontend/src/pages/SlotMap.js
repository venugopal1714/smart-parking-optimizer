import React, { useState, useEffect } from 'react';
import { Card, Tag, Typography, Row, Col, Tooltip, Modal } from 'antd';
import { ClockCircleOutlined, CarOutlined, CalendarOutlined } from '@ant-design/icons';
import { slotsAPI, bookingsAPI } from '../services/api';

const { Title, Text } = Typography;

const now = new Date();
const makeTime = (addMinutes) => new Date(now.getTime() + addMinutes * 60000);

const DEMO_SLOTS = [
  { id: 1, slot_number: 'A-01', floor: 'A', status: 'available', slot_type: 'regular' },
  { id: 2, slot_number: 'A-02', floor: 'A', status: 'occupied', slot_type: 'regular', vehicle_number: 'MH01AB1234', updated_at: makeTime(-45) },
  { id: 3, slot_number: 'A-03', floor: 'A', status: 'available', slot_type: 'regular' },
  { id: 4, slot_number: 'A-04', floor: 'A', status: 'reserved', slot_type: 'regular', vehicle_number: 'TS09CD5678', booking_start: makeTime(-30), booking_end: makeTime(90) },
  { id: 5, slot_number: 'A-05', floor: 'A', status: 'available', slot_type: 'ev' },
  { id: 6, slot_number: 'B-01', floor: 'B', status: 'occupied', slot_type: 'regular', vehicle_number: 'KA03EF9012', updated_at: makeTime(-120) },
  { id: 7, slot_number: 'B-02', floor: 'B', status: 'available', slot_type: 'regular' },
  { id: 8, slot_number: 'B-03', floor: 'B', status: 'available', slot_type: 'regular' },
  { id: 9, slot_number: 'B-04', floor: 'B', status: 'occupied', slot_type: 'handicap', vehicle_number: 'DL04GH3456', updated_at: makeTime(-60) },
  { id: 10, slot_number: 'B-05', floor: 'B', status: 'reserved', slot_type: 'regular', vehicle_number: 'MH02IJ7890', booking_start: makeTime(-10), booking_end: makeTime(110) },
  { id: 11, slot_number: 'C-01', floor: 'C', status: 'available', slot_type: 'regular' },
  { id: 12, slot_number: 'C-02', floor: 'C', status: 'available', slot_type: 'regular' },
  { id: 13, slot_number: 'C-03', floor: 'C', status: 'occupied', slot_type: 'regular', vehicle_number: 'GJ05KL2345', updated_at: makeTime(-30) },
  { id: 14, slot_number: 'C-04', floor: 'C', status: 'available', slot_type: 'regular' },
  { id: 15, slot_number: 'C-05', floor: 'C', status: 'maintenance', slot_type: 'ev' },
  { id: 16, slot_number: 'D-01', floor: 'D', status: 'occupied', slot_type: 'regular', vehicle_number: 'RJ14MN6789', updated_at: makeTime(-90) },
  { id: 17, slot_number: 'D-02', floor: 'D', status: 'available', slot_type: 'regular' },
  { id: 18, slot_number: 'D-03', floor: 'D', status: 'available', slot_type: 'regular' },
  { id: 19, slot_number: 'D-04', floor: 'D', status: 'reserved', slot_type: 'handicap', vehicle_number: 'UP32OP1234', booking_start: makeTime(-5), booking_end: makeTime(115) },
  { id: 20, slot_number: 'D-05', floor: 'D', status: 'available', slot_type: 'regular' },
];

const STATUS_CONFIG = {
  available:   { bg: '#f6ffed', border: '#52c41a', label: 'Free',        icon: '🟢', textColor: '#52c41a' },
  occupied:    { bg: '#fff2f0', border: '#ff4d4f', label: 'Occupied',    icon: '🔴', textColor: '#ff4d4f' },
  reserved:    { bg: '#fff7e6', border: '#fa8c16', label: 'Reserved',    icon: '🟠', textColor: '#fa8c16' },
  maintenance: { bg: '#f5f5f5', border: '#8c8c8c', label: 'Maintenance', icon: '⚫', textColor: '#8c8c8c' },
};

const TYPE_ICON = { regular: '🚗', handicap: '♿', ev: '⚡' };

function formatTime(date) {
  if (!date) return '--';
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getTimeRemaining(endTime) {
  if (!endTime) return null;
  const diff = new Date(endTime) - new Date();
  if (diff <= 0) return 'Overdue';
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins + 'm left';
  return Math.floor(mins / 60) + 'h ' + (mins % 60) + 'm left';
}

function getOccupiedDuration(updatedAt) {
  if (!updatedAt) return null;
  const mins = Math.floor((new Date() - new Date(updatedAt)) / 60000);
  if (mins < 60) return mins + 'm ago';
  return Math.floor(mins / 60) + 'h ' + (mins % 60) + 'm ago';
}

export default function SlotMap() {
  const [slots, setSlots] = useState(DEMO_SLOTS);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
      forceUpdate(n => n + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [slotsRes, bookingsRes] = await Promise.all([
        slotsAPI.getAll(),
        bookingsAPI.getAll(),
      ]);
      const allBookings = bookingsRes.data.data;
      const enriched = slotsRes.data.data.map(slot => {
        const booking = allBookings.find(b => b.slot_id === slot.id && b.status === 'active');
        return {
          ...slot,
          booking_start: booking?.start_time,
          booking_end: booking?.end_time,
          booked_by: booking?.user_name,
        };
      });
      setSlots(enriched);
    } catch {
      setSlots(DEMO_SLOTS);
    }
  };

  const floors = [...new Set(slots.map(s => s.floor))].sort();
  const countByStatus = (s) => slots.filter(sl => sl.status === s).length;

  return (
    <div>
      <Title level={3}>🅿️ Parking Map — Live View</Title>

      {/* Status Summary Bar */}
      <Row gutter={12} style={{ marginBottom: 20 }}>
        {Object.entries(STATUS_CONFIG).map(([s, c]) => (
          <Col key={s}>
            <div style={{
              background: c.bg, border: `2px solid ${c.border}`,
              borderRadius: 8, padding: '6px 14px',
              display: 'flex', alignItems: 'center', gap: 6
            }}>
              <span>{c.icon}</span>
              <Text strong style={{ color: c.textColor }}>{s}</Text>
              <Text style={{ color: c.textColor }}>({countByStatus(s)})</Text>
            </div>
          </Col>
        ))}
      </Row>

      {/* Floor Cards */}
      {floors.map(floor => {
        const floorSlots = slots.filter(s => s.floor === floor);
        const freeCount = floorSlots.filter(s => s.status === 'available').length;
        return (
          <Card
            key={floor}
            title={
              <span>
                Floor {floor} &nbsp;
                <span style={{ color: freeCount > 0 ? '#52c41a' : '#ff4d4f', fontWeight: 'bold' }}>
                  {freeCount} free
                </span>
              </span>
            }
            extra={<Tag color={freeCount > 0 ? 'success' : 'error'}>{freeCount > 0 ? '✅ HAS SPACE' : '❌ FULL'}</Tag>}
            style={{ marginBottom: 16, borderRadius: 12 }}
          >
            <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                {floorSlots.slice(0, Math.ceil(floorSlots.length / 2)).map(slot => (
                  <SlotCard key={slot.id} slot={slot} onClick={() => setSelectedSlot(slot)} />
                ))}
              </div>
              <div style={{
                width: 36, background: '#e8e8e8', borderRadius: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, color: '#aaa', writingMode: 'vertical-rl'
              }}>▶ DRIVE</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                {floorSlots.slice(Math.ceil(floorSlots.length / 2)).map(slot => (
                  <SlotCard key={slot.id} slot={slot} onClick={() => setSelectedSlot(slot)} />
                ))}
              </div>
            </div>
          </Card>
        );
      })}

      {/* Slot Detail Modal */}
      <Modal
        open={!!selectedSlot}
        onCancel={() => setSelectedSlot(null)}
        footer={null}
        title={<span>{TYPE_ICON[selectedSlot?.slot_type]} Slot {selectedSlot?.slot_number} Details</span>}
      >
        {selectedSlot && <SlotDetail slot={selectedSlot} />}
      </Modal>
    </div>
  );
}

function SlotCard({ slot, onClick }) {
  const cfg = STATUS_CONFIG[slot.status] || STATUS_CONFIG.available;
  const timeRemaining = getTimeRemaining(slot.booking_end);
  const occupiedDuration = getOccupiedDuration(slot.updated_at);

  const tooltipContent = (
    <div style={{ fontSize: 12 }}>
      <div><strong>{slot.slot_number}</strong> — {slot.slot_type}</div>
      {slot.vehicle_number && <div>🚗 {slot.vehicle_number}</div>}
      {slot.status === 'reserved' && slot.booking_end && (
        <>
          <div>🕐 Free at: {formatTime(slot.booking_end)}</div>
          <div>⏳ {timeRemaining}</div>
        </>
      )}
      {slot.status === 'occupied' && slot.updated_at && (
        <div>🕐 Entered: {occupiedDuration}</div>
      )}
      {slot.status === 'available' && <div>✅ Ready to book!</div>}
      <div style={{ marginTop: 4, color: '#ccc', fontSize: 10 }}>Click for details</div>
    </div>
  );

  return (
    <Tooltip title={tooltipContent} placement="top">
      <div
        onClick={onClick}
        style={{
          width: 100, minHeight: 95, borderRadius: 8, padding: '6px 6px 4px',
          background: cfg.bg, border: `2px solid ${cfg.border}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'space-between', cursor: 'pointer',
          transition: 'all 0.2s', boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <Text strong style={{ fontSize: 11 }}>{slot.slot_number}</Text>
        <Text style={{ fontSize: 22 }}>{TYPE_ICON[slot.slot_type] || '🚗'}</Text>
        <Text style={{ fontSize: 10, fontWeight: 'bold', color: cfg.textColor }}>{cfg.label}</Text>

        {/* Reserved: show free time + countdown */}
        {slot.status === 'reserved' && slot.booking_end && (
          <div style={{ textAlign: 'center' }}>
            <Text style={{ fontSize: 9, color: '#fa8c16', display: 'block' }}>
              🕐 Free: {formatTime(slot.booking_end)}
            </Text>
            <Text style={{ fontSize: 9, color: '#fa8c16' }}>⏳ {timeRemaining}</Text>
          </div>
        )}

        {/* Occupied: show since when */}
        {slot.status === 'occupied' && slot.updated_at && (
          <Text style={{ fontSize: 9, color: '#ff4d4f' }}>
            Since {formatTime(slot.updated_at)}
          </Text>
        )}

        {/* Vehicle number */}
        {slot.vehicle_number && (
          <Text style={{ fontSize: 8, color: '#888' }}>{slot.vehicle_number}</Text>
        )}
      </div>
    </Tooltip>
  );
}

function SlotDetail({ slot }) {
  const cfg = STATUS_CONFIG[slot.status] || STATUS_CONFIG.available;
  const timeRemaining = getTimeRemaining(slot.booking_end);
  const occupiedDuration = getOccupiedDuration(slot.updated_at);

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{
          display: 'inline-block', background: cfg.bg,
          border: `2px solid ${cfg.border}`, borderRadius: 12, padding: '12px 32px'
        }}>
          <Text style={{ fontSize: 36 }}>{TYPE_ICON[slot.slot_type]}</Text><br />
          <Text strong style={{ fontSize: 18, color: cfg.textColor }}>{cfg.icon} {cfg.label.toUpperCase()}</Text>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <InfoRow label="Slot Number" value={slot.slot_number} />
        <InfoRow label="Floor" value={'Floor ' + slot.floor} />
        <InfoRow label="Type" value={slot.slot_type} />

        {slot.vehicle_number && <InfoRow label="🚗 Vehicle" value={slot.vehicle_number} highlight />}
        {slot.booked_by && <InfoRow label="👤 Booked By" value={slot.booked_by} />}

        {slot.status === 'reserved' && (
          <>
            <InfoRow label="📅 Booked From" value={formatTime(slot.booking_start)} />
            <InfoRow
              label="🕐 Free At"
              value={formatTime(slot.booking_end)}
              highlight
              extra={<Tag color="orange">{timeRemaining}</Tag>}
            />
          </>
        )}

        {slot.status === 'occupied' && slot.updated_at && (
          <>
            <InfoRow label="🕐 Entered At" value={formatTime(slot.updated_at)} />
            <InfoRow label="⏱️ Duration" value={occupiedDuration} highlight />
          </>
        )}

        {slot.status === 'available' && (
          <div style={{
            background: '#f6ffed', border: '1px solid #52c41a',
            borderRadius: 8, padding: 12, textAlign: 'center', marginTop: 8
          }}>
            <Text style={{ color: '#52c41a', fontWeight: 'bold' }}>
              ✅ This slot is available for booking!
            </Text>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value, highlight, extra }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '8px 12px',
      background: highlight ? '#fffbe6' : '#fafafa',
      borderRadius: 8, border: '1px solid #f0f0f0'
    }}>
      <Text style={{ color: '#888' }}>{label}</Text>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Text strong style={{ color: highlight ? '#d46b08' : '#333' }}>{value}</Text>
        {extra}
      </div>
    </div>
  );
}