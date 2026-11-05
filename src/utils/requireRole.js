/**
 * Role-based access middleware (Jira SMAR-19 - US1.4 Role-based access).
 * The caller's role is sent in the "X-User-Role" header
 * (one of the roles of /api/users: Student, Teacher, Management).
 *
 *   router.post('/', requireRole('Management'), handler)
 *
 * - no role sent          → 401 Unauthorized
 * - role not in the list  → 403 Forbidden
 * Roles are compared case-insensitively.
 */
export function requireRole (...allowedRoles) {
  const allowed = allowedRoles.map((role) => role.toLowerCase())

  return (req, res, next) => {
    const role = (req.get('X-User-Role') || '').trim()
    if (!role) {
      return res.status(401).json({ error: 'Missing X-User-Role header' })
    }
    if (!allowed.includes(role.toLowerCase())) {
      return res.status(403).json({ error: `Forbidden: requires role ${allowedRoles.join(' or ')}` })
    }
    next()
  }
}
