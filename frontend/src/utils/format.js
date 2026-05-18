export function formatFollowers(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(n);
}

export function formatRelative(iso) {
  if (!iso) return 'now';
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return 'now';
  const diffSec = Math.max(1, Math.round((Date.now() - then) / 1000));
  if (diffSec < 60) return `${diffSec}s`;
  if (diffSec < 3600) return `${Math.round(diffSec / 60)}m`;
  if (diffSec < 86400) return `${Math.round(diffSec / 3600)}h`;
  if (diffSec < 86400 * 30) return `${Math.round(diffSec / 86400)}d`;
  if (diffSec < 86400 * 365) return `${Math.round(diffSec / (86400 * 30))}mo`;
  return `${Math.round(diffSec / (86400 * 365))}y`;
}
