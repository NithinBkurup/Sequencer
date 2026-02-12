// Client-side API calls

export async function loadOrders(params) {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`/api/orders?${query}`);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to load orders: ${error}`);
  }

  return await response.json();
}

export async function commitSequence(rows, username, clientid) {
  // Add username and clientid to each row
  const rowsWithUser = rows.map(r => ({
    ...r,
    username: username,
    clientid: clientid
  }));

  const response = await fetch('/api/sequence', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rowsWithUser)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to commit sequence: ${error}`);
  }
}

export async function commitResequence(rows, username, clientid) {
  // Add username and clientid to each row
  const rowsWithUser = rows.map(r => ({
    ...r,
    username: username,
    clientid: clientid
  }));

  const response = await fetch('/api/resequence', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rowsWithUser)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to commit resequence: ${error}`);
  }
}