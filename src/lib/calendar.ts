export async function getUpcomingEvents(token: string) {
  const timeMin = new Date().toISOString();
  const timeMax = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch calendar events');
  }
  
  return res.json();
}

export async function createEvent(token: string, title: string, startTime: Date, endTime: Date) {
  const event = {
    summary: title,
    start: { dateTime: startTime.toISOString() },
    end: { dateTime: endTime.toISOString() }
  };
  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(event)
  });
  
  if (!res.ok) {
    throw new Error('Failed to create calendar event');
  }
  
  return res.json();
}
