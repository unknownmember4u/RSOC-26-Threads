export default function MetricBadge({ label, value, type = 'improvement' }) {
  const styles = {
    improvement: 'bg-status-normal/15 text-status-normal border-status-normal/30',
    deterioration: 'bg-status-critical/15 text-status-critical border-status-critical/30',
    neutral: 'bg-dark-surface text-text-secondary border-dark-border',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${styles[type]}`}>
      {type === 'improvement' && '↓'}
      {type === 'deterioration' && '↑'}
      {label && <span className="font-medium opacity-80">{label}:</span>}
      {value}
    </span>
  );
}
