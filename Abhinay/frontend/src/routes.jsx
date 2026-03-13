import { Routes, Route } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import MapPage from './pages/Map';
import Predictions from './pages/Predictions';
import Alerts from './pages/Alerts';
import Clusters from './pages/Clusters';
import Simulator from './pages/Simulator';
import Chat from './pages/Chat';
import LiveFeed from './pages/LiveFeed';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/predictions" element={<Predictions />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/clusters" element={<Clusters />} />
        <Route path="/simulator" element={<Simulator />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/livefeed" element={<LiveFeed />} />
      </Route>
    </Routes>
  );
}
