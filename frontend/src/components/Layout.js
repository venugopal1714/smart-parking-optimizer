import React from 'react';
import { Layout, Menu, Typography } from 'antd';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  CarOutlined,
  DashboardOutlined,
  RobotOutlined,
  AppstoreOutlined
} from '@ant-design/icons';

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

const menuItems = [
  { key: '/', icon: <CarOutlined />, label: <Link to="/">Book Parking</Link> },
  { key: '/map', icon: <AppstoreOutlined />, label: <Link to="/map">Slot Map</Link> },
  { key: '/prediction', icon: <RobotOutlined />, label: <Link to="/prediction">AI Prediction</Link> },
  { key: '/admin', icon: <DashboardOutlined />, label: <Link to="/admin">Admin</Link> },
];

export default function MainLayout() {
  const location = useLocation();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <Title level={4} style={{ color: '#fff', margin: 0, whiteSpace: 'nowrap' }}>
          🚗 SmartPark
        </Title>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ flex: 1, minWidth: 0 }}
        />
      </Header>
      <Content style={{ padding: '24px', background: '#f5f5f5' }}>
        <Outlet />
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        Smart Parking Slot Optimizer ©2026
      </Footer>
    </Layout>
  );
}
