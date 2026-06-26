export interface SheetRow {
  timestamp: string;
  activityType: string;
  details: string;
  status: string;
}

export async function createLogisticsSheet(token: string): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const body = {
    properties: {
      title: 'Lamborghini Logistics & Fitting Tracker'
    },
    sheets: [
      {
        properties: {
          title: 'Logistics Tracker'
        },
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: [
              {
                values: [
                  { userEnteredValue: { stringValue: 'Timestamp' }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 } } },
                  { userEnteredValue: { stringValue: 'Activity Type' }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 } } },
                  { userEnteredValue: { stringValue: 'Details / Slot' }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 } } },
                  { userEnteredValue: { stringValue: 'Status' }, userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 } } }
                ]
              }
            ]
          }
        ]
      }
    ]
  };

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('Create Sheet failed:', errText);
    throw new Error('Failed to create logistics spreadsheet');
  }

  const data = await res.json();
  return {
    spreadsheetId: data.spreadsheetId,
    spreadsheetUrl: data.spreadsheetUrl
  };
}

export async function appendRowToSheet(token: string, spreadsheetId: string, row: SheetRow) {
  const range = 'Logistics Tracker!A:D';
  const body = {
    values: [[
      row.timestamp,
      row.activityType,
      row.details,
      row.status
    ]]
  };

  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('Append Row failed:', errText);
    throw new Error('Failed to append log to Google Sheet');
  }

  return res.json();
}

export async function getSheetRows(token: string, spreadsheetId: string): Promise<string[][]> {
  const range = 'Logistics Tracker!A2:D100';
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    console.warn('Read Rows failed - Sheet might be empty or range invalid');
    return [];
  }

  const data = await res.json();
  return data.values || [];
}
