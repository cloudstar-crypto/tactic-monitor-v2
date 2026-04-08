export async function getSheetData() {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!sheetId || !email || !privateKey) {
    throw new Error('Missing Google Sheets configuration');
  }

  try {
    const mockData = [
      { id: 1, name: 'Engineer 1', task: 'Task A', progress: 75, status: 'in-progress' },
      { id: 2, name: 'Engineer 2', task: 'Task B', progress: 50, status: 'in-progress' },
      { id: 3, name: 'Engineer 3', task: 'Task C', progress: 100, status: 'completed' },
    ];

    return mockData;
  } catch (error) {
    console.error('Google Sheets error:', error);
    throw error;
  }
}
