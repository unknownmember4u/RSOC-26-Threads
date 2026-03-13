import LiveFeedGrid from '../components/ui/LiveFeed';

export default function LiveFeed() {
  return (
    <div style={{ padding: '20px 0' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>Live Municipal Stream</h2>
        <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Real-time IoT telemetry from Pune's 10 smart districts.</p>
      </div>
      <LiveFeedGrid />
    </div>
  );
}
