import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Creates a Linear issue from a recommendation.
// payload: { title, description, teamId, priority }
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { title, description, teamId, priority = 2 } = await req.json();
    if (!title) return Response.json({ error: 'title required' }, { status: 400 });

    const stored = await base44.entities.ApiCredential.filter({ service: 'linear', created_by_id: user.id });
    if (!stored[0]?.api_key) {
      return Response.json({ success: false, not_configured: true, error: 'Linear API key not configured' });
    }

    const apiKey = stored[0].api_key;
    const resolvedTeamId = teamId || stored[0].extra_fields?.default_team_id;

    // If no teamId, fetch first available team
    let finalTeamId = resolvedTeamId;
    if (!finalTeamId) {
      const teamsRes = await fetch('https://api.linear.app/graphql', {
        method: 'POST',
        headers: { 'Authorization': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '{ teams { nodes { id name } } }' }),
      });
      const teamsData = await teamsRes.json();
      finalTeamId = teamsData?.data?.teams?.nodes?.[0]?.id;
    }

    if (!finalTeamId) return Response.json({ success: false, error: 'No Linear team found. Provide a team ID.' });

    const mutation = `
      mutation IssueCreate($input: IssueCreateInput!) {
        issueCreate(input: $input) {
          success
          issue { id identifier title url }
        }
      }
    `;

    const res = await fetch('https://api.linear.app/graphql', {
      method: 'POST',
      headers: { 'Authorization': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: mutation,
        variables: { input: { teamId: finalTeamId, title, description, priority } },
      }),
    });

    const data = await res.json();
    if (data.errors) return Response.json({ success: false, error: data.errors[0]?.message });
    const issue = data.data?.issueCreate?.issue;
    return Response.json({ success: true, issue });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});