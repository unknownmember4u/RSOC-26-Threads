import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function DashboardLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--app-bg)', transition: 'background 0.25s' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: 68, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Topbar />
        <main style={{ flex: 1, padding: '28px 28px', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
