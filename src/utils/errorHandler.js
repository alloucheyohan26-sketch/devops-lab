/**
 * Centralized Express error handler.
 * Ensures consistent JSON error shape across the API.
 *
 * DEVOPS-19: Global error handling middleware
 * - Catches all errors passed via next(err)
 * - Returns { error: true, message } with appropriate HTTP status
 */
export function errorHandler (err, _req, res, _next) {
  const status = err?.status ?? 500
  const message = err?.message ?? 'Internal Server Error'
  res.status(status).json({ error: true, message })
}
