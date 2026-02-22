import React, { useState, useEffect } from 'react';
import {
  Card, Form, Input, Select, Button, Table, Tag, message,
  Row, Col, Statistic, Modal, Typography, Tooltip
} from 'antd';
import { CarOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { slotsAPI, bookingsAPI } from '../services/api';

const { Title, Text } = Typography;

const STATUS_CONFIG = {
  available:   { bg: '#f6ffed', border: '#52c41a', textColor: '#52c41a', label: 'Free' },
  occupied:    { bg: '#fff2f0', border: '#ff4d4f', textColor: '#ff4d4f', label: 'Occupied' },
  reserved:    { bg: '#fff7e6', border: '#fa8c16', textColor: '#fa8c16', label: 'Reserved' },
  maintenance: { bg: '#f5f5f5', border: '#8c8c8c', textColor: '#8c8c8c', label: 'Maintenance' },
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

export default function UserBooking() {
  const [slots, setSlots] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [slotsRes, availRes, bookRes] = await Promise.all([
        slotsAPI.getAll(),
        slotsAPI.getAvailable(),
        bookingsAPI.getAll(),
      ]);
      const allBookings = bookRes.data.data;
      // Enrich slots with booking time info
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
      setAvailableSlots(availRes.data.data);
      setBookings(allBookings.slice(0, 20));
    } catch {
      // demo fallback
    }
  };

  const handleBook = async (values) => {
    setLoading(true);
    try {
      const res = await bookingsAPI.create(values);
      message.success(res.data.message);
      setConfirmModal(res.data.data);
      form.resetFields();
      fetchData();
    } catch (err) {
      message.error(err.response?.data?.error || 'Booking failed');
    }
    setLoading(false);
  };

  const handleCancel = async (id) => {
    try {
      await bookingsAPI.cancel(id);
      message.success('Booking cancelled');
      fetchData();
    } catch {
      message.error('Cancel failed');
    }
  };

  const totalSlots = slots.length;
  const occupiedCount = slots.filter(s => s.status === 'occupied').length;
  const availableCount = slots.filter(s => s.status === 'available').length;
  const reservedCount = slots.filter(s => s.status === 'reserved').length;

  const bookingCols = [
    { title: 'Booking ID', dataIndex: 'id', key: 'id', render: v => v?.slice(0, 8) + '...' },
    { title: 'Name', dataIndex: 'user_name', key: 'user_name' },
    { title: 'Vehicle', dataIndex: 'vehicle_number', key: 'vehicle_number' },
    { title: 'Slot', dataIndex: 'slot_number', key: 'slot_number' },
    { title: 'Start', dataIndex: 'start_time', key: 'start_time', render: v => formatTime(v) },
    { title: 'End', dataIndex: 'end_time', key: 'end_time', render: v => formatTime(v) },
    { title: 'Duration', dataIndex: 'duration_hours', key: 'duration_hours', render: v => v + 'h' },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: s => <Tag color={s === 'active' ? 'green' : 'default'}>{s}</Tag>
    },
    {
      title: 'Action', key: 'action',
      render: (_, r) => r.status === 'active'
        ? <Button size="small" danger onClick={() => handleCancel(r.id)}>Cancel</Button>
        : null
    }
  ];

  return (
    <div>
      <Title level={3}>🚗 Book a Parking Slot</Title>

      {/* Stats Row */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card><Statistic title="Total Slots" value={totalSlots} prefix={<CarOutlined />} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="Available" value={availableCount} valueStyle={{ color: '#52c41a' }} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="Occupied" value={occupiedCount} valueStyle={{ color: '#ff4d4f' }} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="Reserved" value={reservedCount} valueStyle={{ color: '#fa8c16' }} /></Card>
        </Col>
      </Row>

      <Row gutter={24}>
        {/* Booking Form */}
        <Col xs={24} md={10}>
          <Card title="New Booking" bordered={false}>
            <Form form={form} layout="vertical" onFinish={handleBook}>
              <Form.Item name="user_name" label="Your Name" rules={[{ required: true }]}>
                <Input placeholder="John Doe" />
              </Form.Item>
              <Form.Item name="user_phone" label="Phone Number" rules={[{ required: true }]}>
                <Input placeholder="+91 9999999999" />
              </Form.Item>
              <Form.Item name="vehicle_number" label="Vehicle Number" rules={[{ required: true }]}>
                <Input placeholder="MH01AB1234" style={{ textTransform: 'uppercase' }} />
              </Form.Item>
              <Form.Item name="slot_id" label="Select Slot" rules={[{ required: true }]}>
                <Select placeholder="Choose a slot">
                  {availableSlots.map(slot => (
                    <Select.Option key={slot.id} value={slot.id}>
                      {slot.slot_number} — Floor {slot.floor} ({slot.slot_type})
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="duration_hours" label="Duration" initialValue={2}>
                <Select>
                  <Select.Option value={1}>1 Hour</Select.Option>
                  <Select.Option value={2}>2 Hours</Select.Option>
                  <Select.Option value={3}>3 Hours</Select.Option>
                  <Select.Option value={4}>4 Hours</Select.Option>
                  <Select.Option value={8}>Full Day (8h)</Select.Option>
                </Select>
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block size="large">
                Book Now
              </Button>
            </Form>
          </Card>
        </Col>

        {/* Slot Grid with Time Info */}
        <Col xs={24} md={14}>
          <Card title="Live Slot Status — Click any slot for details" bordered={false}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {slots.map(slot => (
                <SlotMiniCard key={slot.id} slot={slot} />
              ))}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
              {Object.entries(STATUS_CONFIG).map(([s, c]) => (
                <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 12, height: 12, background: c.bg, border: `2px solid ${c.border}`, borderRadius: 2 }} />
                  <Text style={{ fontSize: 12 }}>{s}</Text>
                </span>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Bookings Table */}
      <Card title="📋 Recent Bookings" style={{ marginTop: 24 }} bordered={false}>
        <Table
          dataSource={bookings}
          columns={bookingCols}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 5 }}
        />
      </Card>

      {/* Success Modal */}
      <Modal
        open={!!confirmModal}
        onOk={() => setConfirmModal(null)}
        onCancel={() => setConfirmModal(null)}
        title={<><CheckCircleOutlined style={{ color: '#52c41a' }} /> Booking Confirmed</>}
      >
        {confirmModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <InfoRow label="🅿️ Slot" value={confirmModal.slot_number} highlight />
            <InfoRow label="🚗 Vehicle" value={confirmModal.vehicle_number} />
            <InfoRow label="🕐 Start Time" value={formatTime(confirmModal.start_time)} />
            <InfoRow label="🕐 End Time" value={formatTime(confirmModal.end_time)} highlight />
            <InfoRow label="⏱️ Duration" value={confirmModal.duration_hours + ' Hours'} />
            <InfoRow label="🎫 Booking ID" value={confirmModal.id?.slice(0, 8) + '...'} />
            <div style={{ background: '#f6ffed', border: '1px solid #52c41a', borderRadius: 8, padding: 10, textAlign: 'center', marginTop: 8 }}>
              <Text style={{ color: '#52c41a' }}>Please arrive by <strong>{formatTime(confirmModal.start_time)}</strong> and leave by <strong>{formatTime(confirmModal.end_time)}</strong></Text>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function SlotMiniCard({ slot }) {
  const cfg = STATUS_CONFIG[slot.status] || STATUS_CONFIG.available;
  const timeRemaining = getTimeRemaining(slot.booking_end);
  const occupiedDuration = getOccupiedDuration(slot.updated_at);

  const tooltipContent = (
    <div style={{ fontSize: 12 }}>
      <div><strong>{slot.slot_number}</strong> — {slot.slot_type}</div>
      {slot.vehicle_number && <div>🚗 {slot.vehicle_number}</div>}
      {slot.booked_by && <div>👤 {slot.booked_by}</div>}
      {slot.status === 'reserved' && slot.booking_end && (
        <>
          <div>📅 From: {formatTime(slot.booking_start)}</div>
          <div>🕐 Free at: {formatTime(slot.booking_end)}</div>
          <div>⏳ {timeRemaining}</div>
        </>
      )}
      {slot.status === 'occupied' && slot.updated_at && (
        <div>🕐 Entered: {occupiedDuration}</div>
      )}
      {slot.status === 'available' && <div>✅ Ready to book!</div>}
    </div>
  );

  return (
    <Tooltip title={tooltipContent} placement="top">
      <div style={{
        width: 95, minHeight: 100, borderRadius: 8, padding: '6px 4px',
        background: cfg.bg, border: `2px solid ${cfg.border}`,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'space-between', cursor: 'default',
        transition: 'transform 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.07)'
      }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <Text strong style={{ fontSize: 11 }}>{slot.slot_number}</Text>
        <Text style={{ fontSize: 22 }}>{TYPE_ICON[slot.slot_type] || '🚗'}</Text>
        <Text style={{ fontSize: 10, fontWeight: 'bold', color: cfg.textColor }}>{cfg.label}</Text>

        {/* Reserved: show free time */}
        {slot.status === 'reserved' && slot.booking_end && (
          <div style={{ textAlign: 'center' }}>
            <Text style={{ fontSize: 9, color: '#fa8c16', display: 'block' }}>
              🕐 {formatTime(slot.booking_end)}
            </Text>
            <Text style={{ fontSize: 9, color: '#fa8c16' }}>⏳ {timeRemaining}</Text>
          </div>
        )}

        {/* Occupied: show entry time */}
        {slot.status === 'occupied' && slot.updated_at && (
          <Text style={{ fontSize: 9, color: '#ff4d4f' }}>
            Since {formatTime(slot.updated_at)}
          </Text>
        )}

        {/* Vehicle number */}
        {slot.vehicle_number && (
          <Text style={{ fontSize: 8, color: '#999' }}>{slot.vehicle_number}</Text>
        )}
      </div>
    </Tooltip>
  );
}

function InfoRow({ label, value, highlight }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      padding: '8px 12px',
      background: highlight ? '#fffbe6' : '#fafafa',
      borderRadius: 8, border: '1px solid #f0f0f0'
    }}>
      <Text style={{ color: '#888' }}>{label}</Text>
      <Text strong style={{ color: highlight ? '#d46b08' : '#333' }}>{value}</Text>
    </div>
  );
}