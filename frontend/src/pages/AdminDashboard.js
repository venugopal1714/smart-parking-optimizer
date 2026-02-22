import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Table, Tag, Statistic, Button,
  Typography, Select, message, Tabs, Badge
} from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { adminAPI, slotsAPI } from '../services/api';

const { Title } = Typography;

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [floors, setFloors] = useState([]);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 20000);
    return () => clearInterval(interval);
  }, []);

  const fetchAll = async () => {
    try {
      const [dashRes, floorRes] = await Promise.all([
        adminAPI.getDashboard(),
        adminAPI.getSlotsByFloor(),
      ]);
      setDashboard(dashRes.data);
      setFloors(floorRes.data.data);
    } catch {
      // demo data
      setDashboard(demoDashboard());
    }
  };

  const demoDashboard = () => ({
    slots: { total: '20', available: '10', occupied: '6', reserved: '3', maintenance: '1' },
    bookings: { total_bookings: '45', active: '3', today: '8' },
    hourly_averages: Array.from({ length: 24 }, (_, h) => ({
      hour_of_day: h,
      avg_rate: h >= 8 && h <= 18 ? Math.round(50 + Math.random() * 40) : Math.round(Math.random() * 30)
    }))
  });

  const handleSetMaintenance = async (id) => {
    try {
      await adminAPI.setMaintenance(id);
      message.success('Slot set to maintenance');
      fetchAll();
    } catch {
      message.error('Failed');
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await slotsAPI.updateStatus(id, { status });
      message.success(`Slot status updated to ${status}`);
      fetchAll();
    } catch {
      message.error('Update failed');
    }
  };

  const slotCols = [
    { title: 'Slot', dataIndex: 'slot_number', key: 'slot_number' },
    { title: 'Type', dataIndex: 'slot_type', key: 'slot_type', render: t => <Tag>{t}</Tag> },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: s => {
        const colors = { available: 'green', occupied: 'red', reserved: 'orange', maintenance: 'default' };
        return <Tag color={colors[s]}>{s.toUpperCase()}</Tag>;
      }
    },
    { title: 'Vehicle', dataIndex: 'vehicle_number', key: 'vehicle_number', render: v => v || '—' },
    {
      title: 'Override', key: 'action',
      render: (_, r) => (
        <Select
          size="small"
          defaultValue={r.status}
          onChange={(v) => handleStatusUpdate(r.id, v)}
          style={{ width: 130 }}
        >
          <Select.Option value="available">Available</Select.Option>
          <Select.Option value="occupied">Occupied</Select.Option>
          <Select.Option value="reserved">Reserved</Select.Option>
          <Select.Option value="maintenance">Maintenance</Select.Option>
        </Select>
      )
    }
  ];

  const stats = dashboard?.slots || {};
  const occupancyPercent = stats.total ? Math.round((parseInt(stats.occupied) / parseInt(stats.total)) * 100) : 0;

  const chartData = dashboard?.hourly_averages?.map(h => ({
    hour: `${h.hour_of_day}h`,
    rate: parseFloat(h.avg_rate)
  })) || [];

  return (
    <div>
      <Title level={3}>📊 Admin Dashboard</Title>

      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {[
          { title: 'Total Slots', value: stats.total, color: undefined },
          { title: 'Available', value: stats.available, color: '#3f8600' },
          { title: 'Occupied', value: stats.occupied, color: '#cf1322' },
          { title: 'Reserved', value: stats.reserved, color: '#d46b08' },
          { title: 'Occupancy %', value: `${occupancyPercent}%`, color: occupancyPercent > 70 ? '#cf1322' : '#3f8600' },
          { title: 'Bookings Today', value: dashboard?.bookings?.today, color: '#1677ff' },
        ].map((s, i) => (
          <Col xs={12} md={4} key={i}>
            <Card>
              <Statistic title={s.title} value={s.value || 0} valueStyle={s.color ? { color: s.color } : undefined} />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Chart */}
      <Card title="Average Occupancy by Hour of Day" style={{ marginBottom: 24 }}>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} />
            <Tooltip formatter={v => [`${v}%`, 'Avg Occupancy']} />
            <Bar dataKey="rate" fill="#1677ff" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Slot Management by Floor */}
      <Card title="Slot Management by Floor">
        <Tabs
          items={floors.map(f => ({
            key: f.floor,
            label: `Floor ${f.floor} (${f.slots?.filter(s => s.status === 'available').length || 0} free)`,
            children: (
              <Table
                dataSource={f.slots || []}
                columns={slotCols}
                rowKey="id"
                size="small"
                pagination={false}
              />
            )
          }))}
        />
      </Card>
    </div>
  );
}
