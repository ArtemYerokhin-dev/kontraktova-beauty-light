import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import BookingPage from './pages/BookingPage.jsx';
import AdminApp from './admin/AdminApp.jsx';
import MasterPage from './pages/MasterPage.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<BookingPage />} />
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="/master" element={<MasterPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
