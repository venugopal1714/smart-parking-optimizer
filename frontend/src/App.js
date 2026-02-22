import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import MainLayout from './components/Layout';
import UserBooking from './pages/UserBooking';
import AdminDashboard from './pages/AdminDashboard';
import PredictionPanel from './pages/PredictionPanel';
import SlotMap from './pages/SlotMap';

const theme = {
  token: {
    colorPrimary: '#1677ff',
    borderRadius: 8,
  },
};

function App() {
  return (
    <ConfigProvider theme={theme}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<UserBooking />} />
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="prediction" element={<PredictionPanel />} />
            <Route path="map" element={<SlotMap />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
