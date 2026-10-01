/**
 * Utility designed to create branch coverage.
 * Maps uptime (seconds) to a human-readable label.
 *
 * DEVOPS-20: Implement formatStatus() utility
 * - Returns 'warming-up' when uptime < 60s
 * - Returns 'healthy' when uptime is between 60s and 3600s
 * - Returns 'steady' when uptime >= 3600s (1 hour)
 * - Throws Error for negative uptime values
 */
export function formatStatus (uptimeSec) {
  if (uptimeSec < 0) throw new Error('invalid uptime')
  if (uptimeSec < 60) return 'warming-up'
  if (uptimeSec < 3600) return 'healthy'
  return 'steady'
}
