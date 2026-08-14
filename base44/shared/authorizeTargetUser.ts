export async function authorizeTargetUser(base44, body = {}) {
  let caller = null;
  try {
    caller = await base44.auth.me();
  } catch {
    caller = null;
  }
  if (!caller) return { error: Response.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (!body._targetUserId) return { user: caller };
  if (caller.role !== 'admin') return { error: Response.json({ error: 'Forbidden — admin access required' }, { status: 403 }) };
  try {
    const user = await base44.asServiceRole.entities.User.get(body._targetUserId);
    if (!user) return { error: Response.json({ error: 'Target user not found' }, { status: 404 }) };
    return { user };
  } catch {
    return { error: Response.json({ error: 'Target user not found' }, { status: 404 }) };
  }
}