import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const CONNECTOR_ID = "6a106c5087f4c81a5248929b";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { tools, auditName } = await req.json();

    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);

    // Create a new spreadsheet
    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: { title: `Stack Sixth AI — ${auditName || 'Software Audit'} — ${new Date().toLocaleDateString()}` },
        sheets: [{ properties: { title: 'Recommendations' } }],
      }),
    });

    const spreadsheet = await createRes.json();
    if (!spreadsheet.spreadsheetId) {
      return Response.json({ error: 'Failed to create spreadsheet', details: spreadsheet }, { status: 500 });
    }

    const spreadsheetId = spreadsheet.spreadsheetId;

    // Build rows: header + data
    const header = [
      'Tool Name', 'Category', 'Match Score', 'Monthly Cost ($)', 'Potential Savings/mo ($)',
      'Priority', 'Migration Risk', 'Decision', 'Audit', 'Why It Fits', 'ROI Note'
    ];
    const rows = tools.map((t) => [
      t.name || '',
      t.category || '',
      t.match_score ?? '',
      t.estimated_monthly_cost ?? '',
      t.estimated_savings_opportunity ?? '',
      t.implementation_priority || '',
      t.migration_risk || '',
      t._decision || 'Pending',
      t._auditName || '',
      (t.why_it_fits || []).join('; '),
      t.savings_or_roi_note || '',
    ]);

    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Recommendations!A1:K${rows.length + 1}?valueInputOption=RAW`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [header, ...rows] }),
    });

    // Bold the header row
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [{
          repeatCell: {
            range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1 },
            cell: { userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.22, green: 0.40, blue: 0.75 }, foregroundColor: { red: 1, green: 1, blue: 1 } } },
            fields: 'userEnteredFormat(textFormat,backgroundColor,foregroundColor)',
          },
        }],
      }),
    });

    return Response.json({ spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});