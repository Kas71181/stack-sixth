export async function requireAdmin(base44) {
  const isAuthenticated = await base44.auth.isAuthenticated();
  if (!isAuthenticated) {
    return { error: Response.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    return { error: Response.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { user };
}