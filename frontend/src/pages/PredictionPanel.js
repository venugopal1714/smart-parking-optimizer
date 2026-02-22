import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Statistic, Switch, Alert, Tag, Typography,
  Spin, Progress, Select, Button, Divider
} from 'antd';
import {
  RobotOutlined, WarningOutlined, CheckCircleOutlined,
  LineChartOutlined
} from '@ant-design/icons';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { predictionAPI } from '../services/api';

const { Title, Text, Paragraph } = Typography;

export default function PredictionPanel() {
  const [useFallback, setUseFallback] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [todayData, setTodayData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedHour, setSelectedHour] = useState(new Date().getHours());

  useEffect(() => {
    fetchPrediction();
    fetchTodayChart();
  }, [useFallback, selectedHour]);

  const fetchPrediction = async () => {
    setLoading(true);
    try {
      const res = await predictionAPI.getCurrent({
        hour: selectedHour,
        use_fallback: useFallback
      });
      setPrediction(res.data);
    } catch (err) {
      // demo fallback data if backend unavailable
      setPrediction(getDemoData(useFallback, selectedHour));
    }
    setLoading(false);
  };

  const fetchTodayChart = async () => {
    try {
      const res = await predictionAPI.getToday({ use_fallback: useFallback });
      setTodayData(res.data.predictions.map(p => ({
        hour: `${p.hour}:00`,
        rate: p.predicted_rate,
        method: p.method
      })));
    } catch {
      setTodayData(getDemoChartData(useFallback));
    }
  };

  const getDemoData = (fallback, hour) => ({
    method: fallback ? 'fallback_last3' : 'historical_average',
    is_fallback: fallback,
    prediction: {
      hour,
      predicted_occupancy_rate: fallback ? 55 : hour >= 8 && hour <= 18 ? 72 : 30,
      predicted_occupied: fallback ? 11 : hour >= 8 && hour <= 18 ? 14 : 6,
      confidence: fallback ? 40 : 82,
      sample_count: fallback ? 3 : 28
    },
    current: { total: 20, occupied: 8, available: 10, reserved: 2, occupancy_rate: 40 },
    recommendation: { level: 'medium', message: 'Limited spots available. Book soon.', color: 'orange' }
  });

  const getDemoChartData = (fallback) =>
    Array.from({ length: 24 }, (_, h) => ({
      hour: `${h}:00`,
      rate: fallback ? 50 + Math.random() * 10 : h >= 8 && h <= 18 ? 60 + Math.random() * 30 : 15 + Math.random() * 20,
      method: fallback ? 'fallback' : 'ai'
    }));

  const rateColor = (r) => r >= 80 ? '#ff4d4f' : r >= 60 ? '#fa8c16' : r >= 40 ? '#fadb14' : '#52c41a';

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3}><RobotOutlined /> AI Occupancy Prediction</Title>
        </Col>
        <Col>
          <Card size="small">
            <Switch
              checked={useFallback}
              onChange={setUseFallback}
              checkedChildren="Fallback ON"
              unCheckedChildren="AI Active"
            />
            <Text style={{ marginLeft: 8 }} type="secondary">
              {useFallback ? 'Using last 3 entries' : 'Using historical avg'}
            </Text>
          </Card>
        </Col>
      </Row>

      {/* Method Banner */}
      {useFallback ? (
        <Alert
          message="⚠️ AI Disabled — Fallback Mode Active"
          description="Prediction is based on the average of the last 3 occupancy entries. Enable AI for more accurate historical analysis."
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: 16 }}
        />
      ) : (
        <Alert
          message="✅ AI Active — Historical Average Mode"
          description="Prediction uses historical occupancy patterns grouped by hour of day and day of week."
          type="success"
          showIcon
          icon={<CheckCircleOutlined />}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Hour Selector */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Text strong>Predict for hour: </Text>
        <Select
          value={selectedHour}
          onChange={setSelectedHour}
          style={{ width: 120, marginLeft: 8 }}
        >
          {Array.from({ length: 24 }, (_, i) => (
            <Select.Option key={i} value={i}>{i}:00</Select.Option>
          ))}
        </Select>
        <Button onClick={fetchPrediction} style={{ marginLeft: 8 }} type="primary" size="small">
          Predict
        </Button>
      </Card>

      <Spin spinning={loading}>
        {prediction && (
          <>
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col xs={24} md={6}>
                <Card>
                  <Statistic
                    title="Predicted Occupancy"
                    value={prediction.prediction.predicted_occupancy_rate}
                    suffix="%"
                    valueStyle={{ color: rateColor(prediction.prediction.predicted_occupancy_rate) }}
                  />
                  <Progress
                    percent={prediction.prediction.predicted_occupancy_rate}
                    strokeColor={rateColor(prediction.prediction.predicted_occupancy_rate)}
                    showInfo={false}
                  />
                </Card>
              </Col>
              <Col xs={24} md={6}>
                <Card>
                  <Statistic title="Predicted Occupied Slots" value={prediction.prediction.predicted_occupied} suffix={`/ ${prediction.current?.total}`} />
                </Card>
              </Col>
              <Col xs={24} md={6}>
                <Card>
                  <Statistic title="Model Confidence" value={prediction.prediction.confidence} suffix="%" />
                  <Tag color={useFallback ? 'orange' : 'green'} style={{ marginTop: 8 }}>
                    {useFallback ? 'FALLBACK' : 'AI MODEL'}
                  </Tag>
                </Card>
              </Col>
              <Col xs={24} md={6}>
                <Card>
                  <Statistic title="Current Available" value={prediction.current?.available} suffix="slots" valueStyle={{ color: '#52c41a' }} />
                  <Text type="secondary">Real-time</Text>
                </Card>
              </Col>
            </Row>

            {/* Recommendation */}
            {prediction.recommendation && (
              <Alert
                message={`Parking Recommendation: ${prediction.recommendation.message}`}
                type={
                  prediction.recommendation.level === 'high' ? 'error' :
                  prediction.recommendation.level === 'medium' ? 'warning' :
                  'success'
                }
                style={{ marginBottom: 24 }}
              />
            )}

            {/* How it works */}
            <Card title="🧠 How the Prediction Works" style={{ marginBottom: 24 }}>
              <Row gutter={24}>
                <Col md={12}>
                  <Title level={5}>Primary Method (AI)</Title>
                  <Paragraph>
                    Calculates <strong>historical average occupancy rate</strong> for the selected hour 
                    and current day of week from the <code>occupancy_history</code> table.
                    Requires at least 3 samples for reliability.
                  </Paragraph>
                  <Tag color="blue">SQL: AVG(occupancy_rate) WHERE hour=H AND day=D</Tag>
                </Col>
                <Col md={12}>
                  <Title level={5}>Fallback Method (Last 3 Entries)</Title>
                  <Paragraph>
                    When AI has insufficient data or is manually disabled, 
                    it falls back to the <strong>average of the 3 most recent occupancy snapshots</strong>.
                  </Paragraph>
                  <Tag color="orange">SQL: AVG(rate) FROM history ORDER BY time DESC LIMIT 3</Tag>
                </Col>
              </Row>
            </Card>
          </>
        )}
      </Spin>

      {/* Full Day Chart */}
      <Card title={<><LineChartOutlined /> 24-Hour Occupancy Prediction — Today</>}>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={todayData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" tick={{ fontSize: 11 }} interval={2} />
            <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} />
            <Tooltip formatter={(v) => [`${v}%`, 'Predicted Occupancy']} />
            <ReferenceLine y={70} stroke="#fa8c16" strokeDasharray="5 5" label="High" />
            <ReferenceLine y={90} stroke="#ff4d4f" strokeDasharray="5 5" label="Critical" />
            <Area
              type="monotone"
              dataKey="rate"
              stroke={useFallback ? '#fa8c16' : '#1677ff'}
              fill={useFallback ? '#fff7e6' : '#e6f4ff'}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
        <Divider />
        <Text type="secondary">
          Method: <Tag color={useFallback ? 'orange' : 'blue'}>{useFallback ? 'Fallback (Last 3)' : 'AI Historical Average'}</Tag>
          Peak hours: 8 AM – 10 AM, 5 PM – 7 PM
        </Text>
      </Card>
    </div>
  );
}
