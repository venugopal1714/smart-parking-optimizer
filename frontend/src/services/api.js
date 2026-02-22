import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
});

export const slotsAPI = {
  getAll: () => API.get('/slots'),
  getAvailable: () => API.get('/slots/available'),
  updateStatus: (id, data) => API.put(`/slots/${id}/status`, data),
};

export const bookingsAPI = {
  getAll: () => API.get('/bookings'),
  create: (data) => API.post('/bookings', data),
  cancel: (id) => API.put(`/bookings/${id}/cancel`),
};

export const predictionAPI = {
  getCurrent: (params) => API.get('/prediction', { params }),
  getToday: (params) => API.get('/prediction/today', { params }),
};

export const adminAPI = {
  getDashboard: () => API.get('/admin/dashboard'),
  getSlotsByFloor: () => API.get('/admin/slots-by-floor'),
  setMaintenance: (id) => API.put(`/admin/slots/${id}/maintenance`),
};

export default API;
